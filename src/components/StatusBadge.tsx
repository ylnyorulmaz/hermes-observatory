import { Badge } from "@/components/ui/8bit/badge";
import { cn } from "@/lib/utils";
import type { AgentStatus } from "@/lib/types";

const STATUS_META: Record<
  AgentStatus,
  { variant: "default" | "secondary" | "outline"; dot: string; label: string }
> = {
  busy: { variant: "default", dot: "bg-[#7dff6b]", label: "BUSY" },
  idle: { variant: "secondary", dot: "bg-[#ffb020]", label: "IDLE" },
  offline: { variant: "outline", dot: "bg-[#5c5c66]", label: "OFFLINE" },
};

export function StatusBadge({
  status,
  className,
}: {
  status: AgentStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <Badge variant={meta.variant} className={cn("gap-1.5", className)}>
      <span
        className={cn("size-2 inline-block", meta.dot, status === "busy" && "animate-pulse")}
        aria-hidden="true"
      />
      <span className="font-pixel text-[9px] tracking-wider">{meta.label}</span>
    </Badge>
  );
}
