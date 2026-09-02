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