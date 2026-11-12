import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import mysql, { type Pool, type ResultSetHeader, type RowDataPacket } from 'mysql2/promise';
import { INITIAL_ACTIVITIES, INITIAL_AGREEMENTS, INITIAL_INDUSTRY_SEGMENTS, INITIAL_MARKETS, INITIAL_PARTNERS, INITIAL_TRAININGS } from '../data/seedData.ts';
import { MASTER_COUNTRIES } from '../data/countryRegionDatabase.ts';
import { databaseWriteSchema, getDatabaseCollections, type DatabaseWritePayload, type StoredDatabasePayload } from './databaseSchema.ts';

export class RevisionConflictError extends Error {
  constructor(public revision: number) { super('Data changed on the server. Reload before saving.'); }
}
export interface DatabaseStore {
  readonly engine: string;
  initialize(): Promise<void>;
  read(): Promise<StoredDatabasePayload>;
  replace(payload: DatabaseWritePayload, expectedRevision: number): Promise<StoredDatabasePayload>;
  close(): Promise<void>;
}

export function createInitialPayload(sample = false): StoredDatabasePayload {
  return makePayload(databaseWriteSchema.parse({
    markets: sample ? INITIAL_MARKETS : [], partners: sample ? INITIAL_PARTNERS : [], activities: sample ? INITIAL_ACTIVITIES : [],
    agreements: sample ? INITIAL_AGREEMENTS : [], trainings: sample ? INITIAL_TRAININGS : [], industrySegments: INITIAL_INDUSTRY_SEGMENTS,
  }), 0);
}
function makePayload(collections: DatabaseWritePayload, revision: number): StoredDatabasePayload {
  return {
    meta: { product: 'Global Partner Expansion Hub', version: '1.0.0', schemaVersion: 1, updatedAt: new Date().toISOString(), revision },
    ...collections, countries: MASTER_COUNTRIES,
  };
}
function parseStored(raw: string, revisionOverride?: number): StoredDatabasePayload {
  const parsed = JSON.parse(raw);
  const revision = revisionOverride ?? parsed?.meta?.revision;
  if (!Number.isSafeInteger(revision) || revision < 0 || !parsed?.meta?.updatedAt || !Number.isFinite(Date.parse(parsed.meta.updatedAt))) throw new Error('Invalid stored database metadata; restore a verified backup.');
  return { ...makePayload(getDatabaseCollections(parsed), revision), meta: { product: 'Global Partner Expansion Hub', version: '1.0.0', schemaVersion: 1, updatedAt: parsed.meta.updatedAt, revision } };
}
function nextRevision(expected: number): number {
  if (!Number.isSafeInteger(expected) || expected < 0 || expected >= Number.MAX_SAFE_INTEGER) throw new Error('Invalid database revision');
  return expected + 1;
}

/** Development-only single-process store. The lifetime lock refuses a second writer. */
export class JsonDatabaseStore implements DatabaseStore {
  readonly engine = 'JSON (development only)';
  private filename: string;
  private lock?: fs.FileHandle;
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private directory: string, private initial: StoredDatabasePayload) { this.filename = path.join(directory, 'gpeh-database.json'); }
  async initialize(): Promise<void> {
    await fs.mkdir(this.directory, { recursive: true });
    this.lock = await fs.open(path.join(this.directory, '.gpeh-writer.lock'), 'wx', 0o600);
    try {
      await this.lock.writeFile(String(process.pid));
      try { await this.read(); }
      catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
        await this.atomicWrite(this.filename, JSON.stringify(this.initial, null, 2));
      }
    } catch (err) { await this.close(); throw err; }
  }
  async read(): Promise<StoredDatabasePayload> { return parseStored(await fs.readFile(this.filename, 'utf8')); }
  replace(collections: DatabaseWritePayload, expected: number): Promise<StoredDatabasePayload> {
    const operation = this.queue.then(async () => {
      if (!this.lock) throw new Error('Database writer is not initialized');
      const current = await this.read();
      if (current.meta.revision !== expected) throw new RevisionConflictError(current.meta.revision);
      const updated = makePayload(databaseWriteSchema.parse(collections), nextRevision(expected));
      await this.atomicWrite(`${this.filename}.bak`, JSON.stringify(current, null, 2));
      await this.atomicWrite(this.filename, JSON.stringify(updated, null, 2));
      return updated;
    });
    this.queue = operation.catch(() => undefined);
    return operation;
  }
  private async atomicWrite(filename: string, data: string): Promise<void> {
    const temporary = `${filename}.${crypto.randomUUID()}.tmp`;
    try {
      const handle = await fs.open(temporary, 'wx', 0o600);
      try { await handle.writeFile(data, 'utf8'); await handle.sync(); } finally { await handle.close(); }
      await fs.rename(temporary, filename);
    } finally { await fs.rm(temporary, { force: true }); }
  }
  async close(): Promise<void> {
    await this.queue;
    if (this.lock) { await this.lock.close(); this.lock = undefined; await fs.rm(path.join(this.directory, '.gpeh-writer.lock'), { force: true }); }
  }
}

