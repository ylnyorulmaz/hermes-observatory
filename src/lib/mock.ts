// Static typed fallback snapshot (spec §1.3: mock allowed ONLY as a typed
// fallback when the live DB is missing, and must be labelled source:"fallback").
import type { Agent, Snapshot } from "./types";

const now = () => Math.floor(Date.now() / 1000);

function agent(
  partial: Pick<Agent, "id" | "label" | "role" | "status"> &
    Partial<Omit<Agent, "id" | "label" | "role" | "status">>
): Agent {
  return {
    today: { sessions: 0, tokens_in: 0, tokens_out: 0, cost_usd: 0 },
    recent: [],
    tickets: { assigned: 0, in_progress: 0, titles: [] },
    ...partial,
    current: partial.current ?? null,
    session: partial.session ?? null,
  };
}

export function buildFallbackSnapshot(): Snapshot {
  const t = now();

  const agents: Agent[] = [
    agent({
      id: "default",
      label: "Orchestrator",
      role: "orchestrator",
      status: "busy",
      current: {
        kind: "tool",
        tool: "kanban",
        detail: "Fanning out P1/P2 tasks to specialist profiles",
        since: t - 42,
        elapsed_s: 42,
      },
      session: {
        id: "ses_orch_1",
        title: "Observatory v2 rebuild",
        model: "deepseek/deepseek-v4-pro",
        provider: "deepseek",
        started_at: t - 900,
        messages: 34,
        tool_calls: 21,
        tokens_in: 211263,
        tokens_out: 137043,
        cost_usd: 0.1164,
      },
      today: { sessions: 3, tokens_in: 420000, tokens_out: 210000, cost_usd: 0.24 },
      recent: [
        { ts: t - 5, tool: "kanban_create", text: "P2 data wiring" },
        { ts: t - 40, tool: "kanban_show", text: "t_5aa4b681" },
      ],
      tickets: { assigned: 1, in_progress: 2, titles: ["Observatory v2 P1"] },
    }),
    agent({
      id: "coder",
      label: "Coder",
      role: "coder",
      status: "idle",
      current: null,
      session: {
        id: "ses_coder_1",
        title: "Sprite engine + 8bitcn theme",
        model: "deepseek/deepseek-v4-pro",
        provider: "deepseek",
        started_at: t - 3600,
        messages: 120,
        tool_calls: 88,
        tokens_in: 640000,
        tokens_out: 480000,
        cost_usd: 0.42,
      },
      today: { sessions: 5, tokens_in: 900000, tokens_out: 610000, cost_usd: 0.61 },
      recent: [
        { ts: t - 600, tool: "terminal", text: "npm run build" },
        { ts: t - 590, tool: "write_file", text: "src/sprites/frames.ts" },
      ],
      tickets: { assigned: 2, in_progress: 0, titles: ["8bitcn foundation"] },
    }),
    agent({
      id: "qa",
      label: "QA",
      role: "qa",
      status: "idle",
      current: null,
      session: null,
      today: { sessions: 2, tokens_in: 120000, tokens_out: 90000, cost_usd: 0.08 },
      recent: [],
      tickets: { assigned: 1, in_progress: 0, titles: ["Playwright stage.png"] },
    }),
    agent({
      id: "librarian",
      label: "Librarian",
      role: "librarian",
      status: "offline",
      current: null,
      session: null,
      today: { sessions: 0, tokens_in: 0, tokens_out: 0, cost_usd: 0 },
      recent: [],
      tickets: { assigned: 0, in_progress: 0, titles: [] },
    }),
    agent({
      id: "growth-hacker",
      label: "Growth Hacker",
      role: "growth-hacker",
      status: "offline",
      current: null,
      session: null,
      today: { sessions: 0, tokens_in: 0, tokens_out: 0, cost_usd: 0 },
      recent: [],
      tickets: { assigned: 0, in_progress: 0, titles: [] },
    }),
    agent({
      id: "opencode-cli",
      label: "OpenCode CLI",
      role: "cli",
      status: "idle",
      current: null,
      session: {
        id: "ses_cli_1",
        title: "obs-v2 P1 foundation",
        model: "deepseek-v4.1-flash",
        provider: "opencode-go",
        started_at: t - 1800,
        messages: 60,
        tool_calls: 44,
        tokens_in: 300000,
        tokens_out: 220000,
        cost_usd: 0.09,
      },
      today: { sessions: 1, tokens_in: 300000, tokens_out: 220000, cost_usd: 0.09 },
      recent: [
        { ts: t - 120, tool: "bash", text: "npx shadcn add @8bitcn/card" },
      ],
      tickets: { assigned: 0, in_progress: 0, titles: [] },
    }),
  ];

  const busy = agents.filter((a) => a.status === "busy").length;
  const idle = agents.filter((a) => a.status === "idle").length;

  return {
    generated_at: t,
    source: "fallback",
    agents,
    kanban: {
      counts: {
        todo: 1,
        assigned: 2,
        "in-progress": 2,
        review: 0,
        done: 12,
        blocked: 0,
      },
      tasks: [
        {
          id: "t_5aa4b681",
          title: "Observatory v2 P1 — 8bitcn foundation + pixel sprite engine",
          status: "in-progress",
          assignee: "coder",
          priority: 9,
          updated_at: t - 60,
          repo: "hermes-observatory",
        },
        {
          id: "t_d0053f44",
          title: "Wire real kanban.db + live subagent reads",
          status: "in-progress",
          assignee: "default",
          priority: 8,
          updated_at: t - 120,
          repo: "hermes-observatory",
        },
      ],
    },
    delegations: [
      {
        id: "del_1",
        state: "running",
        dispatched_at: t - 300,
        completed_at: null,
        task: "opencode-cli P1 foundation",
      },
    ],
    totals: {
      agents_busy: busy,
      agents_idle: idle,
      tokens_today: 2140000,
      cost_today_usd: 1.11,
      active_sessions: busy + idle,
    },
  };
}
