// Read-only SQLite helpers using node:sqlite (Node 22+).
// All opens use DatabaseSync(path, { readOnly: true }) — never writes.

import { DatabaseSync } from "node:sqlite";
import { existsSync } from "node:fs";

/**
 * Open a SQLite database in read-only mode.
 * Returns null if the file is missing or cannot be opened.
 */
export function openReadOnly(path) {
  if (!path || !existsSync(path)) return null;
  try {
    return new DatabaseSync(path, { readOnly: true });
  } catch (err) {
    console.error("[db] open failed", path, err.message);
    return null;
  }
}

/**
 * Query helper: runs a SQL statement and returns all rows as objects.
 */
export function queryAll(db, sql, ...params) {
  if (!db) return [];
  try {
    return db.prepare(sql).all(...params);
  } catch (err) {
    console.error("[db] query failed", err.message);
    return [];
  }
}

/**
 * Query helper: returns the first row or null.
 */
export function queryOne(db, sql, ...params) {
  if (!db) return null;
  try {
    return db.prepare(sql).get(...params) ?? null;
  } catch (err) {
    console.error("[db] query failed", err.message);
    return null;
  }
}
