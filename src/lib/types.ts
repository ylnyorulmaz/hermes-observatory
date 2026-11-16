// src/lib/types.ts — shared §5 API contract shapes (Snapshot / Agent / Ticket).

export type AgentId =
  | 'default'
  | 'coder'
  | 'qa'
  | 'librarian'
  | 'growth-hacker'
  | 'opencode-cli';

export type AgentStatus = 'busy' | 'idle' | 'offline';

export interface AgentCurrent {
  kind: 'tool' | 'thinking' | 'shell';
  tool: string | null;
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

export interface AgentRecent {
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
  role: 'orchestrator' | 'coder' | 'qa' | 'librarian' | 'growth-hacker' | 'cli';
  status: AgentStatus;
  current: AgentCurrent | null;
  session: AgentSession | null;
  today: AgentToday;
  recent: AgentRecent[];
  tickets: AgentTickets;
}

export interface KanbanCounts {
  todo: number;
  assigned: number;
  'in-progress': number;
  review: number;
  done: number;
  blocked: number;
}

export interface KanbanTask {
  id: string;
  title: string;
  status: string;
  assignee: string;
  priority: number;
  updated_at: number;
  repo: string | null;
}

export interface KanbanSummary {
  counts: KanbanCounts;
  tasks: KanbanTask[];
}

export interface Delegation {
  id: string;
  state: string;
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
  source: 'live' | 'fallback';
  agents: Agent[];
  kanban: KanbanSummary;
  delegations: Delegation[];
  totals: Totals;
}

export interface Health {
  ok: boolean;
  dbs: { state: boolean; kanban: boolean; opencode: boolean };
}
