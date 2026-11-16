// Delegations list from state.db async_delegations (read-only).
// Maps the Hermes delegation state vocabulary to the spec §5 shape.

import { openReadOnly, queryAll } from "./db.mjs";

const STATE_DB = "/root/.hermes/state.db";

function normalizeState(state) {
  const s = String(state || "").toLowerCase();
  if (s === "completed" || s === "done" || s === "succeeded") return "completed";
  if (s === "failed" || s === "error" || s === "cancelled") return "failed";
  return "running"; // running | pending | queued | ...
}

function taskText(taskJson, resultJson) {
  for (const raw of [taskJson, resultJson]) {
    if (!raw) continue;
    try {
      const j = JSON.parse(raw);
      if (j && typeof j === "object") {
        const t = j.goal || j.task || j.title || j.description || j.text;
        if (typeof t === "string" && t.trim()) return t.trim().slice(0, 200);
      } else if (typeof j === "string" && j.trim()) {
        return j.trim().slice(0, 200);
      }
    } catch {
      if (typeof raw === "string" && raw.trim()) return raw.trim().slice(0, 200);
    }
  }
  return "";
}

export function delegationsList() {
  const db = openReadOnly(STATE_DB);
  if (!db) return [];

  const rows = queryAll(
    db,
    `SELECT delegation_id, state, dispatched_at, completed_at, task_json, result_json
       FROM async_delegations
      ORDER BY dispatched_at DESC
      LIMIT 200`
  );

  return rows.map((r) => ({
    id: String(r.delegation_id),
    state: normalizeState(r.state),
    dispatched_at: typeof r.dispatched_at === "number" ? r.dispatched_at : 0,
    completed_at:
      typeof r.completed_at === "number" ? r.completed_at : null,
    task: taskText(r.task_json, r.result_json),
  }));
}
