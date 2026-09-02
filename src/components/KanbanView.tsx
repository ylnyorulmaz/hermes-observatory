import React from 'react';
import { useTickets } from '../api/hermes';
import { useUIStore } from '../store/ui';
import { 
  Search, Plus, ChevronRight, ChevronLeft,
  Clock, CheckCircle, Trash2
} from 'lucide-react';

const COLUMNS = [
  { id: 'todo', title: 'To Do', status: 'todo', color: 'text-blue-400' },
  { id: 'assigned', title: 'Assigned', status: 'assigned', color: 'text-purple-400' },
  { id: 'in-progress', title: 'In Progress', status: 'in-progress', color: 'text-yellow-400' },
  { id: 'review', title: 'Review', status: 'review', color: 'text-purple-400' },
  { id: 'done', title: 'Done', status: 'done', color: 'text-green-400' },
  { id: 'blocked', title: 'Blocked', status: 'blocked', color: 'text-red-400' },
] as const;

export const KanbanView: React.FC = () => {
  const { data: tickets } = useTickets();
  const { selectedTicket, setSelectedTicket } = useUIStore();
  const [search, setSearch] = React.useState('');
  const [filterProfile, setFilterProfile] = React.useState<string | null>(null);
  const [filterPriority, setFilterPriority] = React.useState<string | null>(null);

  const filteredTickets = tickets?.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && 
        !t.description?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterProfile && t.assignee !== filterProfile) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  }) || [];

  const ticketsByColumn = COLUMNS.reduce((acc, col) => {
    acc[col.id] = filteredTickets
      .filter(t => t.status === col.status)
      .sort((a, b) => a.position - b.position);
    return acc;
  }, {} as Record<string, typeof filteredTickets>);

  return (
    <div className="p-6 space-y-4 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Kanban Board</h1>
          <p className="text-text-dim mt-1">Task management across all profiles</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-primary">
            <Plus className="w-4 h-4" />
            New Ticket
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
            placeholder="Search tickets..."
            className="input pl-9"
          />
        </div>
        <select
          value={filterProfile || ''}
          onChange={e => setFilterProfile(e.target.value || null)}
          className="input max-w-[180px]"
        >
          <option value="">All Profiles</option>
          <option value="default">Default (Orchestrator)</option>
          <option value="coder">Coder</option>
          <option value="qa-engineer">QA Engineer</option>
          <option value="web-researcher">Web Researcher</option>
        </select>
        <select
          value={filterPriority || ''}
          onChange={e => setFilterPriority(e.target.value || null)}
          className="input max-w-[160px]"
        >
          <option value="">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Board */}
      <div className="overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-4" style={{ minWidth: COLUMNS.length * 300 }}>
          {COLUMNS.map((column) => {
            const colTickets = ticketsByColumn[column.id] || [];
            return (
              <div key={column.id} className="flex-shrink-0 w-[300px] flex flex-col">
                {/* Column Header */}
                <div className="flex items-center justify-between px-3 py-3 border-b border-border/50">
                  <h3 className={`font-semibold text-sm ${column.color} uppercase tracking-wide`}>
                    {column.title}
                  </h3>
                  <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                    {ticketsByColumn[column.id]?.length || 0}
                  </span>
                </div>

                {/* Tickets */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[400px]">
                  {colTickets.map((ticket, idx) => (
                    <div 
                      key={ticket.id}
                      className={`card p-3 cursor-pointer animate-in ${selectedTicket === ticket.id ? 'ring-2 ring-primary' : ''}`}
                      style={{ animationDelay: `${idx * 50}ms` }}
                      onClick={() => setSelectedTicket(selectedTicket === ticket.id ? null : ticket.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-text truncate">{ticket.title}</h4>
                          <p className="text-xs text-text-dim line-clamp-2 mt-1">{ticket.description}</p>
                        </div>
                        <span className={`px-1.5 py-0.5 text-xs rounded ${ticket.priority === 'critical' ? 'bg-red-500/20 text-red-400' : ticket.priority === 'high' ? 'bg-red-500/20 text-red-400' : ticket.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-text-dim">
                          <Clock className="w-3 h-3" />
                          Iteration {ticket.iteration}/{ticket.maxIterations}
                        </span>
                        <span className="text-text-dim mono font-mono">#{ticket.id.slice(0, 8)}</span>
                      </div>
                      
                      {ticket.linkedTickets.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <div className="flex items-center gap-1 text-xs text-text-dim mb-1">
                            <ChevronRight className="w-3 h-3" />
                            Linked: {ticket.linkedTickets.length}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {ticket.linkedTickets.slice(0, 3).map(id => (
                              <span key={id} className="px-1.5 py-0.5 text-xs bg-surface-hover rounded text-text-dim hover:text-text truncate max-w-[80px]">{id.slice(0, 10)}</span>
                            ))}
                            {ticket.linkedTickets.length > 3 && <span className="px-1.5 py-0.5 text-xs text-text-dim">+{ticket.linkedTickets.length - 3}</span>}
                          </div>
                        </div>
                      )}

                      {ticket.tags && ticket.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {ticket.tags.map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Empty state */}
                  {colTickets.length === 0 && (
                    <div className="h-32 border-2 border-dashed border-border/50 rounded-lg flex items-center justify-center text-text-dim text-sm">
                      Drop tickets here
                    </div>
                  )}
                </div>

                {/* Add Ticket Button */}
                <button className="w-full btn btn-ghost text-sm justify-center gap-2 p-3 border-t border-border/50">
                  <Plus className="w-4 h-4" />
                  Add Ticket
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ticket Detail Panel */}
      {selectedTicket && (() => {
        const ticket = tickets?.find(t => t.id === selectedTicket);
        if (!ticket) return null;
        return (
        <div className="fixed inset-0 z-50 animate-in">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedTicket(null)} />
          <div className="absolute right-0 top-0 bottom-0 w-96 max-w-full bg-surface border-l border-border shadow-2xl overflow-y-auto">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">Ticket Details</h2>
              <button onClick={() => setSelectedTicket(null)} className="btn btn-ghost p-1.5"><ChevronLeft className="w-4 h-4" /></button>
            </div>
            <div className="p-4 overflow-y-auto h-[calc(100%-60px)]">
              <h3 className="text-lg font-semibold mb-2">{ticket.title}</h3>
              <p className="text-text-dim mb-4">{ticket.description || 'No description'}</p>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-xs text-text-dim uppercase tracking-wide">Status</p>
                  <p className="font-medium capitalize">{ticket.status}</p>
                </div>
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-xs text-text-dim uppercase tracking-wide">Priority</p>
                  <p className="font-medium capitalize">{ticket.priority}</p>
                </div>
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-xs text-text-dim uppercase tracking-wide">Assignee</p>
                  <p className="font-medium capitalize">{ticket.assignee || 'Unassigned'}</p>
                </div>
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-xs text-text-dim uppercase tracking-wide">Iteration</p>
                  <p className="font-medium mono">{ticket.iteration}/{ticket.maxIterations}</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-4">
                <h4 className="text-sm font-medium text-text-dim uppercase tracking-wide">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {ticket.tags.map((tag: string) => (
                    <span key={tag} className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">{tag}</span>
                  ))}
                </div>
              </div>
              
              {ticket.linkedTickets.length > 0 && (
                <div className="space-y-2 mb-4">
                  <h4 className="text-sm font-medium text-text-dim uppercase tracking-wide">Linked Tickets</h4>
                  <div className="flex flex-wrap gap-1">
                    {ticket.linkedTickets.map((id: string) => (
                      <span key={id} className="px-2 py-1 text-xs bg-surface-hover rounded text-text-dim hover:text-text truncate max-w-[120px]">{id}</span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t border-border/50 flex gap-2">
                <button className="btn btn-primary flex-1"><CheckCircle className="w-4 h-4" /> Mark Done</button>
                <button className="btn btn-ghost flex-1"><Clock className="w-4 h-4" /> Reassign</button>
                <button className="btn btn-danger"><Trash2 className="w-4 h-4" /> Delete</button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
};