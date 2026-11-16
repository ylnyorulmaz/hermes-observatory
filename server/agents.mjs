// server/agents.mjs — per-agent state computation (§3 busy/idle/offline rules).
import { all, one, PATHS } from './db.mjs';
import { execSync } from 'node:child_process';

// Canonical agent roster. Hermes profiles + the OpenCode CLI worker.
export const HERMES_AGENTS = [
  { id: 'default', label: 'Orchestrator', role: 'orchestrator' },
  { id: 'coder', label: 'Coder', role: 'coder' },
  { id: 'qa', label: 'QA', role: 'qa' },
  { id: 'librarian', label: 'Librarian', role: 'librarian' },
  { id: 'growth-hacker', label: 'Growth Hacker', role: 'growth-hacker' },
];

const BUSY_WINDOW_S = 120;
const OFFLINE_WINDOW_S = 30 * 60;

// Normalize a possibly-ms epoch value to float seconds.
export function tsSec(v) {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n > 1e12 ? n / 1000 : n;
}

function startOfTodaySec() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime() / 1000;
}

function profileClause(id) {
  if (id === 'default') {
    return "(profile_name IS NULL OR profile_name = '' OR profile_name = 'default')";
  }
  // tolerate the old 'qa-engineer' spelling alongside 'qa'
  const variants = [id, `${id}-engineer`]
    .map((v) => `'${v.replace(/'/g, "''")}'`)
    .join(', ');
  return `profile_name IN (${variants})`;
}

function latestSession(id) {
  return one(
    PATHS.state,
    `SELECT * FROM sessions WHERE ${profileClause(id)} ORDER BY started_at DESC LIMIT 1`,
  );
}

function lastActivityTs(sessionId) {
  const r = one(
    PATHS.state,
    `SELECT MAX(timestamp) AS ts FROM messages WHERE session_id = ?`,
    [sessionId],
  );
  return tsSec(r && r.ts) ?? null;
}

function currentAction(sessionId) {
  const toolMsg = one(
    PATHS.state,
    `SELECT role, tool_name, content, timestamp
       FROM messages
      WHERE session_id = ? AND (role = 'tool' OR tool_name IS NOT NULL)
      ORDER BY timestamp DESC LIMIT 1`,
    [sessionId],
  );
  if (toolMsg) {
    const since = tsSec(toolMsg.timestamp) ?? Date.now() / 1000;
    const raw = String(toolMsg.content || '');
    const detail = raw.slice(0, 120) || `ran ${toolMsg.tool_name || 'tool'}`;
    return {
      kind: 'tool',
      tool: toolMsg.tool_name || 'tool',
      detail,
      since,
      elapsed_s: Math.max(0, Math.round(Date.now() / 1000 - since)),
    };
  }
  const last = one(
    PATHS.state,
    `SELECT role, timestamp FROM messages WHERE session_id = ? ORDER BY timestamp DESC LIMIT 1`,
    [sessionId],
  );
  if (last && last.role === 'assistant') {
    const since = tsSec(last.timestamp) ?? Date.now() / 1000;
    return {
      kind: 'thinking',
      tool: null,
      detail: 'model yanıtı üretiyor',
      since,
      elapsed_s: Math.max(0, Math.round(Date.now() / 1000 - since)),
    };
  }
  return null;
}

function recentToolCalls(sessionId) {
  const rows = all(
    PATHS.state,
    `SELECT timestamp AS ts, tool_name AS tool, content AS text
       FROM messages
      WHERE session_id = ? AND (role = 'tool' OR tool_name IS NOT NULL)
      ORDER BY timestamp DESC LIMIT 5`,
    [sessionId],
  );
  return rows.map((r) => ({
    ts: tsSec(r.ts) ?? Date.now() / 1000,
    tool: r.tool || 'tool',
    text: String(r.text || '').slice(0, 120),
  }));
}

function todayTotals(id) {
  const today = startOfTodaySec();
  const rows = all(
    PATHS.state,
    `SELECT COUNT(*) AS n,
            COALESCE(SUM(input_tokens),0) AS tin,
            COALESCE(SUM(output_tokens),0) AS tout,
            COALESCE(SUM(estimated_cost_usd),0) AS cost
       FROM sessions
      WHERE ${profileClause(id)} AND started_at >= ?`,
    [today],
  );
  const r = rows[0] || { n: 0, tin: 0, tout: 0, cost: 0 };
  return {
    sessions: Number(r.n) || 0,
    tokens_in: Number(r.tin) || 0,
    tokens_out: Number(r.tout) || 0,
    cost_usd: Number(r.cost) || 0,
  };
}

