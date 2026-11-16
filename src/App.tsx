// src/App.tsx — shell: header, CRT frame, agent stage, activity ticker.
import { useEffect, useState, type ReactElement } from 'react';
import { useSnapshot } from './lib/api';
import { AgentStage } from './components/AgentStage';
import { ActivityTicker } from './components/ActivityTicker';
import { Skeleton } from './components/ui/skeleton';
import { cn } from './lib/cn';

function Clock(): ReactElement {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-pixel tabular-nums text-sm text-[#f2f2f2]">{now.toLocaleTimeString('tr-TR')}</span>;
}

export default function App(): ReactElement {
  const { snapshot, stale } = useSnapshot(2000);

  return (
    <div className="crt-frame min-h-screen w-full">
      <div className="crt-vignette pointer-events-none fixed inset-0 z-40" aria-hidden="true" />
      <div className="crt-scanlines pointer-events-none fixed inset-0 z-50" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 py-6">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-pixel text-2xl leading-tight text-[#38d9d9]">
              HERMES OBSERVATORY
            </h1>
            <p className="mono mt-1 text-[11px] text-[#71717a]">8-bit agent arcade · v2</p>
          </div>
          <div className="flex items-center gap-6">
            {snapshot ? (
              <div className="font-pixel text-sm">
                <span className="text-[#4ade80]">{snapshot.totals.agents_busy} BUSY</span>
                <span className="text-[#71717a]"> / </span>
                <span className="text-[#fbbf24]">{snapshot.totals.agents_idle} IDLE</span>
              </div>
            ) : null}
            {snapshot ? (
              <span
                className={cn(
                  'pixel-badge px-2 py-0.5 font-pixel text-[10px] uppercase',
                  snapshot.source === 'live'
                    ? 'bg-[#1f3a2a] text-[#4ade80]'
                    : 'bg-[#3a2f1f] text-[#fbbf24]',
                )}
              >
                {snapshot.source}
              </span>
            ) : null}
            <Clock />
          </div>
        </header>

        {stale ? (
          <div className="pixel-panel mb-4 px-4 py-2 font-pixel text-sm text-[#ff5a5a]">
            ⚠ BAĞLANTI YOK — son snapshot gösteriliyor
          </div>
        ) : null}

        {!snapshot ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="pixel-panel flex flex-col items-center gap-3 p-4">
                <Skeleton className="h-28 w-28" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <section className="mb-5">
              <h2 className="mb-3 font-pixel text-sm uppercase tracking-wider text-[#a1a1aa]">
                Agent Stage
              </h2>
              <AgentStage agents={snapshot.agents} />
            </section>
            <section>
              <ActivityTicker snapshot={snapshot} />
            </section>
          </>
        )}
      </div>
    </div>
  );
}
