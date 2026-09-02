import React from 'react';
import { useLogs } from '../api/hermes';
import { useUIStore } from '../store/ui';
import { 
  Search, X, Download, 
  AlertCircle, Info, AlertTriangle, Loader2
} from 'lucide-react';

const LEVEL_CONFIG = {
  debug: { icon: Info, color: 'text-zinc-400', bg: 'bg-zinc-500/10', label: 'DEBUG' },
  info: { icon: Info, color: 'text-info', bg: 'bg-info/10', label: 'INFO' },
  warn: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', label: 'WARN' },
  error: { icon: AlertCircle, color: 'text-error', bg: 'bg-error/10', label: 'ERROR' },
} as const;

export const LogsView: React.FC = () => {
  const { timeRange, setTimeRange } = useUIStore();
  const { data: logs, isLoading } = useLogs({ limit: 500 });
  const [search, setSearch] = React.useState('');
  const [filterLevel, setFilterLevel] = React.useState<string | null>(null);
  const [filterProfile, setFilterProfile] = React.useState<string | null>(null);
  const [autoScroll, setAutoScroll] = React.useState(true);

  const filteredLogs = logs?.filter(log => {
    if (search && !log.message.toLowerCase().includes(search.toLowerCase()) &&
        !log.source.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterLevel && log.level !== filterLevel) return false;
    if (filterProfile && log.profile !== filterProfile) return false;
    return true;
  }) || [];

  React.useEffect(() => {
    // Auto-scroll handled by browser
  }, [logs?.length, autoScroll]);

  return (
    <div className="p-6 space-y-4 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Logs</h1>
          <p className="text-text-dim mt-1">System logs and debug output</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={e => setAutoScroll(e.target.checked)}
              className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary"
            />
            <span className="text-text-dim">Auto-scroll</span>
          </label>
          <button className="btn btn-ghost">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search logs..."
            className="input pl-9"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={filterLevel || ''}
          onChange={e => setFilterLevel(e.target.value || null)}
          className="input max-w-[140px]"
        >
          <option value="">All Levels</option>
          <option value="error">Error</option>
          <option value="warn">Warn</option>
          <option value="info">Info</option>
          <option value="debug">Debug</option>
        </select>
        <select
          value={filterProfile || ''}
          onChange={e => setFilterProfile(e.target.value || null)}
          className="input max-w-[180px]"
        >
          <option value="">All Profiles</option>
          <option value="default">Default</option>
          <option value="coder">Coder</option>
          <option value="qa-engineer">QA Engineer</option>
          <option value="web-researcher">Web Researcher</option>
        </select>
        <select
          value={timeRange}
          onChange={e => setTimeRange(e.target.value as any)}
          className="input max-w-[140px]"
        >
          <option value="1h">1 Hour</option>
          <option value="6h">6 Hours</option>
          <option value="24h">24 Hours</option>
          <option value="7d">7 Days</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 text-left text-xs text-text-dim uppercase tracking-wide sticky top-0 bg-surface/95 backdrop-blur z-10">
                <th className="p-3 w-32">Time</th>
                <th className="p-3 w-20">Level</th>
                <th className="p-3 w-32">Profile</th>
                <th className="p-3 w-32">Source</th>
                <th className="p-3">Message</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-dim">
                    <Loader2 className="w-6 h-6 mx-auto animate-spin text-primary" />
                    <p className="mt-2 text-text-dim">Loading logs...</p>
                  </td>
                </tr>
              )}
              {!isLoading && filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-dim">
                    No logs match the current filters
                  </td>
                </tr>
              )}
              {!isLoading && filteredLogs.slice(-200).map((log, i) => {
                  const levelConfig = LEVEL_CONFIG[log.level as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG.info;
                  return (
                    <tr key={log.id} className="border-b border-border/50 animate-in hover:bg-surface-hover/50" style={{ animationDelay: `${Math.min(i * 10, 300)}ms` }}>
                      <td className="p-3 text-xs text-text-dim mono font-mono w-32">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="p-3">
                        <span className={`flex items-center gap-1.5 px-2 py-0.5 text-xs rounded ${levelConfig.bg} ${levelConfig.color}`}>
                          <levelConfig.icon className="w-3 h-3" />
                          {levelConfig.label}
                        </span>
                      </td>
                      <td className="p-3">
                        {log.profile && (
                          <span className="px-2 py-0.5 text-xs rounded bg-primary/10 text-primary capitalize truncate block max-w-[80px]">
                            {log.profile}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 text-xs rounded bg-surface-hover text-text-dim truncate block max-w-[80px]">
                          {log.source}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-text truncate max-w-[400px]" title={log.message}>
                          {log.message}
                        </div>
                        {log.metadata && (
                          <details className="mt-1">
                            <summary className="text-xs text-text-dim cursor-pointer">Show metadata</summary>
                            <pre className="mt-1 p-2 bg-background rounded text-xs mono overflow-x-auto max-h-32 overflow-y-auto text-text-dim">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </td>
                    </tr>
                  );
              })}
            </tbody>
          </table>
        </div>

        {filteredLogs.length > 200 && (
          <div className="p-4 border-t border-border/50 text-center text-text-dim">
            Showing latest 200 of {filteredLogs.length} logs. Refine filters to see more.
          </div>
        )}
      </div>
    </div>
  );
};

export default LogsView;