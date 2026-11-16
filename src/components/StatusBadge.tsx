// src/components/StatusBadge.tsx — busy/idle/offline 8-bit badge.
import type { ReactElement } from 'react';
import type { AgentStatus } from '../lib/types';
import { Badge } from './ui/badge';

const MAP: Record<AgentStatus, { variant: 'busy' | 'idle' | 'offline'; label: string; dot: string }> = {
  busy: { variant: 'busy', label: 'BUSY', dot: '■' },
  idle: { variant: 'idle', label: 'IDLE', dot: '■' },
  offline: { variant: 'offline', label: 'OFFLINE', dot: '□' },
};

export function StatusBadge({ status }: { status: AgentStatus }): ReactElement {
  const m = MAP[status];
  return (
    <Badge variant={m.variant}>
      <span aria-hidden="true">{m.dot}</span>
      {m.label}
    </Badge>
  );
}
