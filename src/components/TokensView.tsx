import React from 'react';
import { useTokenUsage } from '../api/hermes';
import { useUIStore } from '../store/ui';
import { 
  Zap, TrendingUp, DollarSign, 
  BarChart2, Download
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const TokensView: React.FC = () => {
  const { timeRange, setTimeRange } = useUIStore();
  const { data: tokenUsage } = useTokenUsage(undefined, timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : timeRange === '24h' ? 24 : 168);

  // Aggregate data by profile
  const profileUsage = React.useMemo(() => {
    if (!tokenUsage) return {};
    return tokenUsage.reduce((acc, usage) => {
      if (!acc[usage.profile]) {
        acc[usage.profile] = { prompt: 0, completion: 0, total: 0, cost: 0, requests: 0 };
      }
      acc[usage.profile].prompt += usage.promptTokens;
      acc[usage.profile].completion += usage.completionTokens;
      acc[usage.profile].total += usage.totalTokens;
      acc[usage.profile].cost += usage.cost;
      acc[usage.profile].requests += 1;
      return acc;
    }, {} as Record<string, { prompt: number; completion: number; total: number; cost: number; requests: number }>);
  }, [tokenUsage]);

  // Time series data for chart
  const chartData = React.useMemo(() => {
    if (!tokenUsage) return { labels: [], datasets: [] };
    
    // Group by hour
    const hourly = tokenUsage.reduce((acc, usage) => {
      const hour = new Date(usage.timestamp).toISOString().slice(0, 13) + ':00';
      if (!acc[hour]) {
        acc[hour] = { prompt: 0, completion: 0, total: 0, cost: 0 };
      }
      acc[hour].prompt += usage.promptTokens;
      acc[hour].completion += usage.completionTokens;
      acc[hour].total += usage.totalTokens;
      acc[hour].cost += usage.cost;
      return acc;
    }, {} as Record<string, { prompt: number; completion: number; total: number; cost: number }>);

    const sortedHours = Object.keys(hourly).sort();
    return {
      labels: sortedHours.map(h => new Date(h).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
      datasets: [
        {
          label: 'Prompt Tokens',
          data: sortedHours.map(h => hourly[h].prompt),
          borderColor: '#00d4aa',
          backgroundColor: 'rgba(0, 212, 170, 0.1)',
          fill: true,
          tension: 0.3,
        },
        {
          label: 'Completion Tokens',
          data: sortedHours.map(h => hourly[h].completion),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.3,
        },
      ],
    };
  }, [tokenUsage]);

  const totalTokens = tokenUsage?.reduce((sum, u) => sum + u.totalTokens, 0) || 0;
  const totalCost = tokenUsage?.reduce((sum, u) => sum + u.cost, 0) || 0;
  const totalRequests = tokenUsage?.length || 0;
  const avgTokensPerRequest = totalRequests > 0 ? Math.round(totalTokens / totalRequests) : 0;

  // Profile distribution for doughnut
  const profileLabels = Object.keys(profileUsage);
  const profileTotals = profileLabels.map(p => profileUsage[p].total);
  const profileColors = [
    'rgba(0, 212, 170, 0.8)',
    'rgba(59, 130, 246, 0.8)',
    'rgba(22, 163, 74, 0.8)',
    'rgba(249, 115, 22, 0.8)',
    'rgba(168, 85, 247, 0.8)',
  ];

  return (
    <div className="p-6 space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Token Usage</h1>
          <p className="text-text-dim mt-1">Monitor token consumption across all profiles</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={e => setTimeRange(e.target.value as any)}
            className="input max-w-[140px]"
          >
            <option value="1h">1 Hour</option>
            <option value="6h">6 Hours</option>
            <option value="24h">24 Hours</option>
            <option value="7d">7 Days</option>
          </select>
          <button className="btn btn-ghost">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 animate-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-dim text-sm">Total Tokens</p>
              <p className="text-3xl font-bold mono text-text mt-1">{totalTokens.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="card p-5 animate-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-dim text-sm">Total Cost</p>
              <p className="text-3xl font-bold mono text-text mt-1">${totalCost.toFixed(4)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-info" />
            </div>
          </div>
        </div>

        <div className="card p-5 animate-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-dim text-sm">Requests</p>
              <p className="text-3xl font-bold mono text-text mt-1">{totalRequests.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
          </div>
        </div>

        <div className="card p-5 animate-in" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-dim text-sm">Avg/Request</p>
              <p className="text-3xl font-bold mono text-text mt-1">{avgTokensPerRequest.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <BarChart2 className="w-6 h-6 text-warning" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Time Series */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-medium text-text mb-4">Token Usage Over Time</h3>
          <div className="h-80">
            {chartData.labels.length > 0 ? (
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: { mode: 'index', intersect: false },
                  plugins: {
                    legend: { position: 'top', labels: { color: '#a1a1aa', font: { family: 'Inter' } } },
                    tooltip: { backgroundColor: '#131316', titleColor: '#fafafa', bodyColor: '#a1a1aa', borderColor: '#2a2a2e', borderWidth: 1 },
                  },
                  scales: {
                    x: { grid: { color: '#2a2a2e' }, ticks: { color: '#71717a' } },
                    y: { grid: { color: '#2a2a2e' }, ticks: { color: '#71717a' }, beginAtZero: true },
                  },
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-text-dim">No data for selected range</div>
            )}
          </div>
        </div>

        {/* Profile Breakdown & Cost Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Profile Distribution */}
          <div className="card p-5">
            <h3 className="font-medium text-text mb-4">Tokens by Profile</h3>
            <div className="h-64">
              {profileLabels.length > 0 ? (
                <Doughnut
                  data={{
                    labels: profileLabels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
                    datasets: [{
                      data: profileTotals,
                      backgroundColor: profileColors.slice(0, profileLabels.length),
                      borderWidth: 0,
                      hoverOffset: 8,
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom', labels: { color: '#a1a1aa', font: { family: 'Inter', size: 11 }, padding: 16, usePointStyle: true, pointStyle: 'circle' } },
                      tooltip: { backgroundColor: '#131316', titleColor: '#fafafa', bodyColor: '#a1a1aa', borderColor: '#2a2a2e', borderWidth: 1 },
                    },
                    cutout: '60%',
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-text-dim">No profile data</div>
              )}
            </div>
          </div>

          {/* Cost by Profile */}
          <div className="card p-5">
            <h3 className="font-medium text-text mb-4">Cost by Profile</h3>
            <div className="space-y-3">
              {profileLabels.length > 0 ? (
                profileLabels.map((p, i) => {
                  const usage = profileUsage[p];
                  const pct = totalTokens > 0 ? (usage.total / totalTokens * 100).toFixed(1) : '0';
                  return (
                    <div key={p} className="card p-3 animate-in" style={{ animationDelay: `${i * 100}ms` }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: profileColors[i % profileColors.length] }}>
                            <Zap className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-text capitalize">{p}</p>
                            <p className="text-xs text-text-dim">{usage.requests} requests</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-text">${usage.cost.toFixed(6)}</p>
                          <p className="text-xs text-text-dim">{pct}% of tokens</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-text-dim py-8">No profile data</div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Requests */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-medium text-text mb-4">Recent Requests</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 text-left text-xs text-text-dim uppercase tracking-wide">
                  <th className="p-3">Time</th>
                  <th className="p-3">Profile</th>
                  <th className="p-3">Model</th>
                  <th className="p-3 mono">Prompt</th>
                  <th className="p-3 mono">Completion</th>
                  <th className="p-3 mono">Total</th>
                  <th className="p-3 mono">Cost</th>
                  <th className="p-3">Type</th>
                </tr>
              </thead>
              <tbody>
                {tokenUsage?.slice(-20).reverse().map((u, i) => (
                  <tr key={u.timestamp} className="border-b border-border/50 animate-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <td className="p-3 text-xs text-text-dim mono">{new Date(u.timestamp).toLocaleTimeString()}</td>
                    <td className="p-3"><span className="px-2 py-0.5 text-xs rounded bg-primary/10 text-primary capitalize">{u.profile}</span></td>
                    <td className="p-3 text-sm mono text-text-dim max-w-[150px] truncate">{u.model}</td>
                    <td className="p-3 mono text-text-dim">{u.promptTokens.toLocaleString()}</td>
                    <td className="p-3 mono text-text-dim">{u.completionTokens.toLocaleString()}</td>
                    <td className="p-3 mono text-text">{u.totalTokens.toLocaleString()}</td>
                    <td className="p-3 mono text-info">${u.cost.toFixed(6)}</td>
                    <td className="p-3"><span className="px-2 py-0.5 text-xs rounded bg-surface border border-border">{u.requestType}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokensView;