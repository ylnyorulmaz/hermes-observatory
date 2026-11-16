// server/kanban.mjs — board summary + per-agent ticket links (read-only).
import { all, PATHS } from './db.mjs';

const STATUS_MAP = {
  todo: 'todo',
  triage: 'todo',
  ready: 'assigned',
  assigned: 'assigned',
  running: 'in-progress',
  'in-progress': 'in-progress',
  in_progress: 'in-progress',
  review: 'review',
  done: 'done',
  completed: 'done',
  blocked: 'blocked',
};

function mapStatus(s) {
  return STATUS_MAP[String(s || '').toLowerCase()] || 'todo';
}

export function boardSummary() {
  const rows = all(PATHS.kanban, `SELECT status, COUNT(*) AS n FROM tasks GROUP BY status`);
  const counts = { todo: 0, assigned: 0, 'in-progress': 0, review: 0, done: 0, blocked: 0 };
  for (const r of rows) {
    const k = mapStatus(r.status);
    counts[k] = (counts[k] || 0) + (Number(r.n) || 0);
  }

  const tasks = all(
    PATHS.kanban,
    `SELECT id, title, status, assignee, priority, created_at, started_at,
            completed_at, last_heartbeat_at, workspace_path, project_id
       FROM tasks ORDER BY COALESCE(last_heartbeat_at, started_at, created_at) DESC LIMIT 200`,
  ).map((t) => ({
    id: t.id,
    title: t.title,
    status: mapStatus(t.status),
    assignee: t.assignee || 'default',
    priority: Number(t.priority) || 0,
    updated_at: Number(t.last_heartbeat_at || t.started_at || t.created_at) || 0,
    repo: t.project_id || t.workspace_path || null,
  }));

  return { counts, tasks };
}

export function ticketsForAssignee(assignee) {
  const rows = all(
    PATHS.kanban,
    `SELECT id, title, status FROM tasks
      WHERE assignee = ? AND status IN ('ready','running','assigned','in-progress')
      ORDER BY priority DESC, created_at DESC LIMIT 20`,
    [assignee],
  );
  let inProgress = 0;
  let assigned = 0;
  const titles = [];
  for (const r of rows) {
    const s = mapStatus(r.status);
    if (s === 'in-progress') inProgress++;
    else if (s === 'assigned') assigned++;
    titles.push(r.title);
  }
  return { assigned, in_progress: inProgress, titles };
}
