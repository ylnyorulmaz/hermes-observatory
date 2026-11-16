import { useEffect, useState } from "react";

/** Ticking clock (ms epoch) — re-renders on the given interval. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

const IDLE_LINES = [
  "görev bekliyorum",
  "kahvem soğudu",
  "board temiz",
  "menzil dışı",
];

/** Deterministic, per-agent idle line, rotating every ~7s while idle. */
export function useIdleLine(agentId: string, isIdle: boolean): string | null {
  const now = useNow(1000);
  if (!isIdle) return null;
  const slot = Math.floor(now / 7000);
  const offset = (agentId.length * 7) % IDLE_LINES.length;
  return IDLE_LINES[(slot + offset) % IDLE_LINES.length];
}
