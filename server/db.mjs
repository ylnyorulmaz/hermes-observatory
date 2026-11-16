// db.mjs — read-only SQLite access helpers (node:sqlite, no external deps).
// Every DB is opened with `readOnly: true`. We never write to Hermes state.

import { DatabaseSync } from 'node:sqlite';

// Canonical paths (spec §2). Overridable via env for testing.
export const DB_PATHS = {
  state:
    process.env.HERMES_STATE_DB ||
    '/root/.hermes/state.db',
  kanban:
    process.env.HERMES_KANBAN_DB ||
    '/root/.hermes/kanban.db',
  opencode:
    process.env.HERMES_OPENCODE_DB ||
    process.env.OPENCODE_DB ||
    '/root/.local/share/opencode/opencode.db',
};

const cache = new Map();

/** Open (and cache) a DB read-only. Returns null if it cannot be opened. */
export function open(name) {
  if (cache.has(name)) return cache.get(name);
  let db = null;
  try {
    db = new DatabaseSync(DB_PATHS[name], { readOnly: true });
  } catch {
    db = null;
  }
  cache.set(name, db);
  return db;
}

/** Return all rows for a query, or [] on any error / missing DB. */
export function all(name, sql, ...params) {
  const db = open(name);
  if (!db) return [];
  try {
    return db.prepare(sql).all(...params);
  } catch {
    return [];
  }
}

/** Return a single row (or undefined) for a query. */
export function one(name, sql, ...params) {
  const db = open(name);
  if (!db) return undefined;
  try {
    return db.prepare(sql).get(...params);
  } catch {
    return undefined;
  }
}

/** Health probe: which DBs opened read-only successfully. */
export function health() {
  return {
    ok: true,
    dbs: {
      state: open('state') !== null,
      kanban: open('kanban') !== null,
      opencode: open('opencode') !== null,
    },
  };
}
