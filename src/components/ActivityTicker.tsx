// src/components/ActivityTicker.tsx — horizontal marquee of recent tool calls.
import { useMemo, type ReactElement } from 'react';
import type { Snapshot } from '../lib/types';
import { useReducedMotion } from '../hooks/useReducedMotion';

export function ActivityTicker({ snapshot }: { snapshot: Snapshot }): ReactElement {
  const reduced = useReducedMotion();

  const items = useMemo(() => {
    const all = snapshot.agents.flatMap((a) =>
      a.recent.map((r) => ({ ts: r.ts, tool: r.tool, text: r.text, agent: a.label })),
    );
    return all.sort((a, b) => b.ts - a.ts).slice(0, 40);
  }, [snapshot]);

  const strip = (
    <div className="flex shrink-0 items-center gap-8 whitespace-nowrap pr-8">
      {items.map((it, i) => (
        <span key={i} className="mono text-xs">
          <span className="text-[#71717a]">{it.agent}</span>{' '}
          <span className="text-[#38d9d9]">{it.tool}</span>{' '}
          <span className="text-[#a1a1aa]">{it.text}</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="pixel-panel overflow-hidden px-4 py-2">
      <div className="mb-1 flex items-center gap-2">
        <span className="font-pixel text-[10px] uppercase tracking-wider text-[#71717a]">live activity</span>
        <span className="h-2 w-2 bg-[#4ade80]" />
      </div>
      {items.length === 0 ? (
        <div className="text-xs text-[#71717a]">aktif tool call yok</div>
      ) : reduced ? (
        <div className="overflow-x-auto">{strip}</div>
      ) : (
        <div className="marquee">
          <div className="marquee-inner">
            {strip}
            {strip}
          </div>
        </div>
      )}
    </div>
  );
}
