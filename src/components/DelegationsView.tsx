import type { Delegation } from "@/lib/types";
import { Empty } from "@/components/ui/8bit/empty";
import { Badge } from "@/components/ui/8bit/badge";
import { fmtDate, fmtDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATE_STYLE: Record<Delegation["state"], { label: string; className: string }> = {
  running: {
    label: "RUNNING",
    className: "border-secondary bg-secondary text-secondary-foreground",
  },
  completed: {
    label: "COMPLETED",
    className: "border-primary bg-primary text-primary-foreground",
  },
  failed: {
    label: "FAILED",
    className: "border-destructive bg-destructive text-destructive-foreground",
  },
};

export function DelegationsView({ delegations }: { delegations: Delegation[] }) {
  if (delegations.length === 0) {
    return (
      <Empty className="py-16">
        <div className="text-[10px] text-foreground">DELEGASYON YOK</div>
        <div className="text-[8px] text-muted-foreground">async_delegations boş</div>
      </Empty>
    );
  }

  return (
    <div className="space-y-2 p-4">
      {delegations.map((d) => {
        const st = STATE_STYLE[d.state] ?? STATE_STYLE.failed;
        const dur =
          d.completed_at && d.dispatched_at
            ? fmtDuration(d.completed_at - d.dispatched_at)
            : d.dispatched_at
              ? "devam ediyor"
              : "—";
        return (
          <div key={d.id} className="pixel-border bg-card p-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[8px] text-muted-foreground">{d.id}</span>
              <Badge className={cn("px-1.5 py-0.5 text-[7px]", st.className)}>{st.label}</Badge>
              <span className="ml-auto text-[7px] text-muted-foreground">{dur}</span>
            </div>
            <div className="mt-1 break-words text-[8px] text-foreground">{d.task || "(görev yok)"}</div>
            <div className="mt-1 font-mono text-[7px] text-muted-foreground/70">
              {fmtDate(d.dispatched_at)}
              {d.completed_at ? ` → ${fmtDate(d.completed_at)}` : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}
