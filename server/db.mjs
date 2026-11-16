// server/db.mjs — read-only SQLite helpers (node:sqlite, Node 22.5+).
// Opens every DB with `readOnly: true`. Never writes to any Hermes state.

import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';

export const PATHS = {
  state: '/root/.hermes/state.db',
  kanban: '/root/.hermes/kanban.db',
  opencode: '/root/.local/share/opencode/opencode.db',
};

const cache = new Map();

export function dbFor(path) {
  if (!existsSync(path)) return null;
  if (!cache.has(path)) {
    try {
      cache.set(path, new DatabaseSync(path, { readOnly: true }));
    } catch {
      return null;
    }
  }
  return cache.get(path);
}

export function all(path, sql, params = []) {
  const db = dbFor(path);
  if (!db) return [];
  try {
    return db.prepare(sql).all(...params);
  } catch (e) {
    return [];
  }
}

export function one(path, sql, params = []) {
  const rows = all(path, sql, params);
  return rows[0] ?? null;
}

export function health() {
  return {
    state: existsSync(PATHS.state),
    kanban: existsSync(PATHS.kanban),
    opencode: existsSync(PATHS.opencode),
  };
}
