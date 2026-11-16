// Shared types for the Observatory v2 snapshot API (spec §5).
// These types are shared between the client (src/lib/api.ts) and the
// server (server/agents.mjs) so the wire shape stays in lockstep.

export type AgentId =
  | "default"
  | "coder"
  | "qa"
  | "librarian"
  | "growth-hacker"
  | "opencode-cli";

export type AgentRole =
  | "orchestrator"
  | "coder"
  | "qa"
  | "librarian"
  | "growth-hacker"
  | "cli";

export type AgentStatus = "busy" | "idle" | "offline";

export type CurrentActionKind = "tool" | "thinking" | "shell";

export interface CurrentAction {
  kind: CurrentActionKind;
  tool?: string;
  detail: string;
  since: number;
  elapsed_s: number;
}

export interface AgentSession {
  id: string;
  title: string;
  model: string;
  provider: string;
  started_at: number;
  messages: number;
  tool_calls: number;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
}

export interface AgentToday {
  sessions: number;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
}

export interface RecentToolCall {
  ts: number;
  tool: string;
  text: string;
}

export interface AgentTickets {
  assigned: number;
  in_progress: number;
  titles: string[];
}

export interface Agent {
  id: AgentId;
  label: string;
  role: AgentRole;
  status: AgentStatus;
  current: CurrentAction | null;
  session: AgentSession | null;
  today: AgentToday;
  recent: RecentToolCall[];
  tickets: AgentTickets;
}

export type KanbanStatus =
  | "todo"
  | "assigned"
  | "in-progress"
  | "review"
  | "done"
  | "blocked";

export interface KanbanTask {
  id: string;
  title: string;
  status: KanbanStatus;
  assignee: string;
  priority: number;
  updated_at: number;
  repo: string;
}

export interface KanbanCounts {
  todo: number;
  assigned: number;
  "in-progress": number;
  review: number;
  done: number;
  blocked: number;
}

export interface KanbanSummary {
  counts: KanbanCounts;
  tasks: KanbanTask[];
}

export interface Delegation {
  id: string;
  state: "running" | "completed" | "failed";
  dispatched_at: number;
  completed_at: number | null;
  task: string;
}

export interface Totals {
  agents_busy: number;
  agents_idle: number;
  tokens_today: number;
  cost_today_usd: number;
  active_sessions: number;
}

export interface Snapshot {
  generated_at: number;
  source: "live" | "fallback";
  agents: Agent[];
  kanban: KanbanSummary;
  delegations: Delegation[];
  totals: Totals;
}

export interface HealthResponse {
  ok: boolean;
  dbs: {
    state: boolean;
    kanban: boolean;
    opencode: boolean;
  };
}
