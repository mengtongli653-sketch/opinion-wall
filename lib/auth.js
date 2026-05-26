import crypto from 'crypto';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'admin_session';
const ANON_COOKIE = 'anon_id';

function secret() {
  return process.env.SESSION_SECRET || 'dev-secret-change-me';
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