export class MysqlDatabaseStore implements DatabaseStore {
  readonly engine = 'MySQL/MariaDB';
  constructor(private pool: Pool, private initial: StoredDatabasePayload) {}
  async initialize(): Promise<void> {
    await this.pool.execute(`CREATE TABLE IF NOT EXISTS gpeh_app_state (
      id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
      revision BIGINT UNSIGNED NOT NULL,
      payload LONGTEXT NOT NULL,
      updated_at DATETIME(3) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await this.pool.execute('INSERT IGNORE INTO gpeh_app_state (id, revision, payload, updated_at) VALUES (1, 0, ?, UTC_TIMESTAMP(3))', [JSON.stringify(this.initial)]);
    await this.read();
  }
  async read(): Promise<StoredDatabasePayload> {
    const [rows] = await this.pool.execute<RowDataPacket[]>('SELECT revision, payload FROM gpeh_app_state WHERE id = 1');
    if (rows.length !== 1) throw new Error('Database snapshot is missing');
    const row = rows[0];
    return parseStored(String(row.payload), Number(row.revision));
  }
  async replace(collections: DatabaseWritePayload, expected: number): Promise<StoredDatabasePayload> {
    const updated = makePayload(databaseWriteSchema.parse(collections), nextRevision(expected));
    const [result] = await this.pool.execute<ResultSetHeader>('UPDATE gpeh_app_state SET payload = ?, revision = ?, updated_at = UTC_TIMESTAMP(3) WHERE id = 1 AND revision = ?', [JSON.stringify(updated), updated.meta.revision, expected]);
    if (result.affectedRows !== 1) throw new RevisionConflictError((await this.read()).meta.revision);
    return updated;
  }
  async close(): Promise<void> { await this.pool.end(); }
}

export function createDatabaseStore(env: NodeJS.ProcessEnv): DatabaseStore {
  const initial = createInitialPayload(env.INITIAL_DATA_MODE === 'sample');
  const hasMysql = Boolean(env.MYSQL_HOST || env.MYSQL_USER || env.MYSQL_DATABASE);
  if (hasMysql) {
    for (const key of ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE']) if (!env[key]) throw new Error(`${key} must be configured`);
    const port = Number(env.MYSQL_PORT || 3306);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('MYSQL_PORT is invalid');
    return new MysqlDatabaseStore(mysql.createPool({
      host: env.MYSQL_HOST, port, user: env.MYSQL_USER, password: env.MYSQL_PASSWORD, database: env.MYSQL_DATABASE,
      waitForConnections: true, connectionLimit: 5, queueLimit: 100, connectTimeout: 10000,
      supportBigNumbers: true, bigNumberStrings: true, charset: 'utf8mb4',
    }), initial);
  }
  if (env.NODE_ENV === 'production') throw new Error('Production requires MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD and MYSQL_DATABASE');
  if (!env.DATA_DIR || !path.isAbsolute(env.DATA_DIR)) throw new Error('Development JSON storage requires an absolute DATA_DIR outside the application directory');
  const root = path.resolve(process.cwd());
  const dataDir = path.resolve(env.DATA_DIR);
  if (dataDir === root || dataDir.startsWith(root + path.sep)) throw new Error('DATA_DIR must be outside the application directory');
  return new JsonDatabaseStore(dataDir, initial);
}
