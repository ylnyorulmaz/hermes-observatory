// OpenCode CLI agent probe: process liveness + opencode.db sessions/parts.

import { readdirSync, readFileSync } from "node:fs";
import { openReadOnly, queryAll, queryOne } from "./db.mjs";

const OPENCODE_DB = "/root/.local/share/opencode/opencode.db";

/** Detect a live `opencode run ...` process by scanning /proc. */
function opencodeProcessAlive() {
  let entries;
  try {
    entries = readdirSync("/proc");
  } catch {
    return false;
  }

  for (const name of entries) {
    if (!/^\d+$/.test(name)) continue;
    let raw;
    try {
      raw = readFileSync(`/proc/${name}/cmdline`, "utf8");
    } catch {
      continue;
    }
    const args = raw.split("\0").filter(Boolean);
    if (args.length < 2) continue;
    const exe = args[0].split("/").pop() || "";
    if ((exe === "opencode" || exe === "opencode.exe") && args.includes("run")) {
      return true;
    }
  }
  return false;
}

function parseJson(raw) {
  if (typeof raw !== "string" || !raw) return null;
  try {
    const value = JSON.parse(raw);
    return value && typeof value === "object" ? value : null;
  } catch {
    return null;
  }
}

function summarize(value, max = 120) {
  if (value === null || value === undefined) return "";
  let text;
  if (typeof value === "string") {
    text = value;
  } else {
    try {
      text = JSON.stringify(value);
    } catch {
      text = String(value);
    }
  }
  return text.replace(/\s+/g, " ").trim().slice(0, max);
}

function partDetail(data) {
  if (!data) return "";
  const input = data.state?.input || data.input;
  if (input) {
    if (typeof input === "string") return summarize(input);
    for (const key of ["command", "description", "filePath", "path", "pattern"]) {
      if (typeof input[key] === "string") return summarize(input[key]);
    }
    return summarize(input);
  }
  for (const key of ["text", "content", "reasoning"]) {
    if (typeof data[key] === "string") return summarize(data[key]);
  }
  return summarize(data.state || "");
}

function parseModel(raw) {
  let model = "unknown";
  let provider = "opencode-go";
  if (!raw) return { model, provider };
  try {
    const value = JSON.parse(raw);
    if (typeof value === "string") {
      model = value;
    } else if (value && typeof value === "object") {
      model = value.id || value.model || model;
      provider = value.providerID || value.provider || provider;
    }
  } catch {
    model = String(raw);
  }
  return { model, provider };
}

/** Compute agent state for the `opencode-cli` agent. */
export function probeOpenCodeAgent() {
  const proc = opencodeProcessAlive();
  const db = openReadOnly(OPENCODE_DB);

  const emptyToday = {
    sessions: 0,
    tokens_in: 0,
    tokens_out: 0,
    cost_usd: 0,
  };
  const emptyTickets = { assigned: 0, in_progress: 0, titles: [] };

  if (!db && !proc) {
    return {
      id: "opencode-cli",
      label: "OpenCode CLI",
      role: "cli",
      status: "offline",
      current: null,
      session: null,
      today: emptyToday,
      recent: [],
      tickets: emptyTickets,
    };
  }

  const session =
    db &&
    queryOne(
      db,
      `SELECT id, title, directory, agent, model, cost,
              tokens_input, tokens_output, time_created, time_updated
         FROM session
         ORDER BY time_updated DESC
         LIMIT 1`
    );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  const todayStats =
    (db &&
      queryOne(
        db,
        `SELECT COUNT(*) as cnt,
                COALESCE(SUM(tokens_input), 0) as tokens_in,
                COALESCE(SUM(tokens_output), 0) as tokens_out,
                COALESCE(SUM(cost), 0) as cost_usd
           FROM session
          WHERE time_created >= ?`,
        todayMs
      )) ||
    {};

  let messageCount = 0;
  let toolParts = [];
  let latestPart = null;

  if (db && session) {
    const msg = queryOne(
      db,
      "SELECT COUNT(*) as cnt FROM message WHERE session_id = ?",
      session.id
    );
    messageCount = msg?.cnt ?? 0;

    const rows = queryAll(
      db,
      `SELECT time_created, data
         FROM part
        WHERE session_id = ?
        ORDER BY time_created DESC, id DESC
        LIMIT 500`,
      session.id
    );

    const parsed = [];
    for (const row of rows) {
      const data = parseJson(row.data);
      if (!data) continue;
      const ts =
        typeof row.time_created === "number"
          ? row.time_created / 1000
          : Date.now() / 1000;
      const item = {
        ts,
        type: data.type || "",
        tool: typeof data.tool === "string" ? data.tool : "",
        detail: partDetail(data),
      };
      parsed.push(item);
    }

    latestPart = parsed[0] || null;
    toolParts = parsed.filter((p) => p.type === "tool" || p.tool);
  }

  const now = Date.now() / 1000;
  let current = null;
  if (proc && latestPart && now - latestPart.ts <= 600) {
    if (latestPart.tool) {
      current = {
        kind: latestPart.tool === "bash" ? "shell" : "tool",
        tool: latestPart.tool,
        detail: latestPart.detail,
        since: latestPart.ts,
        elapsed_s: Math.max(0, Math.round(now - latestPart.ts)),
      };
    } else {
      current = {
        kind: "thinking",
        detail: latestPart.detail || "model yanıtı üretiyor",
        since: latestPart.ts,
        elapsed_s: Math.max(0, Math.round(now - latestPart.ts)),
      };
    }
  }

  const status = proc ? "busy" : session ? "idle" : "offline";
  const model = parseModel(session?.model);

  return {
    id: "opencode-cli",
    label: "OpenCode CLI",
    role: "cli",
    status,
    current,
    session: session
      ? {
          id: String(session.id),
          title: session.title || "opencode session",
          model: model.model,
          provider: model.provider,
          started_at:
            typeof session.time_created === "number"
              ? session.time_created / 1000
              : 0,
          messages: messageCount,
          tool_calls: toolParts.length,
          tokens_in: session.tokens_input ?? 0,
          tokens_out: session.tokens_output ?? 0,
          cost_usd: session.cost ?? 0,
        }
      : null,
    today: {
      sessions: todayStats.cnt ?? 0,
      tokens_in: todayStats.tokens_in ?? 0,
      tokens_out: todayStats.tokens_out ?? 0,
      cost_usd: todayStats.cost_usd ?? 0,
    },
    recent: toolParts.slice(0, 10).map((p) => ({
      ts: p.ts,
      tool: p.tool || p.type || "tool",
      text: p.detail,
    })),
    tickets: emptyTickets,
  };
}
