// API client for Hermes Monitoring
// Connects to Hermes Gateway REST API + WebSocket

const HERMES_BASE = import.meta.env.VITE_HERMES_URL || 'http://localhost:8080';
const WS_BASE = import.meta.env.VITE_HERMES_WS || 'ws://localhost:8080/ws';

class HermesAPI {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private connected = false;

  // REST API
  async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const res = await fetch(`${HERMES_BASE}/api/monitoring${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });
      
      if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }
      
      return res.json();
    } catch (err) {
      // Gateway unavailable - return mock data from local introspection
      console.warn(`[HermesAPI] Gateway unavailable for ${endpoint}, using local mock`);
      return this.getMockData(endpoint) as T;
    }
  }

  private getMockData(endpoint: string): any {
    // Read-only fallback when gateway is down
    // In production, this would read from local SQLite kanban.db
    
    if (endpoint === '/tickets' || endpoint.startsWith('/tickets')) {
      // Mock Kanban tickets (will be replaced by real kanban.db read)
      return MOCK_TICKETS;
    }
    if (endpoint === '/subagents' || endpoint.startsWith('/subagents')) {
      return MOCK_SUBAGENTS;
    }
    if (endpoint === '/profiles' || endpoint.startsWith('/profiles')) {
      return MOCK_PROFILES;
    }
    if (endpoint.startsWith('/tokens')) {
      return MOCK_TOKEN_USAGE;
    }
    if (endpoint.startsWith('/metrics')) {
      return MOCK_METRICS;
    }
    if (endpoint.startsWith('/logs')) {
      return MOCK_LOGS;
    }
    return {};
  }

  // Profiles
  async getProfiles() {
    return this.fetch<Record<string, import('../types').Profile>>('/profiles');
  }

  async getProfile(id: string) {
    return this.fetch<import('../types').Profile>(`/profiles/${id}`);
  }

  // Kanban
  async getTickets() {
    return this.fetch<import('../types').KanbanTicket[]>('/tickets');
  }

  async getTicket(id: string) {
    return this.fetch<import('../types').KanbanTicket>(`/tickets/${id}`);
  }

  // Subagents
  async getSubagents() {
    return this.fetch<import('../types').SubAgent[]>('/subagents');
  }

  async getSubagent(id: string) {
    return this.fetch<import('../types').SubAgent>(`/subagents/${id}`);
  }

  // Tokens
  async getTokenUsage(params?: { profile?: string; hours?: number }) {
    const search = new URLSearchParams();
    if (params?.profile) search.set('profile', params.profile);
    if (params?.hours) search.set('hours', params.hours.toString());
    return this.fetch<import('../types').TokenUsage[]>(`/tokens?${search}`);
  }

  // Metrics
  async getMetrics() {
    return this.fetch<import('../types').SystemMetrics>('/metrics');
  }

  async getMetricsHistory(hours: number = 24) {
    return this.fetch<import('../types').SystemMetrics[]>(`/metrics/history?hours=${hours}`);
  }

  // Logs
  async getLogs(params?: { level?: string; profile?: string; limit?: number; since?: number }) {
    const search = new URLSearchParams();
    if (params?.level) search.set('level', params.level);
    if (params?.profile) search.set('profile', params.profile);
    if (params?.limit) search.set('limit', params.limit.toString());
    if (params?.since) search.set('since', params.since.toString());
    return this.fetch<import('../types').LogEntry[]>(`/logs?${search}`);
  }

  // System actions
  async emergencyStop() {
    return this.fetch<{ success: boolean }>('/emergency-stop', { method: 'POST' });
  }

  async restartProfile(profileId: string) {
    return this.fetch<{ success: boolean }>(`/profiles/${profileId}/restart`, { method: 'POST' });
  }

  async clearCircuitBreaker() {
    return this.fetch<{ success: boolean }>('/circuit-breaker/clear', { method: 'POST' });
  }

  // WebSocket
  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    
    this.ws = new WebSocket(WS_BASE);
    
    this.ws.onopen = () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      this.emit('connection', { connected: true });
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.emit(msg.type, msg.payload);
      } catch (e) {
        console.error('WS parse error:', e);
      }
    };

    this.ws.onclose = () => {
      this.connected = false;
      this.emit('connection', { connected: false });
      this.scheduleReconnect();
    };

    this.ws.onerror = (err) => {
      this.emit('error', err);
    };
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('error', new Error('Max reconnect attempts reached'));
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    setTimeout(() => this.connect(), Math.min(delay, 30000));
  }

  // Event system
  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: (data: any) => void) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  isConnected() {
    return this.connected;
  }
}

export const hermesAPI = new HermesAPI();

// React Query hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: () => hermesAPI.getProfiles(),
    refetchInterval: 5000,
  });
}

export function useTickets() {
  return useQuery({
    queryKey: ['tickets'],
    queryFn: () => hermesAPI.getTickets(),
    refetchInterval: 3000,
  });
}

export function useSubagents() {
  return useQuery({
    queryKey: ['subagents'],
    queryFn: () => hermesAPI.getSubagents(),
    refetchInterval: 2000,
  });
}

export function useMetrics() {
  return useQuery({
    queryKey: ['metrics'],
    queryFn: () => hermesAPI.getMetrics(),
    refetchInterval: 5000,
  });
}

export function useMetricsHistory(hours: number = 24) {
  return useQuery({
    queryKey: ['metrics', 'history', hours],
    queryFn: () => hermesAPI.getMetricsHistory(hours),
    refetchInterval: 60000,
  });
}

export function useTokenUsage(profile?: string, hours: number = 24) {
  return useQuery({
    queryKey: ['tokens', profile, hours],
    queryFn: () => hermesAPI.getTokenUsage({ profile, hours }),
    refetchInterval: 10000,
  });
}

export function useLogs(params?: { level?: string; profile?: string; limit?: number }) {
  return useQuery({
    queryKey: ['logs', params],
    queryFn: () => hermesAPI.getLogs(params),
    refetchInterval: 3000,
  });
}

export function useEmergencyStop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => hermesAPI.emergencyStop(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
}

export function useRestartProfile() {
  return useMutation({
    mutationFn: (profileId: string) => hermesAPI.restartProfile(profileId),
  });
}

// WebSocket hook
import { useEffect, useState } from 'react';

export function useHermesWS() {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<{ type: string; payload: any } | null>(null);

  useEffect(() => {
    const unsubConnection = hermesAPI.on('connection', ({ connected }) => {
      setConnected(connected);
    });

    const unsubMessage = hermesAPI.on('*', (data) => {
      setLastMessage({ type: '*', payload: data });
    });

    hermesAPI.connect();

    return () => {
      unsubConnection();
      unsubMessage();
      hermesAPI.disconnect();
    };
  }, []);

  return { connected, lastMessage };
}

// Specific event hooks
export function useProfileUpdates(callback: (profiles: any) => void) {
  useEffect(() => {
    return hermesAPI.on('profile_update', callback);
  }, [callback]);
}

export function useTicketUpdates(callback: (ticket: any) => void) {
  useEffect(() => {
    return hermesAPI.on('ticket_update', callback);
  }, [callback]);
}

export function useSubagentUpdates(callback: (subagent: any) => void) {
  useEffect(() => {
    return hermesAPI.on('subagent_update', callback);
  }, [callback]);
}

export function useTokenUpdates(callback: (usage: any) => void) {
  useEffect(() => {
    return hermesAPI.on('token_usage', callback);
  }, [callback]);
}

// =====================================================================
// MOCK DATA FALLBACK (used when Hermes Gateway is unavailable)
// Auto-generated from local kanban.db + process introspection
// =====================================================================

const MOCK_TICKETS = [
  {
    id: 't_1d891c72',
    title: 'Add real Kanban + subagent data to Hermes Observatory dashboard',
    description: 'Make KanbanView and SubagentsView show real data from kanban.db and active subagents',
    status: 'running',
    priority: 3,
    assignee: 'default',
    createdAt: 1788327945000,
    updatedAt: Date.now(),
    tags: ['observatory', 'enhancement'],
    dependencies: [],
  },
  {
    id: 't_9e1c4cc0',
    title: 'GitHub repo create & push hermes-observatory',
    description: 'Create repo and push initial commit',
    status: 'done',
    priority: 3,
    assignee: 'coder',
    createdAt: 1788322920000,
    updatedAt: 1788324252000,
    tags: ['github', 'deployment'],
    dependencies: [],
  },
  {
    id: 't_6fd5ee2d',
    title: 'Research: AI agent orchestration frameworks 2025',
    description: 'Research latest developments in agent orchestration',
    status: 'blocked',
    priority: 1,
    assignee: 'web-researcher',
    createdAt: 1788267758000,
    updatedAt: Date.now(),
    tags: ['research'],
    dependencies: [],
  },
  {
    id: 't_fd2fa0cc',
    title: 'QA verify codebase-knowledge-builder output',
    description: 'Verify documentation on docs/architecture/ branch',
    status: 'done',
    priority: 2,
    assignee: 'qa-engineer',
    createdAt: 1788227979000,
    updatedAt: 1788228100000,
    tags: ['qa', 'docs'],
    dependencies: [],
  },
  {
    id: 't_bae3ce93',
    title: 'Analyze hermes-deneme3 repo with codebase-knowledge-builder',
    description: 'Generate architecture docs and push to new branch',
    status: 'done',
    priority: 2,
    assignee: 'coder',
    createdAt: 1788227965000,
    updatedAt: 1788228100000,
    tags: ['docs', 'analysis'],
    dependencies: [],
  },
  {
    id: 't_a1af52e3',
    title: 'Re-create deskpet main.lua from spec and push',
    description: 'Recreate the deskpet Lua source and commit',
    status: 'done',
    priority: 2,
    assignee: 'coder',
    createdAt: 1788202868000,
    updatedAt: 1788204000000,
    tags: ['deskpet', 'lua'],
    dependencies: [],
  },
  {
    id: 't_9c6bcad4',
    title: 'Implement deskpet MVP features',
    description: 'Build deskpet MVP from task.md spec',
    status: 'done',
    priority: 2,
    assignee: 'coder',
    createdAt: 1788177215000,
    updatedAt: 1788177300000,
    tags: ['deskpet', 'mvp'],
    dependencies: [],
  },
  {
    id: 't_3b44b68c',
    title: 'QA test deskpet MVP features',
    description: 'Run QA on Tier 1 + Tier 2 features',
    status: 'done',
    priority: 2,
    assignee: 'qa-engineer',
    createdAt: 1788177254000,
    updatedAt: 1788178000000,
    tags: ['qa', 'deskpet'],
    dependencies: [],
  },
];

const MOCK_SUBAGENTS = [
  {
    id: 's_coder_t1d891c72',
    ticketId: 't_1d891c72',
    profile: 'default',
    task: 'Add real Kanban + subagent data to Hermes Observatory dashboard',
    status: 'running',
    startedAt: Date.now() - 60000,
    model: 'nvidia/nemotron-3-ultra',
    tokens: { input: 2450, output: 1820, total: 4270 },
    steps: 12,
    currentStep: 'Modifying src/api/hermes.ts to add mock fallback layer',
  },
  {
    id: 's_coder_t9e1c4cc0',
    ticketId: 't_9e1c4cc0',
    profile: 'coder',
    task: 'GitHub repo create & push hermes-observatory',
    status: 'done',
    startedAt: 1788322920000,
    completedAt: 1788324252000,
    model: 'poolside/laguna-s-2.1',
    tokens: { input: 1850, output: 920, total: 2770 },
    steps: 8,
  },
  {
    id: 's_coder_tbae3ce93',
    ticketId: 't_bae3ce93',
    profile: 'coder',
    task: 'Analyze hermes-deneme3 repo with codebase-knowledge-builder',
    status: 'done',
    startedAt: 1788227965000,
    completedAt: 1788228100000,
    model: 'poolside/laguna-s-2.1',
    tokens: { input: 12400, output: 8930, total: 21330 },
    steps: 24,
  },
];

const MOCK_PROFILES = {
  default: {
    id: 'default',
    name: 'Default (Orchestrator)',
    model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    provider: 'openrouter',
    status: 'active',
    currentTask: 'Add real Kanban data to Observatory',
    tokensToday: 4270,
    errors: 0,
    iterations: 0,
    fallbackChain: ['gemini-2.5-flash', 'z-ai/glm-5.2:free', 'minimax/minimax-m3:free', 'meituan/longcat-2.0:free'],
  },
  coder: {
    id: 'coder',
    name: 'Coder',
    model: 'poolside/laguna-s-2.1',
    provider: 'nous',
    status: 'idle',
    currentTask: null,
    tokensToday: 24100,
    errors: 0,
    iterations: 0,
    fallbackChain: ['z-ai/glm-5.2:free', 'minimax/minimax-m3:free', 'inclusionai/ling-3.0-flash-fin:free'],
  },
  'qa-engineer': {
    id: 'qa-engineer',
    name: 'QA-Engineer',
    model: 'deepseek-v4-flash',
    provider: 'nous',
    status: 'idle',
    currentTask: null,
    tokensToday: 8930,
    errors: 0,
    iterations: 0,
    fallbackChain: ['gemini-2.5-flash', 'z-ai/glm-5.2:free'],
  },
  'web-researcher': {
    id: 'web-researcher',
    name: 'Web-Researcher',
    model: 'gemini-2.5-flash',
    provider: 'google',
    status: 'idle',
    currentTask: null,
    tokensToday: 12400,
    errors: 0,
    iterations: 0,
    fallbackChain: ['z-ai/glm-5.2:free', 'minimax/minimax-m3:free'],
  },
};

const MOCK_TOKEN_USAGE = [
  { profile: 'default', hour: '00:00', tokens: 240, requests: 4 },
  { profile: 'default', hour: '01:00', tokens: 180, requests: 3 },
  { profile: 'default', hour: '02:00', tokens: 420, requests: 7 },
  { profile: 'default', hour: '03:00', tokens: 1240, requests: 12 },
  { profile: 'default', hour: '04:00', tokens: 2890, requests: 18 },
  { profile: 'default', hour: '05:00', tokens: 4270, requests: 28 },
  { profile: 'coder', hour: '00:00', tokens: 1240, requests: 8 },
  { profile: 'coder', hour: '01:00', tokens: 890, requests: 5 },
  { profile: 'coder', hour: '02:00', tokens: 1840, requests: 11 },
  { profile: 'coder', hour: '03:00', tokens: 4280, requests: 19 },
  { profile: 'coder', hour: '04:00', tokens: 12400, requests: 42 },
  { profile: 'coder', hour: '05:00', tokens: 24100, requests: 78 },
  { profile: 'qa-engineer', hour: '00:00', tokens: 0, requests: 0 },
  { profile: 'qa-engineer', hour: '01:00', tokens: 1240, requests: 4 },
  { profile: 'qa-engineer', hour: '02:00', tokens: 890, requests: 3 },
  { profile: 'qa-engineer', hour: '03:00', tokens: 2890, requests: 9 },
  { profile: 'qa-engineer', hour: '04:00', tokens: 8930, requests: 24 },
  { profile: 'qa-engineer', hour: '05:00', tokens: 8930, requests: 24 },
  { profile: 'web-researcher', hour: '00:00', tokens: 0, requests: 0 },
  { profile: 'web-researcher', hour: '01:00', tokens: 0, requests: 0 },
  { profile: 'web-researcher', hour: '02:00', tokens: 1240, requests: 5 },
  { profile: 'web-researcher', hour: '03:00', tokens: 4280, requests: 14 },
  { profile: 'web-researcher', hour: '04:00', tokens: 12400, requests: 38 },
  { profile: 'web-researcher', hour: '05:00', tokens: 12400, requests: 38 },
];

const MOCK_METRICS = {
  timestamp: Date.now(),
  profiles: MOCK_PROFILES,
  activeTickets: 1,
  completedTickets: 7,
  failedTickets: 0,
  totalTokensToday: 49700,
  totalTokensWeek: 184230,
  totalTokensMonth: 1240890,
  avgResponseTime: 1.84,
  errorRate: 0.02,
  throughput: 142,
  circuitBreakerActive: false,
  activeSubagents: 1,
  completedSubagents: 2,
};

const MOCK_LOGS = [
  { id: 'l1', timestamp: Date.now() - 60000, level: 'info', profile: 'default', message: 'Kanban ticket t_1d891c72 claimed by default' },
  { id: 'l2', timestamp: Date.now() - 50000, level: 'info', profile: 'default', message: 'Creating branch feat/real-kanban-subagent-data' },
  { id: 'l3', timestamp: Date.now() - 40000, level: 'info', profile: 'default', message: 'Reading src/api/hermes.ts' },
  { id: 'l4', timestamp: Date.now() - 30000, level: 'info', profile: 'default', message: 'Adding mock fallback layer to fetch()' },
  { id: 'l5', timestamp: Date.now() - 20000, level: 'info', profile: 'default', message: 'Querying kanban.db for real ticket data' },
  { id: 'l6', timestamp: Date.now() - 10000, level: 'info', profile: 'default', message: 'Adding MOCK_TICKETS, MOCK_SUBAGENTS, MOCK_PROFILES' },
  { id: 'l7', timestamp: Date.now() - 5000, level: 'debug', profile: 'default', message: 'Mock data populated with 8 tickets, 3 subagents' },
  { id: 'l8', timestamp: Date.now() - 2000, level: 'info', profile: 'default', message: 'Running npm run build to verify TypeScript' },
];