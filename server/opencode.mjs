// opencode.mjs — OpenCode CLI agent probe (spec §2, §3): process liveness +
// read-only reads from opencode.db (session / message / part).

import { execFileSync } from 'node:child_process';
import { all, one } from './db.mjs';

const TOOL_WINDOW_MS = 10 * 60 * 1000; // "within 10 min" for current action

/** True if an `opencode run` process exists. */
export function isOpencodeRunning() {
  try {
    const out = execFileSync('pgrep', ['-af', 'opencode'], {
      encoding: 'utf8',
      timeout: 2000,
    }).trim();
    return out
      .split('\n')
      .filter(Boolean)
      .some((line) => /opencode\s+run\b/.test(line) && !/pgrep/.test(line));
  } catch {
    return false;
  }
}

function parseModel(json) {
  try {
    const m = JSON.parse(json);
    return { model: m.id ?? json, provider: m.providerID ?? m.provider ?? null };
  } catch {
    return { model: json, provider: null };
  }
}

function toolNameFromPart(data) {
  try {
    const p = JSON.parse(data);
    return p.tool ?? null;
  } catch {
    return null;
  }
}

function commandFromPart(data) {
  try {
    const p = JSON.parse(data);
    const input = p.state?.input;
    if (input?.command) return input.command;
    if (input?.file_path) return input.file_path;
    if (input?.description) return input.description;
    return null;
  } catch {
    return null;
  }
}

function trunc(s, n = 120) {
  if (s == null) return '';
  const t = String(s).replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1) + '…' : t;
}

function sessionInfo(sess) {
  if (!sess) return null;
  const { model, provider } = parseModel(sess.model);
  const msgCount = one(
    'opencode',
    'SELECT COUNT(*) n FROM message WHERE session_id = ?',
    sess.id,
  )?.n ?? 0;
  const toolCount = one(
    'opencode',
    `SELECT COUNT(*) n FROM part
      WHERE session_id = ? AND json_extract(data, '$.type') = 'tool'`,
    sess.id,
  )?.n ?? 0;
  return {
    id: sess.id,
    title: sess.title ?? '',
    model: model ?? '',
    provider: provider ?? '',
    started_at: Math.floor((sess.time_created ?? 0) / 1000),
    messages: Number(msgCount),
    tool_calls: Number(toolCount),
    tokens_in: sess.tokens_input ?? 0,
    tokens_out: sess.tokens_output ?? 0,
    cost_usd: sess.cost ?? 0,
  };
}

function lastToolPart(nowMs) {
  return one(
    'opencode',
    `SELECT data, time_created FROM part
      WHERE json_extract(data, '$.type') = 'tool' AND time_created >= ?
      ORDER BY time_created DESC LIMIT 1`,
    nowMs - TOOL_WINDOW_MS,
  );
}

/**
 * Build the `opencode-cli` agent object.
 * busy   : an `opencode run` process exists → current = last tool part ≤10 min
 * idle   : no process but sessions exist → last session title + "beklemede"
 * offline: no process and no sessions
 */
export function opencodeAgent(nowSeconds) {
  const nowMs = nowSeconds * 1000;
  const running = isOpencodeRunning();
  const lastSession = one(
    'opencode',
    'SELECT * FROM session ORDER BY time_updated DESC LIMIT 1',
  );

  let status = 'offline';
  if (running) status = 'busy';
  else if (lastSession) status = 'idle';

  let current = null;
  if (status === 'busy') {
    const part = lastToolPart(nowMs);
    if (part) {
      const tool = toolNameFromPart(part.data);
      current = {
        kind: 'tool',
        tool: tool ?? 'shell',
        detail: trunc(commandFromPart(part.data)) || tool || '',
        since: Math.floor((part.time_created ?? nowMs) / 1000),
        elapsed_s: Math.max(
          0,
          Math.floor((nowMs - (part.time_created ?? nowMs)) / 1000),
        ),
      };
    } else {
      current = { kind: 'thinking', detail: 'opencode çalışıyor' };
    }
  } else if (status === 'idle' && lastSession) {
    current = {
      kind: 'thinking',
      detail: `${lastSession.title ?? 'beklemede'}`,
    };
  }

  // recent tool parts
  const recentRows = all(
    'opencode',
    `SELECT data, time_created FROM part
      WHERE json_extract(data, '$.type') = 'tool'
      ORDER BY time_created DESC LIMIT 5`,
  );
  const recent = recentRows.map((r) => ({
    ts: Math.floor((r.time_created ?? 0) / 1000),
    tool: toolNameFromPart(r.data) ?? 'shell',
    text: trunc(commandFromPart(r.data)),
  }));

  // today aggregates (opencode timestamps are epoch milliseconds)
  const todayStartMs = startOfTodayMs();
  const today = all(
    'opencode',
    `SELECT COUNT(*) n,
            COALESCE(SUM(tokens_input),0) tin,
            COALESCE(SUM(tokens_output),0) tout,
            COALESCE(SUM(cost),0) cost
       FROM session WHERE time_created >= ?`,
    todayStartMs,
  )[0] ?? { n: 0, tin: 0, tout: 0, cost: 0 };

  return {
    id: 'opencode-cli',
    label: 'OpenCode CLI',
    role: 'cli',
    status,
    current,
    session: sessionInfo(lastSession),
    today: {
      sessions: Number(today.n),
      tokens_in: Number(today.tin),
      tokens_out: Number(today.tout),
      cost_usd: Number(today.cost),
    },
    recent,
    tickets: { assigned: 0, in_progress: 0, titles: [] },
  };
}

function startOfTodayMs() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
