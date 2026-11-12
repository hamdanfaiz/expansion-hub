import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import crypto from 'node:crypto';
import { assertAuthConfiguration, verifyCredentials, createSessionToken, verifySessionToken, getConfiguredAccounts, getAccountVersion, safeCompareStrings, type AuthUser } from './src/utils/authToken.ts';
import { generateMySqlDump } from './src/utils/sqlExport.ts';
import { databaseWriteSchema } from './src/utils/databaseSchema.ts';
import { createDatabaseStore, createInitialPayload, RevisionConflictError, type DatabaseStore } from './src/utils/databaseStore.ts';

export function parseRevision(value?: string): number | null {
  if (!value || !/^(?:"\d+"|\d+)$/.test(value)) return null;
  const revision = Number(value.replaceAll('"', ''));
  return Number.isSafeInteger(revision) && revision >= 0 && revision < Number.MAX_SAFE_INTEGER ? revision : null;
}
function readSessionCookie(req: Request): string | null {
  for (const pair of (req.headers.cookie || '').split(';')) {
    const separator = pair.indexOf('=');
    if (pair.slice(0, separator).trim() === 'gpeh_session') {
      try { return decodeURIComponent(pair.slice(separator + 1).trim()); } catch { return null; }
    }
  }
  return null;
}
const asyncRoute = (handler: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => { Promise.resolve(handler(req, res)).catch(next); };

export interface AppOptions {
  env?: NodeJS.ProcessEnv;
  store?: DatabaseStore;
  rootDir?: string;
  serveFrontend?: boolean;
}

export async function createApp(options: AppOptions = {}) {
  const env = options.env || process.env;
  assertAuthConfiguration(env);
  const production = env.NODE_ENV === 'production';
  const rootDir = options.rootDir || process.cwd();
  if (env.APP_URL) {
    const appUrl = new URL(env.APP_URL);
    if (!['http:', 'https:'].includes(appUrl.protocol) || (production && appUrl.protocol !== 'https:')) throw new Error('APP_URL must be a valid HTTPS URL in production');
  }
  const store = options.store || createDatabaseStore(env);
  try { await store.initialize(); } catch (error) { await store.close(); throw error; }
  const app = express();
  app.disable('x-powered-by');
  app.disable('etag');
  const proxyHops = Number(env.TRUST_PROXY_HOPS || 0);
  if (!Number.isInteger(proxyHops) || proxyHops < 0 || proxyHops > 5) throw new Error('TRUST_PROXY_HOPS must be an integer between 0 and 5');
  app.set('trust proxy', proxyHops);
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'same-origin');
    if (production) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    next();
  });
  app.use('/api', (_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  app.use('/api', (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) { next(); return; }
    const origin = req.get('origin');
    if (origin) {
      const expected = env.APP_URL ? new URL(env.APP_URL).origin : `${req.protocol}://${req.get('host')}`;
      if (origin !== expected) { res.status(403).json({ error: 'INVALID_ORIGIN', message: 'Request origin is not allowed.' }); return; }
    }
    next();
  });
  app.use(express.json({ limit: '10mb', strict: true }));

  const revoked = new Map<string, number>();
  const tokenKey = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
  const extractUser = (req: Request): AuthUser | null => {
    const token = readSessionCookie(req);
    if (!token || revoked.has(tokenKey(token))) return null;
    const verified = verifySessionToken(token, env.SESSION_SECRET);
    if (!verified) return null;
    const account = getConfiguredAccounts(env).find((entry) => entry.username === verified.username);
    if (!account || !verified.accountVersion || !safeCompareStrings(verified.accountVersion, getAccountVersion(account, env.SESSION_SECRET!))) return null;
    return { username: account.username, displayName: account.displayName, role: account.role };
  };
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const user = extractUser(req);
    if (!user) { res.status(401).json({ error: 'Unauthorized', message: 'Sesi login tidak valid atau telah berakhir. Silakan login kembali.' }); return; }
    res.locals.user = user;
    next();
  };
  const requireRevision = (req: Request, res: Response): number | null => {
    const revision = parseRevision(req.get('if-match'));
    if (revision === null) res.status(428).json({ error: 'REVISION_REQUIRED', message: 'Load the current database and send its revision in If-Match.' });
    return revision;
  };
  const cookieOptions = { httpOnly: true, sameSite: 'lax' as const, secure: production, path: '/' };

  app.get('/api/health', asyncRoute(async (_req, res) => {
    await store.read();
    res.json({ status: 'ok', runtime: 'nodejs', databaseEngine: store.engine });
  }));

  const attempts = new Map<string, { count: number; resetAt: number }>();
  const rateWindow = 15 * 60 * 1000;
  app.post('/api/auth/login', (req, res) => {
    const now = Date.now();
    for (const [key, bucket] of attempts) if (bucket.resetAt <= now) attempts.delete(key);
    for (const [key, exp] of revoked) if (exp <= Math.floor(now / 1000)) revoked.delete(key);
    const username = typeof req.body?.username === 'string' ? req.body.username.trim().slice(0, 128) : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const keys = [`ip:${req.ip}`, `user:${username.toLowerCase()}`];
    const blocked = keys.some((key, i) => (attempts.get(key)?.count || 0) >= (i === 0 ? 10 : 30));
    if (blocked || attempts.size >= 10000) { res.setHeader('Retry-After', '900'); res.status(429).json({ error: 'TOO_MANY_ATTEMPTS', message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' }); return; }
    const user = username.length && password.length <= 1024 ? verifyCredentials(username, password, env) : null;
    if (!user) {
      keys.forEach((key) => { const bucket = attempts.get(key) || { count: 0, resetAt: now + rateWindow }; bucket.count++; attempts.set(key, bucket); });
      res.status(401).json({ authenticated: false, error: 'INVALID_CREDENTIALS', message: 'Username atau password tidak sesuai.' });
      return;
    }
    attempts.delete(keys[1]);
    const account = getConfiguredAccounts(env).find((entry) => entry.username === user.username)!;
    const rememberMe = req.body?.rememberMe === true;
    const ttl = rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 24;
    const token = createSessionToken(user, env.SESSION_SECRET, ttl, getAccountVersion(account, env.SESSION_SECRET!));
    res.cookie('gpeh_session', token, { ...cookieOptions, ...(rememberMe ? { maxAge: ttl * 1000 } : {}) });
    res.json({ authenticated: true, user });
  });
  app.post('/api/auth/logout', (req, res) => {
    const token = readSessionCookie(req);
    const session = verifySessionToken(token, env.SESSION_SECRET);
    if (token && session) revoked.set(tokenKey(token), session.exp);
    res.clearCookie('gpeh_session', cookieOptions);
    res.json({ ok: true });
  });
  app.get('/api/auth/me', (req, res) => {
    const user = extractUser(req);
    res.json(user ? { authenticated: true, user } : { authenticated: false });
  });
  app.get('/api/db', requireAuth, asyncRoute(async (_req, res) => {
    const db = await store.read();
    res.setHeader('ETag', `"${db.meta.revision}"`);
    res.json(db);
  }));
  app.put('/api/db', requireAuth, asyncRoute(async (req, res) => {
    const revision = requireRevision(req, res);
    if (revision === null) return;
    const parsed = databaseWriteSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: 'INVALID_DATABASE', message: 'Data tidak valid. Periksa field dan relasi record.', issues: parsed.error.issues.slice(0, 10).map(({ path, message }) => ({ path, message })) }); return; }
    const updated = await store.replace(parsed.data, revision);
    res.setHeader('ETag', `"${updated.meta.revision}"`);
    res.json({ ok: true, updatedAt: updated.meta.updatedAt, revision: updated.meta.revision });
  }));
  app.post('/api/db/reset', requireAuth, asyncRoute(async (req, res) => {
    if (production && env.ENABLE_DATABASE_RESET !== 'true') { res.status(403).json({ error: 'RESET_DISABLED', message: 'Database reset is disabled in production.' }); return; }
    const revision = requireRevision(req, res);
    if (revision === null) return;
    const initial = createInitialPayload(env.INITIAL_DATA_MODE === 'sample');
    const { markets, partners, activities, agreements, trainings, industrySegments } = initial;
    const updated = await store.replace({ markets, partners, activities, agreements, trainings, industrySegments }, revision);
    res.json(updated);
  }));
  app.get('/api/db/export.sql', requireAuth, asyncRoute(async (_req, res) => {
    res.type('application/sql').attachment(`gpeh-database-${new Date().toISOString().slice(0, 10)}.sql`).send(generateMySqlDump(await store.read()));
  }));
  app.get('/api/db/export.json', requireAuth, asyncRoute(async (_req, res) => {
    res.type('application/json').attachment(`gpeh-database-${new Date().toISOString().slice(0, 10)}.json`).send(JSON.stringify(await store.read(), null, 2));
  }));
  app.use('/api', (_req, res) => { res.status(404).json({ error: 'NOT_FOUND' }); });

  let closeVite: (() => Promise<void>) | undefined;
  if (options.serveFrontend !== false) {
    const distPath = path.resolve(rootDir, 'dist');
    const distIndex = path.join(distPath, 'index.html');
    if (production) {
      if (!fs.existsSync(distIndex)) { await store.close(); throw new Error('Production build missing. Run npm run build before starting.'); }
      app.use(express.static(distPath));
      app.get('*', (_req, res) => { res.sendFile(distIndex); });
    } else {
      const { createServer } = await import('vite');
      const vite = await createServer({ root: rootDir, server: { middlewareMode: true }, appType: 'spa' });
      closeVite = () => vite.close();
      app.use(vite.middlewares);
    }
  }
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof RevisionConflictError) { res.status(409).json({ error: 'REVISION_CONFLICT', message: error.message, revision: error.revision }); return; }
    const status = (error as { status?: number })?.status;
    if (status === 400 || status === 413) { res.status(status).json({ error: status === 413 ? 'PAYLOAD_TOO_LARGE' : 'INVALID_JSON' }); return; }
    console.error('API operation failed:', error instanceof Error ? error.message : 'Unknown failure');
    res.status(503).json({ error: 'STORAGE_UNAVAILABLE', message: 'Penyimpanan tidak tersedia. Perubahan belum tersimpan. Coba lagi.' });
  });
  return { app, store, close: async () => { await closeVite?.(); await store.close(); } };
}

export async function startServer() {
  const application = await createApp();
  const rawPort = process.env.PORT || '3000';
  const target = /^\d+$/.test(rawPort) ? Number(rawPort) : rawPort;
  const server = application.app.listen(target, () => console.log(`[Global Partner Expansion Hub] Server ready (${process.env.NODE_ENV || 'development'})`));
  const shutdown = () => server.close(() => { application.close().then(() => process.exit(0), () => process.exit(1)); });
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  startServer().catch((error) => { console.error('Failed to start server:', error instanceof Error ? error.message : 'Unknown error'); process.exitCode = 1; });
}
