import { createStateModel, emptyState } from './db-model.mjs';

export function createDatabase(storage, { maxAttempts = 8, pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) } = {}) {
  const names = Object.keys(createStateModel(emptyState()).operations);
  return Object.fromEntries(names.map((name) => [name, async (...args) => {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      // Every attempt reads the latest version. The pure model is recreated
      // after a conflict, so counters and derived values are never reused.
      const snapshot = await storage.read();
      const model = createStateModel(snapshot.state);
      const result = model.operations[name](...args);
      if (!model.dirty) return result;
      if (await storage.compareAndSwap(snapshot.version, model.state)) return result;
      if (attempt + 1 < maxAttempts) await pause(Math.min(150, 10 * (2 ** attempt)) + Math.floor(Math.random() * 10));
    }
    throw new Error('Board storage is busy. Your change was not saved; please try again.');
  }]));
}
