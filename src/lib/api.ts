// src/lib/api.ts — snapshot fetch + 2s polling with optimistic stale flag.
import { useEffect, useRef, useState } from 'react';
import type { Snapshot } from './types';
import { FALLBACK_SNAPSHOT } from './mock';

async function getSnapshot(signal?: AbortSignal): Promise<Snapshot> {
  const res = await fetch('/api/observatory/snapshot', { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Snapshot;
}

export function fallbackSnapshot(): Snapshot {
  return { ...FALLBACK_SNAPSHOT, source: 'fallback', generated_at: Date.now() / 1000 };
}

export interface SnapshotState {
  snapshot: Snapshot | null;
  stale: boolean;
  error: boolean;
}

export function useSnapshot(pollMs = 2000): SnapshotState {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;

    async function tick() {
      try {
        const snap = await getSnapshot();
        if (cancelled) return;
        setSnapshot(snap);
        setError(false);
      } catch {
        if (cancelled) return;
        setError(true);
        // keep last good snapshot; if none yet, show typed fallback so the UI never blanks
        setSnapshot((prev) => prev ?? fallbackSnapshot());
      }
    }

    tick();
    const id = setInterval(tick, pollMs);
    return () => {
      cancelled = true;
      mounted.current = false;
      clearInterval(id);
    };
  }, [pollMs]);

  // stale = last fetch failed (keep last good snapshot on screen)
  return { snapshot, stale: error, error };
}
