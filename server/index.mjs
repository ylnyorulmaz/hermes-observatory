// Hermes Observatory v2 — Node HTTP server.
// Serves static dist/ files + /api/observatory/* endpoints.
// Read-only access to Hermes state DBs. Falls back to mock when DBs are missing.

import { createServer } from "node:http";
import { readFile, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

import { computeAgents } from "./agents.mjs";
import { probeOpenCodeAgent } from "./opencode.mjs";
import { kanbanSummary } from "./kanban.mjs";
import { delegationsList } from "./delegations.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const DIST = join(__dirname, "..", "dist");
const PORT = parseInt(process.env.PORT || "5174", 10);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

/** JSON response helper */
function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

/** Serve a static file from dist/ */
function serveStatic(res, pathname) {
  let filePath = join(DIST, pathname === "/" ? "index.html" : pathname);

  readFile(filePath, (err, data) => {
    if (!err) {
      const ext = extname(filePath);
      const ct = MIME[ext] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": ct });
      res.end(data);
      return;
    }
    // SPA fallback: non-existent paths → index.html
    readFile(join(DIST, "index.html"), (err2, html) => {
      if (!err2) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(html);
      } else {
        res.writeHead(500);
        res.end("500 Internal Server Error");
      }
    });
  });
}

/** GET /api/observatory/health */
function handleHealth(res) {
  const dbs = {
    state: existsSync("/root/.hermes/state.db"),
    kanban: existsSync("/root/.hermes/kanban.db"),
    opencode: existsSync("/root/.local/share/opencode/opencode.db"),
  };
  const ok = dbs.state || dbs.kanban || dbs.opencode;
  json(res, ok ? 200 : 503, { ok, dbs });
}

/** GET /api/observatory/snapshot */
function handleSnapshot(res) {
  try {
    const kanban = kanbanSummary();
    const hermesAgents = computeAgents(kanban.tasks);
    const opencodeAgent = probeOpenCodeAgent();
    const delegations = delegationsList();

    // Merge: replace any stub opencode-cli with live probe, or add it
    const existingIdx = hermesAgents.findIndex((a) => a.id === "opencode-cli");
    const agents =
      existingIdx >= 0
        ? hermesAgents.map((a) => (a.id === "opencode-cli" ? opencodeAgent : a))
        : [...hermesAgents, opencodeAgent];

    const busy = agents.filter((a) => a.status === "busy").length;
    const idle = agents.filter((a) => a.status === "idle").length;
    const tokensToday = agents.reduce(
      (s, a) => s + a.today.tokens_in + a.today.tokens_out,
      0
    );
    const costToday = agents.reduce((s, a) => s + a.today.cost_usd, 0);

    json(res, 200, {
      generated_at: Math.floor(Date.now() / 1000),
      source: "live",
      agents,
      kanban,
      delegations,
      totals: {
        agents_busy: busy,
        agents_idle: idle,
        tokens_today: tokensToday,
        cost_today_usd: Math.round(costToday * 10000) / 10000,
        active_sessions: busy + idle,
      },
    });
  } catch (err) {
    console.error("[snapshot] live error:", err.message);
    // Fallback snapshot when DBs can't be read
    const t = Math.floor(Date.now() / 1000);
    json(res, 200, {
      generated_at: t,
      source: "fallback",
      agents: [
        {
          id: "default", label: "Orchestrator", role: "orchestrator",
          status: "busy",
          current: { kind: "tool", tool: "kanban", detail: "DB okunamadi — fallback", since: t - 42, elapsed_s: 42 },
          session: {
            id: "fb_1", title: "Fallback Mode",
            model: "unknown", provider: "unknown",
            started_at: t - 900, messages: 0, tool_calls: 0,
            tokens_in: 0, tokens_out: 0, cost_usd: 0,
          },
          today: { sessions: 0, tokens_in: 0, tokens_out: 0, cost_usd: 0 },
          recent: [],
          tickets: { assigned: 0, in_progress: 0, titles: [] },
        },
        {
          id: "coder", label: "Coder", role: "coder", status: "offline",
          current: null, session: null,
          today: { sessions: 0, tokens_in: 0, tokens_out: 0, cost_usd: 0 },
          recent: [],
          tickets: { assigned: 0, in_progress: 0, titles: [] },
        },
        {
          id: "qa", label: "QA", role: "qa", status: "offline",
          current: null, session: null,
          today: { sessions: 0, tokens_in: 0, tokens_out: 0, cost_usd: 0 },
          recent: [],
          tickets: { assigned: 0, in_progress: 0, titles: [] },
        },
        {
          id: "librarian", label: "Librarian", role: "librarian", status: "offline",
          current: null, session: null,
          today: { sessions: 0, tokens_in: 0, tokens_out: 0, cost_usd: 0 },
          recent: [],
          tickets: { assigned: 0, in_progress: 0, titles: [] },
        },
        {
          id: "growth-hacker", label: "Growth Hacker", role: "growth-hacker", status: "offline",
          current: null, session: null,
          today: { sessions: 0, tokens_in: 0, tokens_out: 0, cost_usd: 0 },
          recent: [],
          tickets: { assigned: 0, in_progress: 0, titles: [] },
        },
        {
          id: "opencode-cli", label: "OpenCode CLI", role: "cli", status: "idle",
          current: null,
          session: {
            id: "fb_cli", title: "OpenCode CLI IDLE",
            model: "unknown", provider: "opencode-go",
            started_at: t - 600, messages: 0, tool_calls: 0,
            tokens_in: 0, tokens_out: 0, cost_usd: 0,
          },
          today: { sessions: 0, tokens_in: 0, tokens_out: 0, cost_usd: 0 },
          recent: [],
          tickets: { assigned: 0, in_progress: 0, titles: [] },
        },
      ],
      kanban: {
        counts: { todo: 0, assigned: 0, "in-progress": 0, review: 0, done: 0, blocked: 0 },
        tasks: [],
      },
      delegations: [],
      totals: {
        agents_busy: 1,
        agents_idle: 1,
        tokens_today: 0,
        cost_today_usd: 0,
        active_sessions: 2,
      },
    });
  }
}

// ── Create server ──────────────────────────────────────────────

const server = createServer((req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // API routes
  if (pathname === "/api/observatory/health") return handleHealth(res);
  if (pathname === "/api/observatory/snapshot") return handleSnapshot(res);

  // CORS preflight for API
  if (req.method === "OPTIONS" && pathname.startsWith("/api/")) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Accept, Content-Type",
    });
    return res.end();
  }

  // Static files
  serveStatic(res, pathname);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[observatory] http://127.0.0.1:${PORT}/`);
});

process.on("SIGTERM", () => server.close());
process.on("SIGINT", () => server.close());