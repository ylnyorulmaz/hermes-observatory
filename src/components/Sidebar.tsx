import React from 'react';
import { LayoutDashboard, Users, Kanban, GitBranch, Activity, Terminal, Settings, ChevronLeft, Zap, AlertTriangle, Circle } from 'lucide-react';
import { useUIStore } from '../store/ui';
import { useProfiles } from '../api/hermes';

const NAV_ITEMS = [
  { id: 'overview', icon: LayoutDashboard, label: 'Overview', badge: null },
  { id: 'profiles', icon: Users, label: 'Profiles', badge: 'live' },
  { id: 'kanban', icon: Kanban, label: 'Kanban', badge: null },
  { id: 'subagents', icon: GitBranch, label: 'Subagents', badge: null },
  { id: 'tokens', icon: Activity, label: 'Tokens', badge: null },
  { id: 'logs', icon: Terminal, label: 'Logs', badge: null },
] as const;

export const Sidebar: React.FC = () => {
  const { 
    viewMode, 
    setViewMode, 
    sidebarOpen, 
    toggleSidebar,
    selectedProfile,
    timeRange,
    setTimeRange,
    autoRefresh,
    toggleAutoRefresh,
    refreshInterval,
    theme,
    toggleTheme,
  } = useUIStore();
  
  const { data: profiles } = useProfiles();

  if (!sidebarOpen) {
    return (
      <button
        onClick={toggleSidebar}
        className="fixed left-2 top-2 z-50 w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center hover:bg-surface-hover transition-colors"
        aria-label="Open sidebar"
      >
        <LayoutDashboard className="w-5 h-5 text-text-dim" />
      </button>
    );
  }

  const activeCount = profiles ? Object.values(profiles).filter(p => p.status === 'working').length : 0;
  const errorCount = profiles ? Object.values(profiles).filter(p => p.status === 'error' || p.status === 'stuck').length : 0;

  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col h-full transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-dim flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-text truncate">Hermes Observatory</h1>
            <p className="text-xs text-text-dim truncate">Monitoring Dashboard</p>
          </div>
        </div>
        
        {/* Status indicators */}
        <div className="mt-3 flex items-center gap-2">
          <span className="flex-1 px-2 py-1 text-xs rounded bg-success/10 text-success flex items-center justify-center gap-1">
            <Circle className="w-1.5 h-1.5 animate-pulse" />
            {activeCount} Active
          </span>
          {errorCount > 0 && (
            <span className="flex-1 px-2 py-1 text-xs rounded bg-error/10 text-error flex items-center justify-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {errorCount} Issues
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const isActive = viewMode === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setViewMode(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-primary-dim text-primary border border-primary/30'
                  : 'text-text-dim hover:bg-surface-hover hover:text-text'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge === 'live' && (
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Profile Quick Select */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-text-dim uppercase tracking-wide">Quick Profile</span>
        </div>
        <select
          value={selectedProfile || ''}
          onChange={e => useUIStore.getState().setSelectedProfile(e.target.value || null)}
          className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Profiles</option>
          {profiles && Object.entries(profiles).map(([id, profile]) => (
            <option key={id} value={id}>
              {profile.name} {profile.status === 'working' && '🟢'} {profile.status === 'error' && '🔴'} {profile.status === 'stuck' && '🟡'}
            </option>
          ))}
        </select>
      </div>

      {/* Settings */}
      <div className="p-3 border-t border-border space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-dim">Time Range</span>
          <select
            value={timeRange}
            onChange={e => setTimeRange(e.target.value as any)}
            className="px-2 py-1 text-xs bg-background border border-border rounded text-text"
          >
            <option value="1h">1 Hour</option>
            <option value="6h">6 Hours</option>
            <option value="24h">24 Hours</option>
            <option value="7d">7 Days</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-text-dim">Auto Refresh</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={toggleAutoRefresh}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-border peer-checked:bg-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-all peer-focus:ring-2 peer-focus:ring-primary"></div>
          </label>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-text-dim">Interval</span>
          <select
            value={refreshInterval}
            onChange={e => useUIStore.getState().setRefreshInterval(Number(e.target.value))}
            className="px-2 py-1 text-xs bg-background border border-border rounded text-text"
          >
            <option value={2000}>2s</option>
            <option value={5000}>5s</option>
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
            <option value={60000}>1m</option>
          </select>
        </div>

        <button
          onClick={toggleTheme}
          className="w-full btn btn-ghost text-sm justify-center gap-2"
        >
          <Settings className="w-4 h-4" />
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>

        <div className="pt-3 border-t border-border flex items-center justify-between">
          <span className="text-xs text-text-dim mono">v1.0.0</span>
          <button
            onClick={toggleSidebar}
            className="p-1 rounded hover:bg-surface-hover text-text-dim"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};