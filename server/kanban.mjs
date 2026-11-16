// Kanban board summary from /root/.hermes/kanban.db (read-only).

import { openReadOnly, queryAll } from "./db.mjs";

const KANBAN_DB = "/root/.hermes/kanban.db";

export const KANBAN_STATUSES = [
  "todo",
  "assigned",
  "in-progress",
  "review",
  "done",
  "blocked",
];

/**
 * Live kanban vocabulary: todo | ready | running | blocked | done.
 * API shape: todo | assigned | in-progress | review | done | blocked.
 */
export function normalizeStatus(status) {
  const s = String(status || "").toLowerCase();
  if (s === "ready") return "assigned";
  if (s === "running" || s === "in_progress" || s === "inprogress") {
    return "in-progress";
  }
  if (KANBAN_STATUSES.includes(s)) return s;
  return "todo";
}

function firstPullUrl(text) {
  if (!text) return null;
  const m = String(text).match(
    /https:\/\/github\.com\/[^\s)"'<>]+\/pull\/\d+/i
  );
  return m ? m[0] : null;
}

function repoFromText(text) {
  if (!text) return "";
  const m = String(text).match(
    /github\.com\/([^/\s)"'<>]+\/[^/\s)"'<>#?]+)/i
  );
  return m ? m[1].replace(/\.git$/i, "") : "";
}

function repoFromPath(path) {
  if (!path) return "";
  const m = String(path).match(/\/(?:repos?-hermes|repos|src)\/([^/]+)/);
  return m ? m[1] : "";
}

function taskRepo(row) {
  return (
    row.project_id ||
    repoFromText(row.body) ||
    repoFromText(row.result) ||
    repoFromPath(row.workspace_path) ||
    ""
  );
}

function taskUpdatedAt(row) {
  return (
    row.last_heartbeat_at ||
    row.completed_at ||
    row.started_at ||
    row.created_at ||
    0
  );
}

export function kanbanSummary() {
  const db = openReadOnly(KANBAN_DB);

  const counts = Object.fromEntries(KANBAN_STATUSES.map((s) => [s, 0]));

  if (!db) {
    return { counts, tasks: [] };
  }

  const rows = queryAll(
    db,
    `SELECT id, title, body, status, assignee, priority, project_id,
            workspace_path, created_at, started_at, completed_at,
            last_heartbeat_at, result
       FROM tasks
      ORDER BY COALESCE(last_heartbeat_at, completed_at, started_at, created_at) DESC
      LIMIT 500`
  );

  const tasks = rows.map((row) => {
    const status = normalizeStatus(row.status);
    counts[status] += 1;
    return {
      id: row.id,
      title: row.title || "",
      status,
      assignee: row.assignee || "",
      priority: Number(row.priority) || 0,
      repo: taskRepo(row),
      updated_at: taskUpdatedAt(row),
      pr_url: firstPullUrl(row.result) || firstPullUrl(row.body),
    };
  });

  return { counts, tasks };
}
