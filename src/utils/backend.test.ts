import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { createApp, parseRevision } from '../../server.ts';
import { assertAuthConfiguration, createSessionToken, verifyCredentials, verifySessionToken } from './authToken.ts';
import { databaseWriteSchema, getDatabaseCollections } from './databaseSchema.ts';
import { createInitialPayload, JsonDatabaseStore, RevisionConflictError, createDatabaseStore, type DatabaseStore } from './databaseStore.ts';

const makeEnv = (): NodeJS.ProcessEnv => ({ NODE_ENV: 'production', APP_USERNAME: 'test-admin', APP_PASSWORD: 'test-only-password-123!', SESSION_SECRET: 'test-only-session-secret-at-least-32-characters', APP_URL: 'https://app.example.test' });
async function fixture(overrides: NodeJS.ProcessEnv = {}, failing = false) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'gpeh-backend-'));
  const disk = new JsonDatabaseStore(directory, createInitialPayload());
  const store: DatabaseStore = failing ? { engine: disk.engine, initialize: () => disk.initialize(), read: () => disk.read(), close: () => disk.close(), replace: async () => { throw new Error('Simulated storage failure'); } } : disk;
  const env = { ...makeEnv(), ...overrides };
  const application = await createApp({ env, store, serveFrontend: false });
  const server = application.app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing test port');
  const base = `http://127.0.0.1:${address.port}`;
  const request = (endpoint: string, options?: RequestInit) => fetch(base + endpoint, options);
  const login = async () => {
    const response = await request('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: env.APP_USERNAME, password: env.APP_PASSWORD, rememberMe: false }) });
    assert.equal(response.status, 200);
    return { response, cookie: response.headers.get('set-cookie')!.split(';')[0] };
  };
  return { env, directory, disk, request, login, close: async () => { await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); await application.close(); await fs.rm(directory, { recursive: true, force: true }); } };
}

test('auth refuses absent/default configuration and unsigned sessions', () => {
  assert.throws(() => assertAuthConfiguration({}), /SESSION_SECRET/);
  assert.throws(() => assertAuthConfiguration({ ...makeEnv(), APP_PASSWORD: 'CHANGE_ME_IN_CPANEL_ENV' }), /password/);
  assert.throws(() => assertAuthConfiguration({ ...makeEnv(), SESSION_SECRET: 'REPLACE_WITH_LONG_RANDOM_SECRET_STRING_IN_CPANEL' }), /SESSION_SECRET/);
  assert.equal(verifyCredentials('admin', 'anything', {}), null);
  assert.throws(() => createSessionToken({ username: 'a', displayName: 'a', role: 'a' }), /secret/);
  assert.equal(verifySessionToken('anything.signature'), null);
  assertAuthConfiguration(makeEnv());
  assert.equal(parseRevision('"5"'), 5);
  assert.equal(parseRevision('5'), 5);
  for (const bad of ['*', 'W/"2"', '-1', '1.2', '"1', '9007199254740992']) assert.equal(parseRevision(bad), null);
  assert.throws(() => createDatabaseStore({ NODE_ENV: 'production' }), /Production requires/);
});

test('database schema rejects malformed, duplicate and dangling records', () => {
  const valid = getDatabaseCollections(createInitialPayload(true));
  assert.ok(databaseWriteSchema.safeParse(valid).success);
  assert.equal(databaseWriteSchema.safeParse({ ...valid, partners: [null] }).success, false);
  assert.equal(databaseWriteSchema.safeParse({ ...valid, markets: [...valid.markets, valid.markets[0]] }).success, false);
  assert.equal(databaseWriteSchema.safeParse({ ...valid, markets: [] }).success, false);
  assert.equal(databaseWriteSchema.safeParse({ ...valid, extra: 'unexpected' }).success, false);
  assert.equal(databaseWriteSchema.safeParse({ ...valid, partners: [{ ...valid.partners[0], scorecard: { ...valid.partners[0].scorecard, financialStability: 99 } }] }).success, false);
});

