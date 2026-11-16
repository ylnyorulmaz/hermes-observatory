// server/snapshot.mjs — assemble the §5 /api/observatory/snapshot payload.
import { computeAgents, tsSec } from './agents.mjs';
import { boardSummary, ticketsForAssignee } from './kanban.mjs';
import { all, PATHS } from './db.mjs';

const ASSIGNEE_VARIANTS = {
  default: ['default'],
  coder: ['coder'],
  qa: ['qa', 'qa-engineer'],
  librarian: ['librarian'],
  'growth-hacker': ['growth-hacker', 'growth_hacker'],
  'opencode-cli': ['opencode-cli', 'opencode'],
};

export function delegations() {
  return all(
    PATHS.state,
    `SELECT delegation_id, state, dispatched_at, completed_at, task_json
       FROM async_delegations ORDER BY dispatched_at DESC LIMIT 50`,
  ).map((d) => {
    let task = '';
    try {
      task = String(JSON.parse(d.task_json || '{}').goal || '').slice(0, 120);
    } catch {
      /* ignore */
    }
    return {
      id: d.delegation_id,
      state: d.state || 'unknown',
      dispatched_at: tsSec(d.dispatched_at) || 0,
      completed_at: tsSec(d.completed_at) || null,
      task,
    };
  });
}

export function buildSnapshot() {
  const agents = computeAgents();
  for (const a of agents) {
    const variants = ASSIGNEE_VARIANTS[a.id] || [a.id];
    let assigned = 0;
    let inProgress = 0;
    const titles = [];
    for (const v of variants) {
      const t = ticketsForAssignee(v);
      assigned += t.assigned;
      inProgress += t.in_progress;
      titles.push(...t.titles);
    }
    a.tickets = { assigned, in_progress: inProgress, titles: [...new Set(titles)].slice(0, 8) };
  }

  const totals = {
    agents_busy: agents.filter((a) => a.status === 'busy').length,
    agents_idle: agents.filter((a) => a.status === 'idle').length,
    tokens_today: agents.reduce((s, a) => s + (a.today?.tokens_in || 0) + (a.today?.tokens_out || 0), 0),
    cost_today_usd: agents.reduce((s, a) => s + (a.today?.cost_usd || 0), 0),
    active_sessions: agents.filter((a) => a.session && a.status !== 'offline').length,
  };

  return {
    generated_at: Date.now() / 1000,
    source: 'live',
    agents,
    kanban: boardSummary(),
    delegations: delegations(),
    totals,
  };
}
