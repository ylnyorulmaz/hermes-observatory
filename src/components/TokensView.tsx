import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/8bit/chart";
import ManaBar from "@/components/ui/8bit/mana-bar";
import type { Agent, Totals } from "@/lib/types";
import { fmtTokens, fmtCost } from "@/lib/format";

const chartConfig = {
  in: { label: "tokens in", color: "var(--chart-1)" },
  out: { label: "tokens out", color: "var(--chart-2)" },
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="pixel-border bg-card p-2 text-center">
      <div className="text-[12px] text-primary">{value}</div>
      <div className="text-[7px] text-muted-foreground">{label}</div>
    </div>
  );
}

export function TokensView({ agents, totals }: { agents: Agent[]; totals: Totals }) {
  const data = agents.map((a) => ({
    name: a.label,
    in: a.session?.tokens_in ?? 0,
    out: a.session?.tokens_out ?? 0,
  }));

  return (
    <div className="space-y-4 p-4">
      {/* totals */}
      <div className="grid grid-cols-3 gap-2">
        <Stat label="TOKENS TODAY" value={fmtTokens(totals.tokens_today)} />
        <Stat label="COST TODAY" value={fmtCost(totals.cost_today_usd)} />
        <Stat label="ACTIVE SESSIONS" value={String(totals.active_sessions)} />
      </div>

      {/* chart */}
      <div className="pixel-border bg-card p-3">
        <div className="mb-2 text-[9px] text-foreground">TOKEN AKIŞI</div>
        <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
          <BarChart data={data} margin={{ top: 8, left: 8, right: 8, bottom: 8 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 8 }}
              interval={0}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 8 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="in" fill="var(--color-in)" radius={0} />
            <Bar dataKey="out" fill="var(--color-out)" radius={0} />
          </BarChart>
        </ChartContainer>
      </div>

      {/* mana bars */}
      <div className="pixel-border bg-card p-3">
        <div className="mb-2 text-[9px] text-foreground">MANA BARS (token kullanımı)</div>
        <div className="space-y-3">
          {agents.map((a) => {
            const tokens = (a.session?.tokens_in ?? 0) + (a.session?.tokens_out ?? 0);
            const pct = Math.min(100, Math.round(tokens / 2000));
            return (
              <div key={a.id} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-[8px] text-foreground">{a.label}</span>
                <div className="flex-1">
                  <ManaBar value={pct} variant="retro" />
                </div>
                <span className="w-16 shrink-0 text-right font-mono text-[8px] text-muted-foreground">
                  {fmtTokens(tokens)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