test('JSON store persists one concurrent revision and keeps previous snapshot backup', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'gpeh-storage-'));
  const store = new JsonDatabaseStore(directory, createInitialPayload());
  try {
    await store.initialize();
    const collections = getDatabaseCollections(await store.read());
    const results = await Promise.allSettled([store.replace(collections, 0), store.replace(collections, 0)]);
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
    const rejected = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
    assert.ok(rejected.reason instanceof RevisionConflictError);
    assert.equal((await store.read()).meta.revision, 1);
    assert.equal(JSON.parse(await fs.readFile(path.join(directory, 'gpeh-database.json.bak'), 'utf8')).meta.revision, 0);
    const competingWriter = new JsonDatabaseStore(directory, createInitialPayload());
    await assert.rejects(() => competingWriter.initialize(), { code: 'EEXIST' });
    await store.close();
    const reopened = new JsonDatabaseStore(directory, createInitialPayload());
    await reopened.initialize();
    assert.equal((await reopened.read()).meta.revision, 1);
    await reopened.close();
  } finally { await store.close(); await fs.rm(directory, { recursive: true, force: true }); }
});

test('corrupted existing JSON is preserved and startup fails instead of reseeding', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'gpeh-corrupt-'));
  const filename = path.join(directory, 'gpeh-database.json');
  const corrupted = '{"markets": [broken';
  await fs.writeFile(filename, corrupted);
  const store = new JsonDatabaseStore(directory, createInitialPayload());
  try { await assert.rejects(() => store.initialize()); assert.equal(await fs.readFile(filename, 'utf8'), corrupted); }
  finally { await store.close(); await fs.rm(directory, { recursive: true, force: true }); }
});

test('API uses secure cookies, rejects stale/invalid writes, and revokes logout sessions', async () => {
  const f = await fixture();
  try {
    assert.equal((await f.request('/api/db')).status, 401);
    const { response, cookie } = await f.login();
    assert.match(response.headers.get('set-cookie')!, /HttpOnly/);
    assert.match(response.headers.get('set-cookie')!, /Secure/);
    assert.equal((await response.json()).token, undefined);
    const headers = { Cookie: cookie, 'Content-Type': 'application/json' };
    const current = await f.request('/api/db', { headers });
    assert.equal(current.headers.get('cache-control'), 'no-store');
    const initial = await current.json();
    assert.equal(initial.meta.revision, 0);
    assert.equal(initial.markets.length, 0);
    const body = JSON.stringify(getDatabaseCollections(initial));
    assert.equal((await f.request('/api/db', { method: 'PUT', headers, body })).status, 428);
    assert.equal((await f.request('/api/db', { method: 'PUT', headers: { ...headers, 'If-Match': '"0"' }, body: JSON.stringify({ ...JSON.parse(body), partners: [null] }) })).status, 400);
    const writes = await Promise.all([0, 1].map(() => f.request('/api/db', { method: 'PUT', headers: { ...headers, 'If-Match': '"0"' }, body })));
    assert.deepEqual(writes.map((r) => r.status).sort(), [200, 409]);
    assert.equal((await f.disk.read()).meta.revision, 1);
    assert.equal((await f.request('/api/db/reset', { method: 'POST', headers: { ...headers, 'If-Match': '1' } })).status, 403);
    assert.equal((await f.request('/api/auth/logout', { method: 'POST', headers })).status, 200);
    assert.equal((await f.request('/api/db', { headers })).status, 401);
    const nextLogin = await f.login();
    assert.notEqual(nextLogin.cookie, cookie);
    assert.equal((await f.request('/api/db', { headers: { Cookie: nextLogin.cookie } })).status, 200);
    f.env.APP_PASSWORD = 'rotated-test-password-987!';
    assert.equal((await f.request('/api/db', { headers: { Cookie: nextLogin.cookie } })).status, 401);
  } finally { await f.close(); }
});

test('API blocks cross-origin mutations and throttles repeated login failures', async () => {
  const f = await fixture();
  try {
    assert.equal((await f.request('/api/auth/login', { method: 'POST', headers: { Origin: 'https://untrusted.example', 'Content-Type': 'application/json' }, body: '{}' })).status, 403);
    for (let i = 0; i < 10; i++) assert.equal((await f.request('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'wrong', password: 'incorrect' }) })).status, 401);
    const blocked = await f.request('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: f.env.APP_USERNAME, password: f.env.APP_PASSWORD }) });
    assert.equal(blocked.status, 429);
    assert.equal(blocked.headers.get('retry-after'), '900');
  } finally { await f.close(); }
});

test('API never acknowledges a failed storage write', async () => {
  const f = await fixture({}, true);
  try {
    const { cookie } = await f.login();
    const response = await f.request('/api/db', { method: 'PUT', headers: { Cookie: cookie, 'Content-Type': 'application/json', 'If-Match': '0' }, body: JSON.stringify(getDatabaseCollections(createInitialPayload())) });
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error, 'STORAGE_UNAVAILABLE');
    assert.equal((await f.disk.read()).meta.revision, 0);
  } finally { await f.close(); }
});
