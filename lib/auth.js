import crypto from 'crypto';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'admin_session';
const ANON_COOKIE = 'anon_id';

function secret() {
  return process.env.SESSION_SECRET || 'dev-secret-change-me';
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

export function verifyPassword(input) {
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

  // Legacy fallback: plaintext compare. We still use timingSafeEqual to
  // avoid leaking the password length / prefix through timing.
  const legacy = process.env.ADMIN_PASSWORD || 'admin123';
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
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [role, ts, sig] = parts;
  if (role !== 'admin') return false;
  return sign(`${role}.${ts}`) === sig;
}

export function isAdmin() {
  const c = cookies().get(SESSION_COOKIE);
  return verifyAdminToken(c?.value);
}

export function setAdminCookie(res) {
  const token = createAdminToken();
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAdminCookie(res) {
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
}

export function getOrCreateAnonId(res) {
  const existing = cookies().get(ANON_COOKIE)?.value;
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
