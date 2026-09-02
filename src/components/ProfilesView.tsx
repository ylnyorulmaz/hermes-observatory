import React from 'react';
import { useProfiles } from '../api/hermes';
import { useTickets } from '../api/hermes';
import { useUIStore } from '../store/ui';
import { 
  Brain, Code, Shield, Search, Trash2,
  ExternalLink
} from 'lucide-react';

const PROFILE_INFO = {
  'default': { name: 'Default (Orchestrator)', icon: Brain, color: 'text-purple-400', role: 'Task Routing & Orchestration', model: 'nvidia/nemotron-3-ultra-550b-a55b:free', provider: 'openrouter', fallbacks: ['gemini-2.5-flash', 'glm-5.2:free', 'minimax-m3:free'] },
  'coder': { name: 'Coder', icon: Code, color: 'text-blue-400', role: 'Implementation & Code Generation', model: 'meituan/longcat-2.0:free', provider: 'nous', fallbacks: ['gemini-2.5-flash', 'glm-5.2:free', 'minimax-m3:free'] },
  'qa-engineer': { name: 'QA Engineer', icon: Shield, color: 'text-green-400', role: 'Testing, Security, Validation', model: 'deepseek-v4-flash', provider: 'nous', fallbacks: ['gemini-2.5-flash', 'upstage/solar-pro4:free'] },
  'web-researcher': { name: 'Web Researcher', icon: Search, color: 'text-orange-400', role: 'Research, Search, Synthesis', model: 'gemini-2.5-flash', provider: 'google', fallbacks: ['gemini-1.5-flash', 'gemini-2.5-flash (direct)'] },
} as const;

