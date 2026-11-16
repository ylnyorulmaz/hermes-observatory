// agents.mjs — per-agent state computation from state.db (spec §2, §3, §5).
// Five Hermes profiles (default, coder, qa, librarian, growth-hacker) derive
// their status from the most recent session; opencode-cli comes from
// opencode.mjs (process + opencode.db).

import { all, one } from './db.mjs';
import { agentTickets, boardSummary } from './kanban.mjs';
import { opencodeAgent } from './opencode.mjs';

const BUSY_THRESHOLD_S = 120; // active session + last activity ≤ 120s → busy
const OFFLINE_THRESHOLD_S = 30 * 60; // ended > 30 min ago → offline
const RECENT_LIMIT = 5;

export const HERMES_PROFILES = [
  { id: 'default', label: 'Orchestrator', role: 'orchestrator' },
  { id: 'coder', label: 'Coder', role: 'coder' },
  { id: 'qa', label: 'QA Engineer', role: 'qa' },
  { id: 'librarian', label: 'Librarian', role: 'librarian' },
  { id: 'growth-hacker', label: 'Growth Hacker', role: 'growth-hacker' },
];

// agent id → assignee strings used in kanban.db `tasks.assignee`.
const ASSIGNEE_MAP = {
  default: ['default', 'orchestrator'],
  coder: ['coder'],
  qa: ['qa', 'qa-engineer'],
  librarian: ['librarian'],
  'growth-hacker': ['growth-hacker', 'growth_hacker'],
};

function profileFilter(id) {
  if (id === 'default') {
    return "(profile_name IS NULL OR profile_name = '' OR profile_name = 'default')";
  }
  return 'profile_name = ?';
}

function profileParams(id) {
  return id === 'default' ? [] : [id];
}

function startOfTodaySeconds() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

function trunc(s, n = 120) {
  if (s == null) return '';
  const t = String(s).replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1) + '…' : t;
}

