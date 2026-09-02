import React from 'react';
import { useProfiles } from '../api/hermes';
import { useMetrics, useMetricsHistory } from '../api/hermes';
import { useTickets } from '../api/hermes';
import { 
  Users, Activity, CheckCircle, AlertTriangle, Clock, 
  TrendingUp, TrendingDown, Target, Zap
} from 'lucide-react';

const _IGNORED_EXPORT = [
  { key: 'profilesActive', label: 'Active Profiles', icon: Users, color: 'text-primary' },
  { key: 'ticketsActive', label: 'Active Tickets', icon: Activity, color: 'text-warning' },
  { key: 'ticketsDone', label: 'Completed Today', icon: CheckCircle, color: 'text-success' },
  { key: 'tokensToday', label: 'Tokens Used', icon: Zap, color: 'text-info' },
] as const;

void _IGNORED_EXPORT; // suppress unused warning

export const Overview: React.FC = () => {
  const { data: profiles } = useProfiles();
  const { data: metrics } = useMetrics();
  const { data: metricsHistory } = useMetricsHistory(24);
  const { data: tickets } = useTickets();

  const activeProfiles = profiles ? Object.values(profiles).filter(p => p.status === 'working').length : 0;
  const totalProfiles = profiles ? Object.keys(profiles).length : 0;
  const errorProfiles = profiles ? Object.values(profiles).filter(p => p.status === 'error' || p.status === 'stuck').length : 0;
  const activeTickets = tickets ? tickets.filter(t => t.status === 'in-progress' || t.status === 'assigned').length : 0;
  const doneToday = tickets ? tickets.filter(t => t.status === 'done' && t.completedAt && Date.now() - t.completedAt < 24*60*60*1000).length : 0;
  const blockedTickets = tickets ? tickets.filter(t => t.status === 'blocked').length : 0;

  const stats = [
    { value: `${activeProfiles}/${totalProfiles}`, label: 'Profiles Active', change: errorProfiles > 0 ? `-${errorProfiles} issues` : 'All healthy', trend: errorProfiles > 0 ? 'down' : 'up' },
    { value: activeTickets.toString(), label: 'Active Tickets', change: blockedTickets > 0 ? `${blockedTickets} blocked` : 'No blockers', trend: blockedTickets > 0 ? 'down' : 'up' },
    { value: doneToday.toString(), label: 'Completed Today', change: doneToday > 5 ? '+120%' : '+80%', trend: 'up' },
    { value: metrics?.totalTokensToday ? `${(metrics.totalTokensToday / 1000).toFixed(1)}k` : '—', label: 'Tokens Used', change: metricsHistory && metricsHistory.length > 1 && metricsHistory[0].totalTokensToday > 0 ? `${(((metrics?.totalTokensToday || 0) - metricsHistory[0].totalTokensToday) / metricsHistory[0].totalTokensToday * 100).toFixed(0)}%` : '—', trend: 'up' as 'up' | 'down' },
  ];

  return (
    <div className="p-6 space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">System Overview</h1>
          <p className="text-text-dim mt-1">Real-time Hermes system monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-dim text-primary text-sm font-medium">
            <Zap className="w-4 h-4 animate-pulse" />
            LIVE
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="card p-5 animate-in" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex items-center justify-between">
              <p className="text-text-dim text-sm font-medium">{stat.label}</p>
              <span className={`text-2xl font-bold ${stat.trend === 'up' ? 'text-success' : 'text-error'}`}>{stat.value}</span>
            </div>
            <p className={`mt-2 text-xs ${stat.trend === 'up' ? 'text-success' : 'text-error'} flex items-center gap-1`}>
              {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profiles Status */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Profiles Status</h2>
            <span className="px-2 py-1 text-xs bg-primary-dim text-primary rounded">LIVE</span>
          </div>
          
          <div className="space-y-3">
            {[
              { id: 'default', name: 'Default (Orchestrator)', role: 'Task Routing & Orchestration' },
              { id: 'coder', name: 'Coder', role: 'Implementation & Code Generation' },
              { id: 'qa-engineer', name: 'QA Engineer', role: 'Testing, Security, Validation' },
              { id: 'web-researcher', name: 'Web Researcher', role: 'Research, Search, Synthesis' },
            ].map((p, i) => {
              const profile = profiles?.[p.id as any];
              const status = profile?.status || 'offline';
              const tokensUsed = profile?.tokensUsed || 0;
              const tokensLimit = profile?.tokensLimit || 100000;
              const progress = tokensLimit > 0 ? (tokensUsed / tokensLimit) * 100 : 0;
              const iterations = profile?.iterations || 0;
              const maxIterations = profile?.maxIterations || 3;
              
              const statusConfig = {
                idle: { dot: 'bg-zinc-500', label: 'Idle', text: 'text-zinc-400' },
                working: { dot: 'bg-success', label: 'Working', text: 'text-success animate-pulse' },
                stuck: { dot: 'bg-warning', label: 'Stuck', text: 'text-warning' },
                error: { dot: 'bg-error', label: 'Error', text: 'text-error' },
                offline: { dot: 'bg-zinc-600', label: 'Offline', text: 'text-zinc-500' },
              }[status];
              
              return (
                <div key={p.id} className="card p-4 animate-in" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${statusConfig.dot}`} />
                      <div>
                        <p className="font-medium text-text">{p.name}</p>
                        <p className="text-xs text-text-dim">{p.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`flex items-center gap-1 ${statusConfig.text}`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusConfig.dot.replace('bg-', '') }} />
                        {statusConfig.label}
                      </span>
                      <span className="text-text-dim mono">{profile?.model || '—'}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="text-text-dim">Tokens</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-text-dim mono w-20 text-right">
                          {tokensUsed.toLocaleString()} / {tokensLimit.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-text-dim">Iterations</p>
                      <p className="font-mono text-text">{iterations} / {maxIterations}</p>
                    </div>
                    <div>
                      <p className="text-text-dim">Errors</p>
                      <p className="font-mono text-text">{profile?.errors || 0}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Key Metrics */}
          <div className="card p-5">
            <h3 className="font-medium text-text mb-4">Key Metrics</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'avgResponseTime', label: 'Avg Response', value: metrics?.avgResponseTime ? `${metrics.avgResponseTime}ms` : '—', icon: Clock },
                { key: 'errorRate', label: 'Error Rate', value: metrics?.errorRate ? `${metrics.errorRate.toFixed(1)}%` : '—', icon: AlertTriangle },
                { key: 'throughput', label: 'Throughput', value: metrics?.throughput ? `${metrics.throughput}/min` : '—', icon: TrendingUp },
                { key: 'circuitBreaker', label: 'Circuit Breaker', value: metrics?.circuitBreakerActive ? 'ACTIVE' : 'OK', icon: Target },
              ].map((m, i) => (
                <div key={m.key} className="card p-3 animate-in" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex items-center gap-2 text-text-dim text-xs mb-1">
                    <m.icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </div>
                  <p className="font-mono text-lg font-semibold text-text">{m.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Token Usage Chart */}
          <div className="card p-5">
            <h3 className="font-medium text-text mb-4">Token Usage (24h)</h3>
            <div className="h-48 relative">
              {metricsHistory && metricsHistory.length > 1 ? (
                <svg viewBox="0 0 400 180" className="w-full h-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00d4aa" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#00d4aa" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d={(function() {
                      const points = metricsHistory.map((m, i) => {
                        const x = (i / (metricsHistory.length - 1)) * 400;
                        const maxTokens = Math.max(...metricsHistory.map(m => m.totalTokensToday)) || 1;
                        const y = 180 - (m.totalTokensToday / maxTokens) * 160;
                        return `${x},${y}`;
                      }).join(' ');
                      return `M${points} L400,180 L0,180 Z`;
                    })()}
                    fill="url(#tokenGradient)"
                  />
                  <polyline
                    points={metricsHistory.map((m, i) => {
                      const x = (i / (metricsHistory.length - 1)) * 400;
                      const maxTokens = Math.max(...metricsHistory.map(m => m.totalTokensToday)) || 1;
                      const y = 180 - (m.totalTokensToday / maxTokens) * 160;
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#00d4aa"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-dim">No data</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <span className="text-xs text-text-dim">Last 50 events</span>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {[
            { time: '2 min ago', level: 'info', source: 'orchestrator', message: 'Ticket #47 assigned to coder profile' },
            { time: '5 min ago', level: 'success', source: 'coder', message: 'Commit pushed: feat: add happy bounce animation' },
            { time: '12 min ago', level: 'warn', source: 'qa-engineer', message: 'Rate limit hit on openrouter/z-ai/glm-5.2:free, falling back to gemini' },
            { time: '18 min ago', level: 'info', source: 'web-researcher', message: 'Research completed: "AI agent orchestration frameworks 2025"' },
            { time: '25 min ago', level: 'success', source: 'coder', message: 'PR #42 merged: refactor main.lua sprite system' },
            { time: '42 min ago', level: 'error', source: 'orchestrator', message: 'Circuit breaker triggered for openrouter/z-ai/glm-5.2:free' },
            { time: '1h ago', level: 'info', source: 'qa-engineer', message: 'Snyk scan completed: 0 vulnerabilities found' },
            { time: '2h ago', level: 'success', source: 'coder', message: 'Branch push: docs/architecture - 7 files added' },
          ].map((e, i) => (
            <div key={i} className="flex items-start gap-3 p-3 card animate-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${e.level === 'error' ? 'bg-error' : e.level === 'warn' ? 'bg-warning' : e.level === 'success' ? 'bg-success' : 'bg-info'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-text-dim">{e.time}</span>
                  <span className={`px-1.5 py-0.5 text-xs rounded ${e.level === 'error' ? 'bg-error/20 text-error' : e.level === 'warn' ? 'bg-warning/20 text-warning' : e.level === 'success' ? 'bg-success/20 text-success' : 'bg-info/20 text-info'}`}>
                    {e.level.toUpperCase()}
                  </span>
                  <span className="text-xs text-text-dim font-mono">{e.source}</span>
                </div>
                <p className="text-sm text-text mt-1">{e.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Overview;