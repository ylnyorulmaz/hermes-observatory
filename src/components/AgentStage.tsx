// src/components/AgentStage.tsx — grid of 6 agent tiles.
import type { ReactElement } from 'react';
import type { Agent } from '../lib/types';
import { AgentCard } from './AgentCard';

export function AgentStage({ agents }: { agents: Agent[] }): ReactElement {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {agents.map((a) => (
        <AgentCard key={a.id} agent={a} />
      ))}
    </div>
  );
}
