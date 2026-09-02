import React from 'react';
import { useSubagents } from '../api/hermes';
import { useUIStore } from '../store/ui';
import { 
  GitBranch, CheckCircle, 
  X, ExternalLink, Trash2, ChevronLeft, ChevronRight
} from 'lucide-react';

const STATUS_CONFIG = {
  pending: { dot: 'bg-zinc-500', label: 'Pending', bg: 'bg-zinc-500/10', text: 'text-zinc-400' },
  running: { dot: 'bg-primary', label: 'Running', bg: 'bg-primary/10', text: 'text-primary animate-pulse' },
  completed: { dot: 'bg-success', label: 'Completed', bg: 'bg-success/10', text: 'text-success' },
  failed: { dot: 'bg-error', label: 'Failed', bg: 'bg-error/10', text: 'text-error' },
  cancelled: { dot: 'bg-zinc-500', label: 'Cancelled', bg: 'bg-zinc-500/10', text: 'text-zinc-500' },
} as const;

export const SubagentsView: React.FC = () => {
  const { data: subagents } = useSubagents();
  const { selectedSubagent, setSelectedSubagent } = useUIStore();
  const [filterStatus, setFilterStatus] = React.useState<string | null>(null);
  const [filterProfile, setFilterProfile] = React.useState<string | null>(null);

  const allSubagents = subagents || [];
  const filteredSubagents = allSubagents.filter(sa => {
    if (filterStatus && sa.status !== filterStatus) return false;
    if (filterProfile && sa.profile !== filterProfile) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-4 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Subagents</h1>
          <p className="text-text-dim mt-1">Track all delegated tasks and subagent executions</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded">
            {allSubagents.filter(s => s.status === 'running').length} Active
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-4">
        <select
          value={filterStatus || ''}
          onChange={e => setFilterStatus(e.target.value || null)}
          className="input max-w-[160px]"
        >
          <option value="">All Status</option>
          <option value="running">Running</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
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
      </div>

      {/* Subagents Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 text-left text-xs text-text-dim uppercase tracking-wide">
                <th className="p-3">Agent</th>
                <th className="p-3">Profile</th>
                <th className="p-3">Status</th>
                <th className="p-3">Goal</th>
                <th className="p-3 mono">Tokens</th>
                <th className="p-3 mono">Steps</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubagents.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-text-dim">
                    No subagents found
                  </td>
                </tr>
              )}
              {filteredSubagents.map((sa, i) => {
                  const statusConfig = STATUS_CONFIG[sa.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                  const duration = sa.completedAt 
                    ? sa.completedAt - sa.startedAt
                    : Date.now() - sa.startedAt;
                  const durationStr = duration < 60000 
                    ? `${Math.round(duration / 1000)}s`
                    : duration < 3600000
                      ? `${Math.round(duration / 60000)}m`
                      : `${Math.round(duration / 3600000)}h`;

                  return (
                    <tr key={sa.id} className={`border-b border-border/50 animate-in ${selectedSubagent === sa.id ? 'bg-primary/5' : ''}`} style={{ animationDelay: `${i * 50}ms` }}>
                      <td className="p-3">
                        <div className="font-mono text-sm text-text truncate max-w-[120px]">{sa.id.slice(0, 12)}</div>
                        <div className="text-xs text-text-dim truncate max-w-[120px]">Task: {sa.parentTaskId?.slice(0, 8)}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 text-xs rounded bg-primary/10 text-primary capitalize">{sa.profile}</span>
                      </td>
                      <td className="p-3">
                        <span className={`flex items-center gap-1.5 px-2 py-0.5 text-xs rounded ${statusConfig.bg} ${statusConfig.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-text truncate max-w-[300px]" title={sa.goal}>{sa.goal}</div>
                      </td>
                      <td className="p-3 mono text-text-dim">{sa.tokensUsed?.toLocaleString() || 0}</td>
                      <td className="p-3 mono text-text-dim">{sa.steps || 0}</td>
                      <td className="p-3 text-text-dim">{durationStr}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedSubagent(selectedSubagent === sa.id ? null : sa.id)}
                            className={`p-1.5 rounded ${selectedSubagent === sa.id ? 'bg-primary/20 text-primary' : 'text-text-dim hover:text-text'}`}
                            aria-label={selectedSubagent === sa.id ? 'Deselect' : 'Select'}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {}}
                            className="p-1.5 rounded text-text-dim hover:text-text"
                            title="View Logs"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          {sa.status === 'running' && (
                            <button
                              onClick={() => {}}
                              className="p-1.5 rounded text-error hover:bg-error/10"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
              })}
            </tbody>
          </table>
        </div>

        {filteredSubagents.length === 0 && (
          <div className="p-8 text-center text-text-dim">
            No subagents match the current filters
          </div>
        )}
      </div>

      {/* Selected Subagent Detail */}
      {selectedSubagent && (
        <div className="fixed inset-0 z-50 animate-in">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedSubagent(null)} />
          <div className="absolute right-0 top-0 bottom-0 w-96 max-w-full bg-surface border-l border-border shadow-2xl overflow-y-auto">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">Subagent Details</h2>
              <button onClick={() => setSelectedSubagent(null)} className="btn btn-ghost p-1.5"><ChevronLeft className="w-4 h-4" /></button>
            </div>
            <div className="p-4 overflow-y-auto h-[calc(100%-60px)]">
              {(() => {
                const sa = filteredSubagents.find(s => s.id === selectedSubagent);
                if (!sa) return null;
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center`}>
                        <GitBranch className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-text">{sa.id.slice(0, 12)}</h3>
                        <p className="text-xs text-text-dim">Parent Task: {sa.parentTaskId?.slice(0, 8)}</p>
                      </div>
                      <span className={`ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[sa.status as keyof typeof STATUS_CONFIG].bg} ${STATUS_CONFIG[sa.status as keyof typeof STATUS_CONFIG].text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[sa.status as keyof typeof STATUS_CONFIG].dot}`} />
                        {STATUS_CONFIG[sa.status as keyof typeof STATUS_CONFIG].label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-3 bg-background/50 rounded-lg">
                      <div>
                        <p className="text-xs text-text-dim">Profile</p>
                        <p className="font-medium capitalize">{sa.profile}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-dim">Role</p>
                        <p className="font-medium capitalize">{sa.role}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-dim">Tokens</p>
                        <p className="font-mono text-text">{sa.tokensUsed?.toLocaleString() || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-dim">Steps</p>
                        <p className="font-mono text-text">{sa.steps || 0}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-text-dim uppercase tracking-wide mb-2">Goal</p>
                      <p className="text-text">{sa.goal}</p>
                    </div>

                    {sa.currentStep && (
                      <div>
                        <p className="text-xs text-text-dim uppercase tracking-wide mb-2">Current Step</p>
                        <p className="text-text">{sa.currentStep}</p>
                      </div>
                    )}

                    {sa.result && (
                      <div className="pt-4 border-t border-border/50">
                        <p className="text-xs text-text-dim uppercase tracking-wide mb-2">Result</p>
                        <pre className="p-3 bg-background rounded-lg text-sm mono overflow-x-auto max-h-60 overflow-y-auto">{sa.result}</pre>
                      </div>
                    )}

                    {sa.error && (
                      <div className="pt-4 border-t border-border/50">
                        <p className="text-xs text-text-dim uppercase tracking-wide mb-2">Error</p>
                        <pre className="p-3 bg-error/10 rounded-lg text-sm text-error overflow-x-auto max-h-60 overflow-y-auto">{sa.error}</pre>
                      </div>
                    )}

                    <div className="pt-4 border-t border-border/50 flex gap-2">
                      <button className="btn btn-primary flex-1"><CheckCircle className="w-4 h-4" /> Mark Done</button>
                      <button className="btn btn-ghost flex-1"><Trash2 className="w-4 h-4" /> Cancel</button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubagentsView;