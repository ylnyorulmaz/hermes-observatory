// kanban.mjs — read-only board summary from kanban.db (spec §2, §5).

import { all, one } from './db.mjs';

// Actual status enum observed in kanban.db: ready, running, blocked, done.
// The snapshot contract exposes a fixed set of counters; we map the real
// statuses onto them (unknown statuses simply contribute to `todo`).
const STATUS_GROUPS = {
  todo: ['todo', 'triage', 'ready'],
  assigned: [], // assigned = "ready/todo AND has an owner", computed below
  'in-progress': ['running', 'in-progress'],
  review: ['review', 'needs-review'],
  done: ['done'],
  blocked: ['blocked'],
};

function inGroup(status, group) {
  return STATUS_GROUPS[group]?.includes(status) ?? false;
}

/** Best-effort "updated_at" for a task; kanban.db has no updated_at column. */
const UPDATED_SQL = 'COALESCE(last_heartbeat_at, started_at, created_at)';

export function boardSummary() {
  const rows = all(
    'kanban',
    `SELECT id, title, status, assignee, priority,
            ${UPDATED_SQL} AS updated_at,
            COALESCE(project_id, tenant) AS repo
       FROM tasks
      ORDER BY ${UPDATED_SQL} DESC
      LIMIT 200`,
  );

  const counts = {
    todo: 0,
    assigned: 0,
    'in-progress': 0,
    review: 0,
    done: 0,
    blocked: 0,
  };

  for (const r of rows) {
    const st = r.status ?? '';
    if (inGroup(st, 'done')) counts.done += 1;
    else if (inGroup(st, 'blocked')) counts.blocked += 1;
    else if (inGroup(st, 'in-progress')) counts['in-progress'] += 1;
    else if (inGroup(st, 'review')) counts.review += 1;
    else counts.todo += 1;

    if (r.assignee && (inGroup(st, 'todo') || st === '' )) counts.assigned += 1;
  }

  return {
    counts,
    tasks: rows.map((r) => ({
      id: r.id,
      title: r.title ?? '',
      status: r.status ?? '',
      assignee: r.assignee ?? null,
      priority: r.priority ?? 0,
      updated_at: r.updated_at ?? 0,
      repo: r.repo ?? null,
    })),
  };
}

/**
 * Tasks relevant to a single agent (spec §3 hover "ticket" + §5 agent.tickets).
 * `assignees` is the list of assignee strings that map to this agent.
 */
export function agentTickets(assignees) {
  if (!assignees || assignees.length === 0) {
    return { assigned: 0, in_progress: 0, titles: [] };
  }
  const ph = assignees.map(() => '?').join(',');
  const rows = all(
    'kanban',
    `SELECT id, title, status FROM tasks
      WHERE assignee IN (${ph}) AND status != 'done'
      ORDER BY ${UPDATED_SQL} DESC
      LIMIT 20`,
    ...assignees,
  );
  const inProgress = rows.filter((r) => inGroup(r.status, 'in-progress'));
  return {
    assigned: rows.length,
    in_progress: inProgress.length,
    titles: inProgress.map((r) => r.title ?? '').filter(Boolean).slice(0, 5),
  };
}

export function kanbanCounts() {
  return boardSummary().counts;
}

// keep `one` import referenced for symmetry with other readers if needed later
void one;
