import crypto from 'crypto';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'admin_session';
const ANON_COOKIE = 'anon_id';

const DEFAULT_SECRETS = new Set([
  'dev-secret-change-me',
  'change-this-to-a-random-long-string-in-production',
]);

let _secretWarned = false;

function secret() {
  const configured = process.env.SESSION_SECRET;
  if (configured && !DEFAULT_SECRETS.has(configured)) return configured;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) {
    return crypto.createHmac('sha256', serviceKey)
      .update('opinion-wall/admin-session/v1').digest('hex');
  }
  if (process.env.VERCEL) {
    throw new Error('A secure session signing key is required on Vercel.');
  }
  const s = configured || 'dev-secret-change-me';
  if (
    !_secretWarned &&
    process.env.NODE_ENV === 'production' &&
    DEFAULT_SECRETS.has(s)
  ) {
    _secretWarned = true;
    console.warn(
      '[auth] SESSION_SECRET is still the default in production. ' +
      'Generate a real one with `npm run setup` or paste a 48-char random ' +
      'string into .env.local. Without this, anyone who guesses the default ' +
      'can forge admin sessions.'
    );
  }
  return s;
}

// ---------- Admin password verification (scrypt + timingSafeEqual) ----------
//
// Storage format in env:    ADMIN_PASSWORD_HASH=<salt-hex>:<hash-hex>
//   salt: 16 random bytes, hex-encoded (32 chars)
//   hash: scrypt(password, salt, keylen=64), hex-encoded (128 chars)
//
// Use `npm run hash` to generate a new line for .env.local.
//
// If ADMIN_PASSWORD_HASH is absent, we fall back to plaintext
// ADMIN_PASSWORD (legacy) but emit a one-time warning. This keeps existing
// dev setups working through the migration window.

let _legacyWarned = false;

function fromHex(s) {
  try { return Buffer.from(String(s || ''), 'hex'); }
  catch { return Buffer.alloc(0); }
}

export async function verifyPassword(input) {
  const candidate = String(input || '');
  const hashLine = process.env.ADMIN_PASSWORD_HASH;

  if (hashLine) {
    const [saltHex, hashHex] = String(hashLine).split(':');
    if (!saltHex || !hashHex) return false;
    const salt = fromHex(saltHex);
    const expected = fromHex(hashHex);
    if (salt.length === 0 || expected.length === 0) return false;
    let computed;
    try {
      computed = crypto.scryptSync(candidate, salt, expected.length);
    } catch {
      return false;
    }
    if (computed.length !== expected.length) return false;
    return crypto.timingSafeEqual(computed, expected);
  }

  // Preserve the existing Vercel editor password, stored by the legacy
  // board in Supabase. Only server credentials are used for this RPC.
  const legacyPassword = process.env.ADMIN_PASSWORD;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!legacyPassword && supabaseUrl && serviceKey) {
    try {
      const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/check_admin_password`, {
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input_password: candidate }),
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) return false;
      return (await response.json()) === true;
    } catch {
      return false;
    }
  }
  // Never enable the local development password on the hosted site.
  if (!legacyPassword && process.env.VERCEL) return false;

  // Legacy fallback: plaintext compare. We still use timingSafeEqual to
  // avoid leaking the password length / prefix through timing.
  const legacy = legacyPassword || 'admin123';
  if (!_legacyWarned) {
    _legacyWarned = true;
    console.warn(
      '[auth] ADMIN_PASSWORD_HASH is not set; falling back to plaintext ' +
      'ADMIN_PASSWORD. Run `npm run hash` and paste the result into .env.local.'
    );
  }
  const a = Buffer.from(candidate);
  const b = Buffer.from(legacy);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function sign(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('hex');
}

export function createAdminToken() {
  const payload = `admin.${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminToken(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [role, ts, sig] = parts;
  if (role !== 'admin') return false;
  const issuedAt = Number(ts);
  const age = Date.now() - issuedAt;
  if (!Number.isFinite(issuedAt) || age < 0 || age > 60 * 60 * 24 * 7 * 1000) return false;
  if (!/^[a-f0-9]{64}$/.test(sig)) return false;
  try {
    const expected = Buffer.from(sign(`${role}.${ts}`), 'hex');
    return crypto.timingSafeEqual(expected, Buffer.from(sig, 'hex'));
  } catch {
    return false;
  }
}

export async function isAdmin() {
  const c = (await cookies()).get(SESSION_COOKIE);
  return verifyAdminToken(c?.value);
}

export function setAdminCookie(res) {
  const token = createAdminToken();
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: !!process.env.VERCEL,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAdminCookie(res) {
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
}

export async function getOrCreateAnonId(res) {
  const existing = (await cookies()).get(ANON_COOKIE)?.value;
  if (existing) return existing;
  const id = crypto.randomBytes(3).toString('hex').toUpperCase();
  if (res) {
    res.cookies.set(ANON_COOKIE, id, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return id;
}

export const COOKIES = { SESSION_COOKIE, ANON_COOKIE };
