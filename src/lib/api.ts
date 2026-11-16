import { useQuery } from "@tanstack/react-query";
import type { Snapshot } from "./types";

export async function fetchSnapshot(): Promise<Snapshot> {
  const res = await fetch("/api/observatory/snapshot", {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`snapshot ${res.status}`);
  return (await res.json()) as Snapshot;
}

/**
 * 2s polling. On failure react-query retains the last good `data`, so the UI
 * keeps showing the previous snapshot instead of blanking out.
 */
export function useSnapshot() {
  return useQuery({
    queryKey: ["observatory", "snapshot"],
    queryFn: fetchSnapshot,
    refetchInterval: 2000,
    staleTime: 1900,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
  });
}