export const ProfilesView: React.FC = () => {
  const { data: profiles } = useProfiles();
  const { data: tickets } = useTickets();
  const { selectedProfile, setSelectedProfile } = useUIStore();

  const profileIds = ['default', 'coder', 'qa-engineer', 'web-researcher'] as const;

  return (
    <div className="p-6 space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Profiles</h1>
          <p className="text-text-dim mt-1">Monitor and manage all agent profiles</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {profileIds.map((pid, i) => {
          const info = PROFILE_INFO[pid];
          const profile = profiles?.[pid as any];
          const profileTickets = tickets?.filter(t => t.assignee === pid) || [];
          const status = profile?.status || 'offline';
          
          const statusConfig = {
            idle: { dot: 'bg-zinc-500', label: 'Idle', bg: 'bg-zinc-500/10', border: 'border-zinc-500/30', text: 'text-zinc-400' },
            working: { dot: 'bg-success', label: 'Working', bg: 'bg-success/10', border: 'border-success/30', text: 'text-success' },
            stuck: { dot: 'bg-warning', label: 'Stuck', bg: 'bg-warning/10', border: 'border-warning/30', text: 'text-warning' },
            error: { dot: 'bg-error', label: 'Error', bg: 'bg-error/10', border: 'border-error/30', text: 'text-error' },
            offline: { dot: 'bg-zinc-600', label: 'Offline', bg: 'bg-zinc-600/10', border: 'border-zinc-600/30', text: 'text-zinc-500' },
          }[status];

          return (
            <div key={pid} className={`card animate-in ${selectedProfile === pid ? 'ring-2 ring-primary/50' : ''}`} style={{ animationDelay: `${i * 100}ms` }}>
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${info.color} bg-opacity-10 flex items-center justify-center`}>
                      <info.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-text">{info.name}</h3>
                      <p className="text-xs text-text-dim">{info.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.border} ${statusConfig.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                      {statusConfig.label}
                    </span>
                    {selectedProfile === pid && (
                      <button
                        onClick={() => setSelectedProfile(null)}
                        className="btn btn-ghost p-1.5"
                        aria-label="Deselect"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Model & Provider */}
                <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-background/50 rounded-lg">
                  <div>
                    <p className="text-xs text-text-dim uppercase tracking-wide">Model</p>
                    <p className="font-mono text-sm text-text">{profile?.model || info.model}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-dim uppercase tracking-wide">Provider</p>
                    <p className="font-mono text-sm text-text capitalize">{profile?.provider || info.provider}</p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 bg-background/50 rounded-lg text-center">
                    <p className="text-2xl font-bold mono text-text">{profile?.iterations || 0}</p>
                    <p className="text-xs text-text-dim">Iterations</p>
                  </div>
                  <div className="p-3 bg-background/50 rounded-lg text-center">
                    <p className="text-2xl font-bold mono text-text">{profile?.tokensUsed?.toLocaleString() || 0}</p>
                    <p className="text-xs text-text-dim">Tokens Used</p>
                  </div>
                  <div className="p-3 bg-background/50 rounded-lg text-center">
                    <p className="text-2xl font-bold mono text-text">{profile?.errors || 0}</p>
                    <p className="text-xs text-text-dim">Errors</p>
                  </div>
                </div>

                {/* Token Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-text-dim">Token Usage</span>
                    <span className="text-text-dim mono">
                      {(profile?.tokensUsed || 0).toLocaleString()} / {(profile?.tokensLimit || 100000).toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 bg-border rounded-full overflow-hidden mt-1">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(((profile?.tokensUsed || 0) / (profile?.tokensLimit || 100000)) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-dim mt-1">
                    {profile?.tokensLimit ? `${Math.round(Math.min(((profile?.tokensUsed || 0) / (profile?.tokensLimit || 100000)) * 100, 100))}% used` : 'Unlimited'}
                  </p>
                </div>

                {/* Tickets Assigned */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-text-dim uppercase tracking-wide">Assigned Tickets</p>
                    <span className="text-xs mono text-text-dim">{profileTickets.length}</span>
                  </div>
                  <div className="flex gap-2">
                    {[
                      { status: 'in-progress', label: 'Active', color: 'bg-blue-500/10 text-blue-400' },
                      { status: 'review', label: 'Review', color: 'bg-purple-500/10 text-purple-400' },
                      { status: 'done', label: 'Done', color: 'bg-success/10 text-success' },
                      { status: 'blocked', label: 'Blocked', color: 'bg-error/10 text-error' },
                    ].map(s => {
                      const count = profileTickets.filter(t => t.status === s.status).length;
                      if (count === 0) return null;
                      return (
                        <span key={s.status} className={`px-2 py-0.5 text-xs rounded ${s.color}`}>
                          {s.label} ({count})
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Fallback Chain */}
                <div className="pt-4 border-t border-border/50">
                  <p className="text-xs text-text-dim uppercase tracking-wide mb-2">Fallback Chain</p>
                  <div className="flex flex-wrap gap-1.5">
                    {info.fallbacks.map((fb, idx) => (
                      <span key={fb} className={`px-2 py-0.5 text-xs rounded bg-background border ${idx === 0 ? 'border-primary/50 text-primary' : 'border-border text-text-dim'}`}>
                        {idx === 0 ? 'Primary: ' : ''}{fb}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-border/50 flex gap-2">
                  <button
                    onClick={() => setSelectedProfile(selectedProfile === pid ? null : pid)}
                    className={`flex-1 btn ${selectedProfile === pid ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    {selectedProfile === pid ? 'Selected' : 'Select'}
                  </button>
                  <button
                    onClick={() => {
                      // Restart profile action
                    }}
                    className="btn btn-ghost"
                    disabled={status === 'offline'}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Restart
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Profile Detail */}
      {selectedProfile && (
        <div className="animate-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Profile Details: {PROFILE_INFO[selectedProfile as keyof typeof PROFILE_INFO].name}</h2>
            <button
              onClick={() => setSelectedProfile(null)}
              className="btn btn-ghost text-sm"
            >
              Close Detail
            </button>
          </div>
          <div className="card p-5">
            <p className="text-text-dim">Detailed metrics, live logs, and configuration for {selectedProfile} would appear here.</p>
            <p className="text-text-dim mt-2">Integration with Hermes internal APIs for real-time token tracking, iteration history, and error logs.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilesView;