// src/components/AgentCard.tsx — sprite + status + idle speech bubble + hover card.
import { useEffect, useState, type ReactElement } from 'react';
import type { Agent } from '../lib/types';
import { frameFor, BUSY_GLYPHS } from '../sprites/frames';
import { PixSprite } from '../sprites/PixSprite';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { StatusBadge } from './StatusBadge';
import { HoverCard } from './ui/hover-card';
import { Separator } from './ui/separator';
import { cn } from '../lib/cn';

const IDLE_LINES = ['görev bekliyorum', 'kahvem soğudu', 'board temiz', 'menzil dışı'];

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return String(n);
}

function LiveElapsed({ since }: { since: number }): ReactElement {
  const [now, setNow] = useState(() => Date.now() / 1000);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() / 1000), 1000);
    return () => clearInterval(id);
  }, []);
  const s = Math.max(0, Math.round(now - since));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return (
    <span className="font-pixel tabular-nums text-[#38d9d9]">
      {mm}:{String(ss).padStart(2, '0')}
    </span>
  );
}

function SpeechBubble({ line }: { line: string }): ReactElement {
  return (
    <div className="speech-bubble absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap px-2 py-1 text-[10px] text-[#e5e5e5]">
      {line}
    </div>
  );
}

function BusyGlyph({ glyph }: { glyph: string }): ReactElement {
  return (
    <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 font-pixel text-sm text-[#fbbf24]">
      {glyph}
    </div>
  );
}

function HealthBar({ agent }: { agent: Agent }): ReactElement {
  const used = (agent.session?.tokens_in ?? 0) + (agent.session?.tokens_out ?? 0);
  const pct = Math.min(100, Math.round((used / 200_000) * 100));
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-[9px] text-[#71717a]">
        <span>CTX</span>
        <span className="mono">{pct}%</span>
      </div>
      <div className="health-track h-2 w-full">
        <div className="health-fill h-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function HoverContent({ agent }: { agent: Agent }): ReactElement {
  return (
    <div className="flex flex-col gap-2 text-[11px] text-[#e5e5e5]">
      <div className="flex items-center justify-between gap-2">
        <span className="font-pixel text-xs">{agent.label}</span>
        <StatusBadge status={agent.status} />
      </div>

      <div>
        <div className="text-[9px] uppercase text-[#71717a]">şu an</div>
        {agent.current ? (
          <>
            <div className="font-pixel text-[#4ade80]">{agent.current.tool ?? agent.current.kind}</div>
            <div className="break-words text-[#a1a1aa]">{agent.current.detail}</div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-[#71717a]">elapsed</span>
              <LiveElapsed since={agent.current.since} />
            </div>
          </>
        ) : (
          <div className="text-[#71717a]">aktif aksiyon yok</div>
        )}
      </div>

      <Separator />

      {agent.session ? (
        <>
          <div className="truncate text-[#f2f2f2]" title={agent.session.title}>
            {agent.session.title}
          </div>
          <div className="mono truncate text-[#a1a1aa]">
            {agent.session.model} · {agent.session.provider}
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <div>
              <span className="text-[#71717a]">in</span>{' '}
              <span className="mono">{fmtTokens(agent.session.tokens_in)}</span>
            </div>
            <div>
              <span className="text-[#71717a]">out</span>{' '}
              <span className="mono">{fmtTokens(agent.session.tokens_out)}</span>
            </div>
            <div>
              <span className="text-[#71717a]">cost</span>{' '}
              <span className="mono">${agent.session.cost_usd.toFixed(4)}</span>
            </div>
            <div>
              <span className="text-[#71717a]">msgs</span>{' '}
              <span className="mono">{agent.session.messages}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="text-[#71717a]">session yok</div>
      )}

      <Separator />

      <div>
        <div className="text-[9px] uppercase text-[#71717a]">ticket</div>
        {agent.tickets.titles[0] ? (
          <div className="truncate text-[#fbbf24]">{agent.tickets.titles[0]}</div>
        ) : (
          <div className="text-[#71717a]">—</div>
        )}
      </div>

      <div>
        <div className="text-[9px] uppercase text-[#71717a]">son 5 tool call</div>
        {agent.recent.length === 0 ? (
          <div className="text-[#71717a]">—</div>
        ) : (
          <ul className="space-y-1">
            {agent.recent.slice(0, 5).map((r, i) => (
              <li key={i} className="mono flex gap-1 text-[10px]">
                <span className="shrink-0 text-[#38d9d9]">{r.tool}</span>
                <span className="truncate text-[#a1a1aa]">{r.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function AgentCard({ agent }: { agent: Agent }): ReactElement {
  const reduced = useReducedMotion();
  const { frames, intervalMs } = frameFor(agent.id, agent.status);
  const [frameIdx, setFrameIdx] = useState(0);
  const [glyphIdx, setGlyphIdx] = useState(0);
  const [bubbleIdx, setBubbleIdx] = useState(() => hashId(agent.id) % IDLE_LINES.length);

  useEffect(() => {
    if (reduced || intervalMs === 0 || frames.length <= 1) return;
    const id = setInterval(() => setFrameIdx((i) => (i + 1) % frames.length), intervalMs);
    return () => clearInterval(id);
  }, [reduced, intervalMs, frames.length]);

  useEffect(() => {
    if (reduced || agent.status !== 'busy') return;
    const id = setInterval(() => setGlyphIdx((i) => (i + 1) % BUSY_GLYPHS.length), 350);
    return () => clearInterval(id);
  }, [reduced, agent.status]);

  useEffect(() => {
    if (reduced || agent.status !== 'idle') return;
    const id = setInterval(() => setBubbleIdx((i) => (i + 1) % IDLE_LINES.length), 7000);
    return () => clearInterval(id);
  }, [reduced, agent.status]);

  const frame = frames[frameIdx % frames.length];
  const busy = agent.status === 'busy';
  const idle = agent.status === 'idle';

  const trigger = (
    <div
      className={cn(
        'agent-tile pixel-panel flex w-full cursor-default flex-col items-center gap-2 p-4 transition-none',
        busy && 'agent-glow',
      )}
    >
      <div className="relative flex items-end justify-center">
        {busy && <BusyGlyph glyph={BUSY_GLYPHS[glyphIdx % BUSY_GLYPHS.length]} />}
        {idle && <SpeechBubble line={IDLE_LINES[bubbleIdx % IDLE_LINES.length]} />}
        <PixSprite frame={frame} size={112} />
      </div>

      <div className="font-pixel text-sm text-[#f2f2f2]">{agent.label}</div>
      <StatusBadge status={agent.status} />

      {busy && agent.current?.tool ? (
        <div className="mono truncate text-[10px] text-[#4ade80]">{agent.current.tool}</div>
      ) : (
        <div className="mono truncate text-[10px] text-[#3a3a3a]">
          {idle ? '— beklemede —' : '— kapalı —'}
        </div>
      )}

      <HealthBar agent={agent} />
    </div>
  );

  return (
    <HoverCard side="top" className="w-[300px]" trigger={trigger}>
      <HoverContent agent={agent} />
    </HoverCard>
  );
}