function computeHermesAgent(def, nowSec) {
  const sess = latestSession(def.id);
  const hasSessions = Boolean(sess);

  if (!hasSessions) {
    return {
      id: def.id,
      label: def.label,
      role: def.role,
      status: 'offline',
      current: null,
      session: null,
      today: { sessions: 0, tokens_in: 0, tokens_out: 0, cost_usd: 0 },
      recent: [],
      tickets: { assigned: 0, in_progress: 0, titles: [] },
    };
  }

  const active = sess.ended_at === null || sess.ended_at === undefined;
  const lastAct = lastActivityTs(sess.id) ?? tsSec(sess.started_at);
  const ageSeconds = nowSec - (lastAct ?? nowSec);

  let status;
  if (active && ageSeconds <= BUSY_WINDOW_S) status = 'busy';
  else if (active) status = 'idle';
  else if (!active && nowSec - (tsSec(sess.ended_at) ?? 0) > OFFLINE_WINDOW_S) status = 'offline';
  else status = 'idle'; // recently ended, between sessions

  return {
    id: def.id,
    label: def.label,
    role: def.role,
    status,
    current: active ? currentAction(sess.id) : null,
    session: {
      id: sess.id,
      title: sess.title || sess.display_name || 'untitled',
      model: sess.model || '',
      provider: sess.billing_provider || '',
      started_at: tsSec(sess.started_at) ?? nowSec,
      messages: Number(sess.message_count) || 0,
      tool_calls: Number(sess.tool_call_count) || 0,
      tokens_in: Number(sess.input_tokens) || 0,
      tokens_out: Number(sess.output_tokens) || 0,
      cost_usd: Number(sess.estimated_cost_usd) || 0,
    },
    today: todayTotals(def.id),
    recent: recentToolCalls(sess.id),
    tickets: { assigned: 0, in_progress: 0, titles: [] },
  };
}

// ---- OpenCode CLI worker -------------------------------------------------

function opencodeAlive() {
  try {
    const out = execSync('pgrep -af "opencode"', { encoding: 'utf8', timeout: 2000 });
    return out.trim().length > 0;
  } catch {
    return false;
  }
}

function parseOcData(dataStr) {
  try {
    return JSON.parse(dataStr);
  } catch {
    return null;
  }
}

function opencodeCurrent() {
  // Last message/part referencing a tool within 10 minutes.
  const rows = all(
    PATHS.opencode,
    `SELECT m.data AS mdata, p.data AS pdata, p.time_created AS t
       FROM part p LEFT JOIN message m ON m.id = p.message_id
      ORDER BY p.time_created DESC LIMIT 40`,
  );
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const r of rows) {
    const t = Number(r.t) || 0;
    if (t < cutoff) break;
    const pd = parseOcData(r.pdata) || {};
    const md = parseOcData(r.mdata) || {};
    const tool = pd.tool || md.tool || (pd.type === 'tool' && pd.state?.title);
    if (tool) {
      return {
        kind: 'tool',
        tool: String(tool).slice(0, 40),
        detail: String(pd.state?.input ? JSON.stringify(pd.state.input).slice(0, 80) : tool).slice(0, 120),
        since: t / 1000,
        elapsed_s: Math.max(0, Math.round(Date.now() / 1000 - t / 1000)),
      };
    }
  }
  return null;
}

function computeOpenCodeAgent(nowSec) {
  const sess = one(
    PATHS.opencode,
    `SELECT * FROM session ORDER BY time_updated DESC LIMIT 1`,
  );
  const alive = opencodeAlive();
  const hasSessions = Boolean(sess);

  let status = 'offline';
  let current = null;
  if (alive) {
    status = 'busy';
    current = opencodeCurrent();
  } else if (hasSessions) {
    status = 'idle';
  }

  return {
    id: 'opencode-cli',
    label: 'OpenCode CLI',
    role: 'cli',
    status,
    current,
    session: sess
      ? {
          id: sess.id,
          title: sess.title || sess.directory || 'opencode session',
          model: sess.model || '',
          provider: 'opencode',
          started_at: tsSec(sess.time_created) ?? nowSec,
          messages: 0,
          tool_calls: 0,
          tokens_in: Number(sess.tokens_input) || 0,
          tokens_out: Number(sess.tokens_output) || 0,
          cost_usd: Number(sess.cost) || 0,
        }
      : null,
    today: { sessions: hasSessions ? 1 : 0, tokens_in: 0, tokens_out: 0, cost_usd: 0 },
    recent: [],
    tickets: { assigned: 0, in_progress: 0, titles: [] },
  };
}

export function computeAgents() {
  const nowSec = Date.now() / 1000;
  const agents = HERMES_AGENTS.map((a) => computeHermesAgent(a, nowSec));
  agents.push(computeOpenCodeAgent(nowSec));
  return agents;
}
