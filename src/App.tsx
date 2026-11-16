import { useState } from "react";
import { AgentStage } from "@/components/AgentStage";
import { ActivityTicker } from "@/components/ActivityTicker";
import { KanbanBoard } from "@/components/KanbanBoard";
import { TokensView } from "@/components/TokensView";
import { DelegationsView } from "@/components/DelegationsView";
import { LogsView } from "@/components/LogsView";
import { RetroModeSwitcher } from "@/components/ui/retro-mode-switcher";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/8bit/tabs";
import { Skeleton } from "@/components/ui/8bit/skeleton";
import { buildFallbackSnapshot } from "@/lib/mock";
import { useSnapshot } from "@/lib/api";
import { clock } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const NAV = [
  { value: "stage", label: "STAGE" },
  { value: "kanban", label: "KANBAN" },
  { value: "tokens", label: "TOKENS" },
  { value: "delegations", label: "DELEGATIONS" },
  { value: "logs", label: "LOGS" },
] as const;

function LoadingStage() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="pixel-border bg-card p-3">
            <Skeleton className="mx-auto h-[112px] w-[112px]" />
            <Skeleton className="mx-auto mt-3 h-3 w-20" />
            <Skeleton className="mx-auto mt-2 h-3 w-14" />
            <Skeleton className="mt-3 h-2 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-8 w-full" />
    </div>
  );
}

export default function App() {
  const query = useSnapshot();
  const snapshot = query.data ?? (query.isError ? buildFallbackSnapshot() : null);
  const now = useNow(1000);
  const [tab, setTab] = useState<string>("stage");

  const busy = snapshot?.totals.agents_busy ?? 0;
  const idle = snapshot?.totals.agents_idle ?? 0;
  const live = Boolean(query.data) && !query.isError;
  const failed = query.isError;
  const sourceLabel = failed ? "FALLBACK" : live ? "LIVE" : "SYNC";

  return (
    <div className="crt-frame min-h-screen overflow-x-hidden text-foreground">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 px-4 py-5">
        <header className="pixel-border flex flex-col gap-3 bg-card px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[14px] text-primary md:text-[18px]">
              HERMES OBSERVATORY
            </span>
            <span className="hidden text-[7px] text-muted-foreground md:inline">
              v2.0 // AGENT ARCADE
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[8px]">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className={cn(
                  "inline-block size-2",
                  failed
                    ? "bg-destructive"
                    : live
                      ? "bg-[#7dff6b]"
                      : "bg-muted-foreground",
                  live && "animate-pulse"
                )}
                aria-hidden="true"
              />
              <span className={failed ? "text-destructive" : "text-primary"}>
                {busy} BUSY
              </span>{" "}
              / {idle} IDLE
            </span>
            <span className="font-mono text-[11px] text-foreground blinking-cursor">
              {clock(new Date(now))}
            </span>
            <span
              className={cn(
                "border-2 px-1.5 py-0.5 text-[7px]",
                failed
                  ? "border-destructive text-destructive"
                  : live
                    ? "border-primary text-primary"
                    : "border-border text-muted-foreground"
              )}
            >
              SRC: {sourceLabel}
            </span>
            <RetroModeSwitcher />
          </div>
        </header>

        {failed ? (
          <div className="pixel-border border-destructive bg-destructive/10 px-3 py-2 text-center font-pixel text-[10px] tracking-wider text-destructive">
            BAGLANTI YOK — son iyi snapshot korunuyor
          </div>
        ) : null}

        {snapshot ? (
          <Tabs value={tab} onValueChange={setTab} className="gap-4">
            <TabsList className="max-w-full overflow-x-auto">
              {NAV.map((item) => (
                <TabsTrigger key={item.value} value={item.value} className="text-[8px]">
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="stage" className="space-y-4">
              <AgentStage agents={snapshot.agents} />
              <ActivityTicker agents={snapshot.agents} />
            </TabsContent>

            <TabsContent value="kanban">
              <KanbanBoard kanban={snapshot.kanban} />
            </TabsContent>

            <TabsContent value="tokens">
              <TokensView agents={snapshot.agents} totals={snapshot.totals} />
            </TabsContent>

            <TabsContent value="delegations">
              <DelegationsView delegations={snapshot.delegations} />
            </TabsContent>

            <TabsContent value="logs">
              <LogsView agents={snapshot.agents} />
            </TabsContent>
          </Tabs>
        ) : (
          <LoadingStage />
        )}
      </div>
    </div>
  );
}