// Find the command for a terminal/bash tool call by matching the assistant
// message's tool_calls JSON against the tool_call_id.
function findCommand(sessionId, toolCallId) {
  if (!toolCallId) return null;
  const row = one(
    'state',
    `SELECT tool_calls FROM messages
      WHERE session_id = ? AND role = 'assistant'
        AND tool_calls IS NOT NULL AND tool_calls LIKE ?
      ORDER BY timestamp DESC LIMIT 1`,
    sessionId,
    `%${toolCallId}%`,
  );
  if (!row?.tool_calls) return null;
  try {
    const calls = JSON.parse(row.tool_calls);
    for (const c of calls) {
      const id = c.call_id || c.id;
      if (id && id !== toolCallId && id !== String(toolCallId)) continue;
      try {
        const args = JSON.parse(c.function?.arguments ?? '{}');
        if (args.command) return args.command;
        if (args.prompt) return args.prompt;
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

// Human summary of a tool message's content JSON (used when no command found).
function summarizeContent(toolName, content) {
  let obj = null;
  try {
    obj = JSON.parse(content);
  } catch {
    obj = null;
  }
  if (obj && typeof obj === 'object') {
    if (typeof obj.error === 'string' && obj.error) return trunc('hata: ' + obj.error);
    if (obj.resolved_path) return trunc('→ ' + obj.resolved_path);
    if (typeof obj.output === 'string' && obj.output.trim()) return trunc(obj.output);
    if (obj.goal) return trunc(obj.goal);
    if (obj.title) return trunc(obj.title);
    if (obj.summary) return trunc(obj.summary);
    if (obj.bytes_written != null) return `${obj.bytes_written} bytes yazıldı`;
  }
  if (typeof content === 'string' && content.trim()) return trunc(content);
  return toolName || '';
}

function describeTool(toolName, content, command) {
  if (command) return trunc(command);
  return summarizeContent(toolName, content);
}

function lastMessage(sessionId) {
  return one(
    'state',
    `SELECT role, tool_name, content, tool_call_id, timestamp
       FROM messages WHERE session_id = ?
      ORDER BY timestamp DESC, id DESC LIMIT 1`,
    sessionId,
  );
}

function lastActivity(sessionId) {
  const row = one(
    'state',
    'SELECT MAX(timestamp) ts FROM messages WHERE session_id = ?',
    sessionId,
  );
  return row?.ts ?? null;
}

function currentAction(sessionId, now) {
  const msg = lastMessage(sessionId);
  if (!msg) return null;
  if (msg.role === 'tool') {
    const command = findCommand(sessionId, msg.tool_call_id);
    return {
      kind: 'tool',
      tool: msg.tool_name ?? 'tool',
      detail: describeTool(msg.tool_name, msg.content, command),
      since: msg.timestamp ?? now,
      elapsed_s: Math.max(0, Math.floor(now - (msg.timestamp ?? now))),
    };
  }
  if (msg.role === 'assistant') {
    return { kind: 'thinking', detail: 'model yanıtı üretiyor' };
  }
  return null;
}

function sessionInfo(sess) {
  if (!sess) return null;
  return {
    id: sess.id,
    title: sess.title ?? '',
    model: sess.model ?? '',
    provider: sess.billing_provider ?? '',
    started_at: sess.started_at ?? 0,
    messages: sess.message_count ?? 0,
    tool_calls: sess.tool_call_count ?? 0,
    tokens_in: sess.input_tokens ?? 0,
    tokens_out: sess.output_tokens ?? 0,
    cost_usd: sess.estimated_cost_usd ?? 0,
  };
}

function recentTools(sessionId) {
  const rows = all(
    'state',
    `SELECT timestamp, tool_name, content, tool_call_id FROM messages
      WHERE session_id = ? AND role = 'tool'
      ORDER BY timestamp DESC LIMIT ?`,
    sessionId,
    RECENT_LIMIT,
  );
  return rows.map((r) => ({
    ts: r.timestamp ?? 0,
    tool: r.tool_name ?? 'tool',
    text: describeTool(r.tool_name, r.content, findCommand(sessionId, r.tool_call_id)),
  }));
}

function todayTotals(id) {
  const row = all(
    'state',
    `SELECT COUNT(*) n,
            COALESCE(SUM(input_tokens),0) tin,
            COALESCE(SUM(output_tokens),0) tout,
            COALESCE(SUM(estimated_cost_usd),0) cost
       FROM sessions WHERE ${profileFilter(id)} AND started_at >= ?`,
    ...profileParams(id),
    startOfTodaySeconds(),
  )[0] ?? { n: 0, tin: 0, tout: 0, cost: 0 };
  return {
    sessions: Number(row.n),
    tokens_in: Number(row.tin),
    tokens_out: Number(row.tout),
    cost_usd: Number(row.cost),
  };
}

function hermesAgent(profile, now) {
  const id = profile.id;
  const filter = profileFilter(id);
  const sess = one(
    'state',
    `SELECT * FROM sessions WHERE ${filter} ORDER BY started_at DESC LIMIT 1`,
    ...profileParams(id),
  );

  const active = sess && sess.ended_at == null;
  const activityTs = sess ? (lastActivity(sess.id) ?? sess.started_at) : null;

  let status;
  if (active) {
    const age = activityTs != null ? now - activityTs : 0;
    status = age <= BUSY_THRESHOLD_S ? 'busy' : 'idle';
  } else if (!sess) {
    status = 'offline';
  } else {
    status = now - sess.ended_at > OFFLINE_THRESHOLD_S ? 'offline' : 'idle';
  }

  const current = active || status === 'idle' ? currentAction(sess?.id, now) : null;

  return {
    id,
    label: profile.label,
    role: profile.role,
    status,
    current,
    session: sessionInfo(sess),
    today: todayTotals(id),
    recent: sess ? recentTools(sess.id) : [],
    tickets: agentTickets(ASSIGNEE_MAP[id] ?? []),
  };
}

/** Build all six agents + kanban summary + delegations + totals. */
export function buildSnapshot() {
  const now = Math.floor(Date.now() / 1000);

  const agents = [
    ...HERMES_PROFILES.map((p) => hermesAgent(p, now)),
    opencodeAgent(now),
  ];

  const kanban = boardSummary();
  const delegations = delegationsList();
  const totals = totalsFrom(agents);

  return {
    generated_at: now,
    source: 'live',
    agents,
    kanban,
    delegations,
    totals,
  };
}

function delegationsList() {
  const rows = all(
    'state',
    `SELECT delegation_id, state, dispatched_at, completed_at, task_json
       FROM async_delegations
      ORDER BY dispatched_at DESC LIMIT 10`,
  );
  return rows.map((r) => ({
    id: r.delegation_id,
    state: normalizeState(r.state),
    dispatched_at: r.dispatched_at ?? 0,
    completed_at: r.completed_at ?? null,
    task: taskSummary(r.task_json),
  }));
}

function normalizeState(state) {
  if (state === 'running' || state === 'completed' || state === 'failed') return state;
  return state ?? 'unknown';
}

function taskSummary(taskJson) {
  if (!taskJson) return '';
  try {
    const t = JSON.parse(taskJson);
    if (t?.goal) return trunc(t.goal, 120);
    if (t?.title) return trunc(t.title, 120);
  } catch {
    /* ignore */
  }
  return trunc(taskJson, 120);
}

function totalsFrom(agents) {
  let busy = 0;
  let idle = 0;
  let tokensToday = 0;
  let costToday = 0;
  for (const a of agents) {
    if (a.status === 'busy') busy += 1;
    else if (a.status === 'idle') idle += 1;
    tokensToday += (a.today?.tokens_in ?? 0) + (a.today?.tokens_out ?? 0);
    costToday += a.today?.cost_usd ?? 0;
  }
  const activeSessions = one(
    'state',
    'SELECT COUNT(*) n FROM sessions WHERE ended_at IS NULL',
  )?.n ?? 0;
  return {
    agents_busy: busy,
    agents_idle: idle,
    tokens_today: tokensToday,
    cost_today_usd: round2(costToday),
    active_sessions: Number(activeSessions),
  };
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}
