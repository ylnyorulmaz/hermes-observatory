import { useMemo } from "react";
import type { Agent } from "@/lib/types";

interface TickerItem {
  ts: number;
  agent: string;
  tool: string;
  text: string;
}

export function ActivityTicker({ agents }: { agents: Agent[] }) {
  const items = useMemo(() => {
    const all: TickerItem[] = [];
    for (const a of agents) {
      for (const r of a.recent) {
        all.push({ ts: r.ts, agent: a.label, tool: r.tool, text: r.text });
      }
    }
    return all.sort((x, y) => y.ts - x.ts).slice(0, 12);
  }, [agents]);

  if (items.length === 0) {
    return (
      <div className="font-pixel text-[10px] text-muted-foreground">
        [ henüz etkinlik yok ]
      </div>
    );
  }

  return (
    <div className="overflow-hidden whitespace-nowrap">
      <div className="inline-flex min-w-full gap-8 font-mono text-xs motion-safe:animate-[ticker_30s_linear_infinite]">
        {items.map((it, i) => (
          <span key={i} className="inline-flex items-center gap-2">
            <span className="font-pixel text-[9px] text-primary">{it.tool}</span>
            <span className="text-muted-foreground">{it.agent}</span>
            <span className="text-foreground/80">{it.text}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
