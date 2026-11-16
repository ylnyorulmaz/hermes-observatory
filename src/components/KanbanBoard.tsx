import type { KanbanSummary } from "@/lib/types";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/8bit/table";
import { Badge } from "@/components/ui/8bit/badge";
import { Empty } from "@/components/ui/8bit/empty";
import { Skeleton } from "@/components/ui/8bit/skeleton";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  done: "border-primary bg-primary text-primary-foreground",
  running: "border-secondary bg-secondary text-secondary-foreground",
  "in-progress": "border-secondary bg-secondary text-secondary-foreground",
  review: "border-[#f6a821] bg-[#f6a821] text-black",
  blocked: "border-destructive bg-destructive text-destructive-foreground",
  ready: "border-border bg-background text-foreground",
  todo: "border-border bg-background text-muted-foreground",
};

function StatusPill({ status }: { status: string }) {
  return (
    <Badge className={cn("px-1.5 py-0.5 text-[7px]", STATUS_STYLE[status] ?? STATUS_STYLE.todo)}>
      {status}
    </Badge>
  );
}

export function KanbanBoard({
  kanban,
  loading,
}: {
  kanban?: KanbanSummary;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!kanban || kanban.tasks.length === 0) {
    return (
      <Empty className="py-16">
        <div className="text-[10px] text-foreground">BOARD BOŞ</div>
        <div className="text-[8px] text-muted-foreground">kanban.db üzerinde görev yok</div>
      </Empty>
    );
  }

  const counts = kanban.counts;
  const statCells: [string, number][] = [
    ["TODO", counts.todo],
    ["ASSIGNED", counts.assigned],
    ["IN-PROG", counts["in-progress"]],
    ["REVIEW", counts.review],
    ["DONE", counts.done],
    ["BLOCKED", counts.blocked],
  ];

  return (
    <div className="space-y-3 p-4">
      {/* counts */}
      <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
        {statCells.map(([label, n]) => (
          <div
            key={label}
            className="pixel-border bg-card p-2 text-center"
          >
            <div className="text-[12px] text-primary">{n}</div>
            <div className="text-[7px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* table */}
      <div className="overflow-x-auto">
        <Table className="w-full min-w-[640px]">
          <TableHeader>
            <TableRow>
              <TableHead className="text-[8px]">ID</TableHead>
              <TableHead className="text-[8px]">TITLE</TableHead>
              <TableHead className="text-[8px]">STATUS</TableHead>
              <TableHead className="text-[8px]">ASSIGNEE</TableHead>
              <TableHead className="text-[8px]">PRIO</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {kanban.tasks.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-[8px] text-muted-foreground">
                  {t.id.slice(0, 12)}
                </TableCell>
                <TableCell className="max-w-[320px] truncate text-[8px]">{t.title}</TableCell>
                <TableCell>
                  <StatusPill status={t.status} />
                </TableCell>
                <TableCell className="text-[8px] text-muted-foreground">{t.assignee}</TableCell>
                <TableCell className="text-[8px] text-muted-foreground">{t.priority}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
