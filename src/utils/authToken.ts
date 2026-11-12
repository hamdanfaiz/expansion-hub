import crypto from 'node:crypto';

export interface AuthUser {
  username: string;
  displayName: string;
  role: string;
}

export interface SessionPayload extends AuthUser {
  sid: string;
  iat: number;
  exp: number;
  accountVersion?: string;
}

export interface AuthEnvConfig {
  APP_USERNAME?: string;
  APP_PASSWORD?: string;
  APP_USER_NAME?: string;
  APP_USER_ROLE?: string;
  APP_USERS?: string;
  SESSION_SECRET?: string;
}

const DEFAULT_DISPLAY_NAME = 'Budi Santoso';
const DEFAULT_ROLE = 'Lead International BD';

const isPlaceholder = (value: string) => /change.?me|replace.?with|change.in.cpanel|my_password|your_password/i.test(value);

/** Configuration is mandatory; production never has a built-in login or signing key. */
export function assertAuthConfiguration(env: AuthEnvConfig): void {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.trim().length < 32 || isPlaceholder(env.SESSION_SECRET)) throw new Error('SESSION_SECRET must contain at least 32 random characters and cannot be a placeholder');
  if (Boolean(env.APP_USERNAME) !== Boolean(env.APP_PASSWORD)) throw new Error('APP_USERNAME and APP_PASSWORD must be configured together');
  const accounts = getConfiguredAccounts(env);
  if (!accounts.length) throw new Error('Configure APP_USERNAME/APP_PASSWORD or APP_USERS');
  const usernames = new Set<string>();
  for (const account of accounts) {
    if (account.password.length < 12 || isPlaceholder(account.password)) throw new Error('Each account needs a unique password of at least 12 characters');
    if (usernames.has(account.username.toLowerCase())) throw new Error('Configured usernames must be unique');
    usernames.add(account.username.toLowerCase());
  }
}

export function getAccountVersion(account: { username: string; password: string; displayName: string; role: string }, secret: string): string {
  return crypto.createHmac('sha256', secret).update(JSON.stringify(account)).digest('hex');
}

/**
 * Constant-time string comparison using SHA-256 digests so lengths and contents
 * do not leak via timing side-channels.
 */
export function safeCompareStrings(input: string, expected: string): boolean {
  const hashA = crypto.createHash('sha256').update(String(input)).digest();
  const hashB = crypto.createHash('sha256').update(String(expected)).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Parses configured user accounts from server environment variables.
 * Supports primary APP_USERNAME + APP_PASSWORD as well as multi-user APP_USERS
 * formatted as: "user1:pass1:Full Name:Role,user2:pass2:Full Name 2:Role 2"
 */
export function getConfiguredAccounts(env: AuthEnvConfig): Array<{
  username: string;
  password: string;
  displayName: string;
  role: string;
}> {
  const accounts: Array<{
    username: string;
    password: string;
    displayName: string;
    role: string;
  }> = [];

  const primaryUser = (env.APP_USERNAME || '').trim();
  const primaryPass = env.APP_PASSWORD || '';
  const primaryName = (env.APP_USER_NAME || '').trim() || DEFAULT_DISPLAY_NAME;
  const primaryRole = (env.APP_USER_ROLE || '').trim() || DEFAULT_ROLE;

  if (primaryUser && primaryPass) accounts.push({
    username: primaryUser,
    password: primaryPass,
    displayName: primaryName,
    role: primaryRole,
  });

  if (env.APP_USERS && env.APP_USERS.trim().length > 0) {
    const entries = env.APP_USERS.split(',');
    for (const raw of entries) {
      const parts = raw.split(':').map((p) => p.trim());
      if (parts.length >= 2 && parts.length <= 4 && parts[0] && parts[1]) {
        accounts.push({
          username: parts[0],
          password: parts[1],
          displayName: parts[2] || parts[0],
          role: parts[3] || 'International BD Team',
        });
      } else throw new Error('APP_USERS must use username:password:displayName:role entries separated by commas');
    }
  }

  return accounts;
}

/**
 * Verifies login credentials against server-side environment variables.
 * Returns the authenticated user profile on match, or null on failure.
 */
export function verifyCredentials(
  usernameInput: string,
  passwordInput: string,
  env: AuthEnvConfig
): AuthUser | null {
  const cleanUser = (usernameInput || '').trim();
  const rawPass = passwordInput || '';
  if (!cleanUser || !rawPass) return null;

  const accounts = getConfiguredAccounts(env);
  let matchedUser: AuthUser | null = null;

  for (const acc of accounts) {
    const userMatch = safeCompareStrings(cleanUser.toLowerCase(), acc.username.toLowerCase());
    const passMatch = safeCompareStrings(rawPass, acc.password);
    if (userMatch && passMatch && !matchedUser) {
      matchedUser = {
        username: acc.username,
        displayName: acc.displayName,
        role: acc.role,
      };
    }
  }

  return matchedUser;
}

/**
 * Creates a stateless HMAC-SHA256 signed session token safe for cPanel Passenger restarts.
 */
export function createSessionToken(
  user: AuthUser,
  secretInput?: string,
  ttlSeconds: number = 60 * 60 * 24,
  accountVersion?: string,
): string {
  const secret = (secretInput || '').trim();
  if (!secret) throw new Error('A session signing secret is required');
  const nowSec = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sid: crypto.randomUUID(),
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    iat: nowSec,
    exp: nowSec + ttlSeconds,
    accountVersion,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies an HMAC-SHA256 session token and checks expiration.
 */
export function verifySessionToken(
  token?: string | null,
  secretInput?: string,
  nowSecOverride?: number
): SessionPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.trim().split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return null;

  const secret = (secretInput || '').trim();
  if (!secret) return null;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  if (!safeCompareStrings(sigB64, expectedSig)) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as SessionPayload;
    const nowSec = nowSecOverride !== undefined ? nowSecOverride : Math.floor(Date.now() / 1000);
    if (!Number.isSafeInteger(decoded.exp) || decoded.exp <= nowSec || !Number.isSafeInteger(decoded.iat) || decoded.iat > nowSec) {
      return null;
    }
    if (typeof decoded.username !== 'string' || !decoded.username || typeof decoded.displayName !== 'string' || typeof decoded.role !== 'string') {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}
