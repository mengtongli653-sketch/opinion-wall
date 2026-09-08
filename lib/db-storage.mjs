import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { emptyState } from './db-model.mjs';

const localQueues = new Map();

function withLocalLock(file, operation) {
  const previous = localQueues.get(file) || Promise.resolve();
  const pending = previous.then(operation, operation);
  const settled = pending.then(() => {}, () => {});
  localQueues.set(file, settled);
  settled.finally(() => {
    if (localQueues.get(file) === settled) localQueues.delete(file);
  });
  return pending;
}

export function createLocalStorage(file) {
  const filename = path.resolve(file);
  async function read() {
    let raw;
    try {
      raw = await fs.readFile(filename, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') return { version: null, state: emptyState() };
      throw new Error('Cannot read local board storage.', { cause: error });
    }
    let state;
    try { state = JSON.parse(raw); }
    catch (error) { throw new Error('Local board storage contains invalid JSON; it was left unchanged.', { cause: error }); }
    return { version: createHash('sha256').update(raw).digest('hex'), state };
  }
  return {
    read,
    compareAndSwap(version, state) {
      return withLocalLock(filename, async () => {
        const current = await read();
        if (current.version !== version) return false;
        const temporary = filename + '.' + randomUUID() + '.tmp';
        try {
          await fs.writeFile(temporary, JSON.stringify(state, null, 2), { encoding: 'utf8', flag: 'wx' });
          await fs.rename(temporary, filename);
        } catch (error) {
          await fs.unlink(temporary).catch(() => {});
          throw new Error('Cannot save local board storage.', { cause: error });
        }
        return true;
      });
    },
  };
}

export function createSupabaseStorage({ url, serviceKey, fetchImpl = globalThis.fetch }) {
  if (typeof window !== 'undefined') throw new Error('Board storage is available only on the server.');
  let origin;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash) throw new Error();
    origin = parsed.origin;
  } catch {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must be a valid HTTPS Supabase project URL.');
  }
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for board storage.');

  async function request(resource, options = {}) {
    let response;
    try {
      response = await fetchImpl(origin + '/rest/v1/' + resource, {
        ...options,
        cache: 'no-store',
        signal: AbortSignal.timeout(15000),
        headers: {
          apikey: serviceKey,
          Authorization: 'Bearer ' + serviceKey,
          'Content-Type': 'application/json',
        },
      });
    } catch {
      // Do not include request details or retry ambiguous writes: the server
      // may have committed a write before its response was lost.
      throw new Error('Cannot reach Supabase board storage. Please retry the request.');
    }
    if (!response.ok) {
      throw new Error('Supabase board storage request failed (HTTP ' + response.status + '). Check the project credentials and migration.');
    }
    try { return await response.json(); }
    catch { throw new Error('Supabase board storage returned an invalid response.'); }
  }

  return {
    async read() {
      const rows = await request('opinion_wall_state?id=eq.1&select=version,state');
      if (!Array.isArray(rows) || rows.length !== 1) {
        throw new Error('Supabase board storage is not initialized. Run scripts/supabase-migration.sql first.');
      }
      const row = rows[0];
      if (!Number.isSafeInteger(row.version) || row.version < 0 || !row.state || typeof row.state !== 'object' || Array.isArray(row.state)) {
        throw new Error('Supabase board storage contains an invalid state or version.');
      }
      return row;
    },
    async compareAndSwap(version, state) {
      const saved = await request('rpc/opinion_wall_compare_and_swap', {
        method: 'POST',
        body: JSON.stringify({ p_expected_version: version, p_state: state }),
      });
      if (typeof saved !== 'boolean') throw new Error('Supabase board storage returned an invalid save result.');
      return saved;
    },
  };
}

export function createStorage({ env = process.env, cwd = process.cwd(), fetchImpl } = {}) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (url || serviceKey || env.VERCEL) {
    if (!url || !serviceKey) {
      throw new Error('Supabase storage requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Vercel cannot save board data to a local file.');
    }
    return createSupabaseStorage({ url, serviceKey, fetchImpl });
  }
  return createLocalStorage(path.join(cwd, 'data.json'));
}
