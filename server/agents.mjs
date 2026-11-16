// Per-agent state computation (§3 of spec).
// Reads Hermes state.db (read-only) and determines busy/idle/offline.

import { execSync } from "node:child_process";
import { openReadOnly, queryAll, queryOne } from "./db.mjs";

const STATE_DB = "/root/.hermes/state.db";

const AEGNT_IDE = [
  { id: "default", label: "Orchestrator", role: "orchestrator" },
  { id: "coder", label: "Coder", role: "coder" },
  { id: "qa", label: "QA", role: "qa" },
  { id: "librarian", label: "Librarian", role: "librarian" },
  { id: "growth-hacker", label: "Growth Hacker", role: "growth-hacker" },
];

function now() {
  return Date.now() / 1000;
}

function todayMidnight() {
  return Math.floor(new Date(new Date().toDateString()).getTime() / 1000);
}

/**
 * Computes agent state for a Hermes profile.
 * Fallows spec §3 exactly.
 */
function computeAgent(db, { id, label, role }) {
  if (!db) {
    return {
      id,
      label,
      role,
      status: "offline",
      current: null,
      session: null,
      today: { sessions: 0, tokens_in: 0, tokens_out: 0, cost_usd: 0 },
      recent: [],
      tickets: { assigned: 0, in_progress: 0, titles: [] },
    };
  }

  // Normalize profile_name: NULL/''/'default' → 'default'
  const profileFilter =
    id === "default"
      ? "(profile_name IS NULL OR profile_name = '' OR profile_name = 'default')"
      : "profile_name = ?";

  const params = id === "default" ? [] : [id];

  // Most recent session
  const session = queryOne(
    db,
    `SELECT id, title, model, billing_provider,
            started_at, ended_at, message_count, tool_call_count,
            input_tokens, output_tokens, estimated_cost_usd
     FROM sessions
     WHERE ${profileFilter}
     ORDER BY started_at DESC
     LIMIT 1`,
    ...params
  );

  if (!session) {
    // No sessions at all → offline
    const todayStats = queryOne(
      db,
      `SELECT COUNT(*) as cnt,
              COALESCE(SUM(input_tokens), 0) as tokens_in,
              COALESCE(SUM(output_tokens), 0) as tokens_out,
              COALESCE(SUM(estimated_cost_usd), 0) as cost_usd
       FROM sessions
       WHERE ${profileFilter} AND started_at >= ?`,
      ...params,
      todayMidnight()
    );

    return {
      id,
      label,
      role,
      status: "offline",
      current: null,
      session: null,
      today: {
        sessions: todayStats?.cnt ?? 0,
        tokens_in: todayStats?.tokens_in ?? 0,
        tokens_out: todayStats?.tokens_out ?? 0,
        cost_usd: todayStats?.cost_usd ?? 0,
      },
      recent: [],
      tickets: { assigned: 0, in_progress: 0, titles: [] },
    };
  }

  const isActive = session.ended_at === null || session.ended_at === 0;

  // Get most recent messages for activity check
  const lastMessage = queryOne(
    db,
    `SELECT role, tool_name, tool_calls, content, timestamp
     FROM messages
     WHERE session_id = ?
     ORDER BY timestamp DESC
     LIMIT 1`,
    session.id
  );

  const lastActivityTs = lastMessage
    ? (typeof lastMessage.timestamp === "number"
        ? lastMessage.timestamp
        : 0)
    : session.started_at ?? 0;

  const ageSeconds = now() - lastActivityTs;

  // Determine status
  let status = "offline";
  if (isActive && ageSeconds <= 120) {
    status = "busy";
  } else if (isActive && ageSeconds > 120) {
    status = "idle";
  } else if (!isActive) {
    // Check if last session ended > 30 min ago
    const endedAt = session.ended_at ?? 0;
    if (now() - endedAt > 1800) {
      status = "offline";
    } else {
      status = "idle";
    }
  }

  // Current action: newest tool message, else assistant is thinking.
  const lastTool = queryOne(
    db,
    `SELECT role, tool_name, content, timestamp
     FROM messages
     WHERE session_id = ? AND tool_name IS NOT NULL
     ORDER BY timestamp DESC
     LIMIT 1`,
    session.id
  );

  let current = null;
  const action = lastTool || lastMessage;
  if (action) {
    const since =
      typeof action.timestamp === "number" ? action.timestamp : now();
    if (action.tool_name) {
      current = {
        kind: "tool",
        tool: action.tool_name,
        detail:
          typeof action.content === "string"
            ? action.content.substring(0, 120)
            : "",
        since,
        elapsed_s: Math.max(0, Math.round(now() - since)),
      };
    } else if (action.role === "assistant") {
      current = {
        kind: "thinking",
        detail: "model yanıtı üretiyor",
        since,
        elapsed_s: Math.max(0, Math.round(now() - since)),
      };
    }
  }

  // Today stats
  const todayStats = queryOne(
    db,
    `SELECT COUNT(*) as cnt,
            COALESCE(SUM(input_tokens), 0) as tokens_in,
            COALESCE(SUM(output_tokens), 0) as tokens_out,
            COALESCE(SUM(estimated_cost_usd), 0) as cost_usd
     FROM sessions
     WHERE ${profileFilter} AND started_at >= ?`,
    ...params,
    todayMidnight()
  );

  // Recent tool calls (last 5 from this session)
  const recentMessages = queryAll(
    db,
    `SELECT timestamp, tool_name, content
     FROM messages
     WHERE session_id = ? AND (role = 'tool' OR tool_name IS NOT NULL)
     ORDER BY timestamp DESC
     LIMIT 5`,
    session.id
  );

  const recent = recentMessages.map((m) => ({
    ts: typeof m.timestamp === "number" ? m.timestamp : 0,
    tool: m.tool_name ?? "unknown",
    text: typeof m.content === "string" ? m.content.substring(0, 120) : "",
  }));

  return {
    id,
    label,
    role,
    status,
    current,
    session: {
      id: String(session.id),
      title: session.title ?? "untitled",
      model: session.model ?? "unknown",
      provider: session.billing_provider ?? "unknown",
      started_at: typeof session.started_at === "number"
        ? session.started_at
        : 0,
      messages: session.message_count ?? 0,
      tool_calls: session.tool_call_count ?? 0,
      tokens_in: session.input_tokens ?? 0,
      tokens_out: session.output_tokens ?? 0,
      cost_usd: session.estimated_cost_usd ?? 0,
    },
    today: {
      sessions: todayStats?.cnt ?? 0,
      tokens_in: todayStats?.tokens_in ?? 0,
      tokens_out: todayStats?.tokens_out ?? 0,
      cost_usd: todayStats?.cost_usd ?? 0,
    },
    recent,
    tickets: { assigned: 0, in_progress: 0, titles: [] },
  };
}

/**
 * Compute all Hermes profile agents + attach kanban tickets.
 */
export function computeAgents(kanbanTasks) {
  const db = openReadOnly(STATE_DB);
  const agents = AEGNT_IDE.map((profile) => {
    const agent = computeAgent(db, profile);

    // Attach kanban tickets for this assignee
    const assigneeFilter =
      profile.id === "default" ? "default" : profile.id;
    const tickets = kanbanTasks.filter(
      (t) => t.assignee === assigneeFilter &&
             (t.status === "in-progress" || t.status === "assigned")
    );

    agent.tickets = {
      assigned: kanbanTasks.filter(
        (t) => t.assignee === assigneeFilter && t.status === "assigned"
      ).length,
      in_progress: kanbanTasks.filter(
        (t) => t.assignee === assigneeFilter && t.status === "in-progress"
      ).length,
      titles: tickets.map((t) => t.title),
    };

    return agent;
  });

  return agents;
}