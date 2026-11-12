import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from './databaseSync.ts';

type Snapshot = { records: number[] };
const snapshot = (n: number): Snapshot => ({ records: [n] });
const parse = (value: unknown) => ({ records: (value as Snapshot).records });
const dbResponse = (n: number, revision: number) => Response.json({ ...snapshot(n), meta: { revision, updatedAt: '2026-11-12T00:00:00Z' } });
const savedResponse = (revision: number) => Response.json({ ok: true, revision, updatedAt: '2026-11-12T00:00:01Z' });
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
};

test('does not write before hydration succeeds or write unchanged hydrated data', async () => {
  const loading = deferred<Response>();
  let writes = 0;
  const sync = new DatabaseSync<Snapshot>((async (_url, options) => {
    if (options?.method === 'PUT') { writes++; return savedResponse(2); }
    return loading.promise;
  }) as typeof fetch, parse, () => {});
  const result = sync.load();
  sync.stage(snapshot(99));
  assert.equal(await sync.save(), false);
  assert.equal(writes, 0);
  loading.resolve(dbResponse(1, 1));
  const loaded = await result;
  sync.stage(loaded);
  assert.equal(await sync.save(), true);
  assert.equal(writes, 0);
  assert.equal(sync.dirty, false);
});

test('failed hydration blocks writes, including after a previously loaded revision', async () => {
  let fail = false;
  let writes = 0;
  const sync = new DatabaseSync<Snapshot>((async (_url, options) => {
    if (options?.method === 'PUT') { writes++; return savedResponse(2); }
    return fail ? new Response(null, { status: 500 }) : dbResponse(1, 1);
  }) as typeof fetch, parse, () => {});
  await sync.load();
  fail = true;
  await assert.rejects(sync.load());
  sync.stage(snapshot(2));
  assert.equal(await sync.save(), false);
  assert.equal(writes, 0);
  assert.equal(sync.state.status, 'error');
});

test('serializes in-flight changes and uses each confirmed revision for the next write', async () => {
  const firstWrite = deferred<Response>();
  const requests: RequestInit[] = [];
  let active = 0;
  let maxActive = 0;
  const sync = new DatabaseSync<Snapshot>((async (_url, options) => {
    if (options?.method !== 'PUT') return dbResponse(1, 1);
    requests.push(options);
    maxActive = Math.max(maxActive, ++active);
    const result = requests.length === 1 ? await firstWrite.promise : savedResponse(3);
    active--;
    return result;
  }) as typeof fetch, parse, () => {});
  await sync.load();
  sync.stage(snapshot(2));
  const saving = sync.save();
  sync.stage(snapshot(3));
  assert.equal(sync.save(), saving);
  firstWrite.resolve(savedResponse(2));
  assert.equal(await saving, true);
  assert.equal(maxActive, 1);
  assert.deepEqual(requests.map((r) => (r.headers as Record<string, string>)['If-Match']), ['"1"', '"2"']);
  assert.deepEqual(requests.map((r) => JSON.parse(r.body as string)), [snapshot(2), snapshot(3)]);
  assert.equal(sync.dirty, false);
});

test('a conflict preserves the draft and blocks all later saves until explicit reload', async () => {
  let writes = 0;
  const sync = new DatabaseSync<Snapshot>((async (_url, options) => {
    if (options?.method === 'PUT') { writes++; return new Response(null, { status: 409 }); }
    return dbResponse(1, 1);
  }) as typeof fetch, parse, () => {});
  await sync.load();
  sync.stage(snapshot(2));
  assert.equal(await sync.save(), false);
  sync.stage(snapshot(3));
  assert.equal(await sync.save(), false);
  assert.equal(writes, 1);
  assert.equal(sync.dirty, true);
  assert.equal(sync.state.status, 'conflict');
});

test('expired session keeps unsaved changes and allows an explicit retry after reauthentication', async () => {
  let authenticated = false;
  let writes = 0;
  const sync = new DatabaseSync<Snapshot>((async (_url, options) => {
    if (options?.method !== 'PUT') return dbResponse(1, 1);
    writes++;
    return authenticated ? savedResponse(2) : new Response(null, { status: 401 });
  }) as typeof fetch, parse, () => {});
  await sync.load();
  sync.stage(snapshot(2));
  assert.equal(await sync.save(), false);
  assert.equal(sync.state.message, 'SESSION_EXPIRED');
  assert.equal(sync.dirty, true);
  sync.stage(snapshot(3));
  assert.equal(sync.state.status, 'error');
  assert.equal(writes, 1);
  authenticated = true;
  assert.equal(await sync.save(), true);
  assert.equal(sync.dirty, false);
});

test('a server-disabled reset fails without replacing the current snapshot', async () => {
  const sync = new DatabaseSync<Snapshot>((async (_url, options) => options?.method === 'POST'
    ? new Response(null, { status: 403 }) : dbResponse(1, 1)) as typeof fetch, parse, () => {});
  await sync.load();
  assert.equal(await sync.reset(), false);
  assert.equal(sync.state.message, 'RESET_DISABLED');
  assert.equal(sync.dirty, false);
});

test('schema property normalization does not cause repeated saves for a changed React record', async () => {
  type Data = { record: { id: string; title: string } };
  const normalize = (value: unknown): Data => {
    const record = (value as Data).record;
    return { record: { id: record.id, title: record.title } };
  };
  let writes = 0;
  const sync = new DatabaseSync<Data>((async (_url, options) => {
    if (options?.method !== 'PUT') return Response.json({ record: { id: 'market-1', title: 'Old' }, meta: { revision: 1 } });
    writes++;
    // Bound unexpected requests so a regression fails without flooding an API.
    assert.equal(writes, 1, 'A single changed snapshot must only be saved once');
    assert.deepEqual(JSON.parse(options.body as string), { record: { id: 'market-1', title: 'New' } });
    return savedResponse(2);
  }) as typeof fetch, normalize, () => {});
  await sync.load();
  sync.stage({ record: { title: 'New', id: 'market-1' } });
  assert.equal(await sync.save(), true);
  assert.equal(sync.dirty, false);
  sync.stage({ record: { title: 'New', id: 'market-1' } });
  assert.equal(await sync.save(), true);
  assert.equal(sync.dirty, false);
  assert.equal(writes, 1);
});

test('invalid staged data reports a validation error instead of throwing from a React effect', async () => {
  let writes = 0;
  const validate = (value: unknown): Snapshot => {
    const result = parse(value);
    if (result.records.some((n) => n < 0)) throw new Error('Invalid record');
    return result;
  };
  const sync = new DatabaseSync<Snapshot>((async (_url, options) => {
    if (options?.method === 'PUT') { writes++; return savedResponse(2); }
    return dbResponse(1, 1);
  }) as typeof fetch, validate, () => {});
  await sync.load();
  assert.doesNotThrow(() => sync.stage(snapshot(-1)));
  assert.equal(sync.state.status, 'error');
  assert.equal(sync.state.message, 'INVALID_DATABASE');
  assert.equal(await sync.save(), false);
  assert.equal(writes, 0);
  assert.equal(sync.dirty, true);
  assert.equal(sync.state.message, 'INVALID_DATABASE');
});
