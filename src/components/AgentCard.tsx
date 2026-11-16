import { useEffect, useState } from "react";
import type { Agent } from "@/lib/types";
import { PixSprite } from "@/sprites/PixSprite";
import { AGENT_FRAMES, type SpriteAgent } from "@/sprites/frames";
import { Card, CardContent } from "@/components/ui/8bit/card";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/8bit/hover-card";
import HealthBar from "@/components/ui/8bit/health-bar";
import { StatusBadge } from "./StatusBadge";
import { useIdleLine, useNow } from "@/lib/hooks";
import { timeAgo, fmtTokens, fmtCost, fmtDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

function useSpriteFrame(busy: boolean, reducedMotion: boolean): number {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    setFrameIndex(0);
    if (reducedMotion) return;

    const interval = window.setInterval(
      () => setFrameIndex((current) => current + 1),
      busy ? 140 : 600
    );
    return () => window.clearInterval(interval);
  }, [busy, reducedMotion]);

  return frameIndex;
}

function usagePercent(agent: Agent): number {
  if (!agent.session) return 0;
  const used = agent.session.tokens_in + agent.session.tokens_out;
  return Math.min(100, Math.round((used / 200_000) * 100));
}

export function AgentCard({ agent }: { agent: Agent }) {
  const now = useNow(1000);
  const reducedMotion = usePrefersReducedMotion();
  const busy = agent.status === "busy";
  const idleLine = useIdleLine(agent.id, agent.status === "idle");
  const frameIndex = useSpriteFrame(busy, reducedMotion);
  const frameCount = AGENT_FRAMES[agent.id as SpriteAgent][busy ? "busy" : "idle"].length;
  const currentTool = agent.current?.tool ?? agent.current?.kind;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className={cn("block", busy && "active:translate-y-0.5")}>
          <Card className="h-full">
            <CardContent className="flex h-full flex-col items-center gap-2 p-3">
              <div className="relative flex h-[124px] w-[124px] items-center justify-center">
                {busy && (
                  <span className="absolute right-1 top-0 z-20 text-[12px] text-primary">
                    !
                  </span>
                )}

                <div
                  className={cn(
                    "relative flex size-[112px] items-center justify-center",
                    busy && "glow-ring"
                  )}
                >
                  <PixSprite
                    agent={agent.id as SpriteAgent}
                    state={busy ? "busy" : "idle"}
                    size={104}
                    frameIndex={frameIndex % frameCount}
                    className="pixelated"
                  />
                </div>

                {idleLine ? (
                  <div className="pixel-bubble absolute -top-1 left-1/2 z-20 w-max max-w-[150px] -translate-x-1/2 -translate-y-full px-2 py-1 text-center text-[7px]">
                    {idleLine}
                  </div>
                ) : null}
              </div>

              <div className="flex w-full flex-col items-center gap-1">
                <div className="font-pixel text-[8px] uppercase text-foreground">
                  {agent.label}
                </div>
                <StatusBadge status={agent.status} />
              </div>

              <div className="w-full">
                <HealthBar value={usagePercent(agent)} variant="retro" />
              </div>

              <div className="h-4 w-full truncate text-center font-mono text-[9px]">
                {busy && currentTool ? (
                  <span className="text-primary">{currentTool}</span>
                ) : (
                  <span className="text-muted-foreground">beklemede</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </HoverCardTrigger>

      <HoverCardContent align="start" sideOffset={6} className="w-[360px] p-0">
        <div className="p-3 text-[8px] leading-relaxed">
          <div className="mb-2 flex items-center justify-between border-b-2 border-foreground pb-1">
            <span className="text-[10px] text-foreground">{agent.label}</span>
            <StatusBadge status={agent.status} />
          </div>

          <div className="mb-2">
            <span className="text-muted-foreground">AKTİF:</span>{" "}
            {agent.current ? (
              <span className="text-primary">{currentTool}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
            {agent.current?.detail ? (
              <div className="mt-0.5 break-words text-muted-foreground">
                {agent.current.detail}
              </div>
            ) : null}
            {agent.current ? (
              <div className="text-muted-foreground/70">
                süre: {fmtDuration(now / 1000 - agent.current.since)} ·{" "}
                {timeAgo(agent.current.since)} önce
              </div>
            ) : null}
          </div>

          {agent.session ? (
            <div className="mt-2 space-y-0.5">
              <div className="text-foreground">{agent.session.title}</div>
              <div className="text-muted-foreground">
                {agent.session.model} · {agent.session.provider}
              </div>
              <div className="text-muted-foreground">
                in {fmtTokens(agent.session.tokens_in)} / out{" "}
                {fmtTokens(agent.session.tokens_out)} ·{" "}
                {fmtCost(agent.session.cost_usd)}
              </div>
              <div className="text-muted-foreground/70">
                {agent.session.messages} msg · {agent.session.tool_calls} tool ·{" "}
                {timeAgo(agent.session.started_at)} önce
              </div>
            </div>
          ) : (
            <div className="mt-2 text-muted-foreground">aktif oturum yok</div>
          )}

          {agent.tickets.assigned > 0 || agent.tickets.in_progress > 0 ? (
            <div className="mt-2 border-t-2 border-foreground pt-1">
              <span className="text-muted-foreground">TICKET:</span>{" "}
              <span className="text-foreground">
                {agent.tickets.in_progress} sürüyor / {agent.tickets.assigned} atanmış
              </span>
              {agent.tickets.titles.slice(0, 2).map((title) => (
                <div key={title} className="truncate text-muted-foreground/80">
                  • {title}
                </div>
              ))}
            </div>
          ) : null}

          {agent.recent.length > 0 ? (
            <div className="mt-2 border-t-2 border-foreground pt-1">
              <div className="mb-0.5 text-muted-foreground">SON 5 TOOL:</div>
              {agent.recent.slice(0, 5).map((call, index) => (
                <div
                  key={`${call.ts}-${index}`}
                  className="flex gap-1 text-muted-foreground/80"
                >
                  <span className="shrink-0 text-muted-foreground/60">
                    {timeAgo(call.ts)}
                  </span>
                  <span className="text-primary">{call.tool}</span>
                  <span className="truncate">{call.text}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
