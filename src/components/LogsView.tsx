import type { Agent } from "@/lib/types";
import { ScrollArea } from "@/components/ui/8bit/scroll-area";
import { Empty } from "@/components/ui/8bit/empty";
import { fmtDate } from "@/lib/format";

interface LogLine {
  ts: number;
  agent: string;
  tool: string;
  text: string;
}

export function LogsView({ agents }: { agents: Agent[] }) {
  const lines: LogLine[] = agents
    .flatMap((a) => a.recent.map((r) => ({ ...r, agent: a.label })))
    .sort((x, y) => y.ts - x.ts)
    .slice(0, 300);

  if (lines.length === 0) {
    return (
      <Empty className="py-16">
        <div className="text-[10px] text-foreground">LOG YOK</div>
        <div className="text-[8px] text-muted-foreground">henüz tool çağrısı kaydedilmedi</div>
      </Empty>
    );
  }

  return (
    <ScrollArea className="h-full border-2 border-foreground bg-card">
      <div className="p-2 font-mono text-[9px] leading-relaxed">
        {lines.map((l, i) => (
          <div
            key={i}
            className="flex gap-2 border-b border-dashed border-border px-1 py-0.5"
          >
            <span className="shrink-0 text-muted-foreground/60">{fmtDate(l.ts)}</span>
            <span className="shrink-0 text-muted-foreground">[{l.agent}]</span>
            <span className="shrink-0 text-primary">{l.tool}</span>
            <span className="truncate text-foreground/80">{l.text}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
