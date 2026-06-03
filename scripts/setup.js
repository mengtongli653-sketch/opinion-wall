#!/usr/bin/env node
/**
 * One-shot bootstrap for a fresh checkout / new server.
 *
 *   npm run setup
 *
 * What it does (idempotent — safe to re-run):
 *   1. Copies .env.example → .env.local if .env.local is missing.
 *   2. If SESSION_SECRET is still the shipped default, generates a fresh
 *      48-character random one (cryptographically random, alphanumeric).
 *   3. If ADMIN_PASSWORD_HASH still matches the public default shipped in
 *      .env.example, re-salts the hash of "admin123" so this install's
 *      hash is unique to it. (Login still works with "admin123".)
 *
 * After this, your install has its own keys without you typing anything.
 * To pick a real admin password later, run `npm run hash`.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root         = process.cwd();
const envLocalPath = path.join(root, '.env.local');
const envExamplePath = path.join(root, '.env.example');

// The hash currently shipped in .env.example. We detect this exact string
// so we can replace it with a per-install one. If you ever rotate the
// example, update this constant.
const SHIPPED_DEFAULT_HASH =
  'ed901354245e50be78e5a6af995f624c:fc54e053d510245044270cea6919612c8d346842541a6fb3288125d3ca2bd43052fb3a9565332986789788e8e9c85113e698363e1e5769d3b6261be7f50a9e1b';

const DEFAULT_SECRETS = new Set([
  'dev-secret-change-me',
  'change-this-to-a-random-long-string-in-production',
]);

const ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function randomSecret(len = 48) {
  const out = new Array(len);
  const buf = crypto.randomBytes(len);
  for (let i = 0; i < len; i++) out[i] = ALPHABET[buf[i] % ALPHABET.length];
  return out.join('');
}

function hashAdmin123() {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync('admin123', salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

function info(msg) { console.log('[setup] ' + msg); }

// ---- 1. Ensure .env.local exists ----
if (!fs.existsSync(envLocalPath)) {
  if (!fs.existsSync(envExamplePath)) {
    console.error('[setup] Missing .env.example — cannot bootstrap.');
    process.exit(1);
  }
  fs.copyFileSync(envExamplePath, envLocalPath);
  info('Created .env.local from .env.example.');
} else {
  info('.env.local already exists — keeping your edits, only rotating defaults.');
}

let env = fs.readFileSync(envLocalPath, 'utf8');
let changed = false;

// ---- 2. Rotate SESSION_SECRET if still default ----
const secretMatch = env.match(/^SESSION_SECRET=(.+)$/m);
const currentSecret = secretMatch ? secretMatch[1].trim() : '';
if (!currentSecret || DEFAULT_SECRETS.has(currentSecret)) {
  const fresh = randomSecret(48);
  if (secretMatch) {
    env = env.replace(/^SESSION_SECRET=.*$/m, `SESSION_SECRET=${fresh}`);
  } else {
    env = env.trimEnd() + `\nSESSION_SECRET=${fresh}\n`;
  }
  info('Generated a fresh 48-character SESSION_SECRET.');
  changed = true;
} else {
  info('SESSION_SECRET already customised — left as-is.');
}

// ---- 3. Re-salt the shipped admin123 hash ----
if (env.includes(SHIPPED_DEFAULT_HASH)) {
  const fresh = hashAdmin123();
  env = env.replace(SHIPPED_DEFAULT_HASH, fresh);
  info('Re-salted the default admin123 hash so this install is unique.');
  info('Login still works with `admin123`. Run `npm run hash` to set a real password.');
  changed = true;
} else {
  info('ADMIN_PASSWORD_HASH already customised — left as-is.');
}

if (changed) {
  fs.writeFileSync(envLocalPath, env);
  info('Updated .env.local.');
}

console.log('');
console.log('Setup complete. Next steps:');
console.log('  npm run hash       # (optional) set a real admin password');
console.log('  npm run seed:words # populate the default blocked-word list');
console.log('  npm run dev:lan    # start the dev server on 0.0.0.0:3000');
console.log('');
