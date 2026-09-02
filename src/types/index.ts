export type ProfileId = 'default' | 'coder' | 'qa-engineer' | 'web-researcher';

export type ProfileStatus = 'idle' | 'working' | 'stuck' | 'error' | 'offline';

export interface Profile {
  id: ProfileId;
  name: string;
  status: ProfileStatus;
  model: string;
  provider: string;
  currentTask?: string;
  taskProgress?: number;
  tokensUsed: number;
  tokensLimit: number;
  iterations: number;
  maxIterations: number;
  errors: number;
  lastActivity: number;
  fallbackChain: string[];
  uptime: number;
}

export interface KanbanTicket {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'assigned' | 'in-progress' | 'review' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: ProfileId;
  createdAt: number;
  completedAt?: number;
  tags: string[];
  linkedTickets: string[];
  iteration: number;
  maxIterations: number;
  position: number;
  profile?: string;
  parentSubagent?: string;
}

export interface SubAgent {
  id: string;
  parentTaskId: string;
  profile: ProfileId;
  role: 'leaf' | 'orchestrator';
  goal: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: number;
  completedAt?: number;
  tokensUsed: number;
  steps: number;
  currentStep?: string;
  liveTranscript?: string;
  result?: string;
  error?: string;
}

export interface TokenUsage {
  profile: ProfileId;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  timestamp: number;
  requestType: 'chat' | 'completion' | 'embedding';
}

export interface SystemMetrics {
  timestamp: number;
  profiles: Record<ProfileId, Profile>;
  activeTickets: number;
  completedTickets: number;
  failedTickets: number;
  totalTokensToday: number;
  avgResponseTime: number;
  errorRate: number;
  throughput: number;
  circuitBreakerActive: boolean;
  emergencyStop: boolean;
}

export interface WebSocketMessage {
  type: 'profile_update' | 'ticket_update' | 'subagent_update' | 'metrics_update' | 'token_usage' | 'log_entry' | 'heartbeat';
  payload: any;
  timestamp: number;
}

export type ViewMode = 'overview' | 'profiles' | 'kanban' | 'subagents' | 'tokens' | 'logs';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  source: string;
  profile?: ProfileId;
  message: string;
  metadata?: Record<string, any>;
}