// src/lib/mock.ts — typed fallback snapshot, used ONLY when the API is
// unreachable (UI labels it source:"fallback"). Exercises all three states so
// the stage (busy anim / idle bubble / offline) is demonstrable without a DB.
import type { Snapshot } from './types';

const now = Date.now() / 1000;

function agent(
  id: Snapshot['agents'][number]['id'],
  label: string,
  role: Snapshot['agents'][number]['role'],
  status: Snapshot['agents'][number]['status'],
  current: Snapshot['agents'][number]['current'],
  session: Snapshot['agents'][number]['session'],
  recent: Snapshot['agents'][number]['recent'] = [],
  tickets: Snapshot['agents'][number]['tickets'] = { assigned: 0, in_progress: 0, titles: [] },
): Snapshot['agents'][number] {
  return {
    id,
    label,
    role,
    status,
    current,
    session,
    today: { sessions: session ? 1 : 0, tokens_in: session?.tokens_in ?? 0, tokens_out: session?.tokens_out ?? 0, cost_usd: session?.cost_usd ?? 0 },
    recent,
    tickets,
  };
}

export const FALLBACK_SNAPSHOT: Snapshot = {
  generated_at: now,
  source: 'fallback',
  agents: [
    agent('default', 'Orchestrator', 'orchestrator', 'busy', {
      kind: 'tool', tool: 'terminal', detail: 'npm run build -- observatory v2', since: now - 12, elapsed_s: 12,
    }, {
      id: 's_demo_default', title: 'Observatory v2 rebuild', model: 'deepseek/deepseek-v4.1-flash', provider: 'deepseek',
      started_at: now - 3600, messages: 120, tool_calls: 34, tokens_in: 211263, tokens_out: 137043, cost_usd: 0.1164,
    }, [
      { ts: now - 12, tool: 'terminal', text: 'npm run build' },
      { ts: now - 90, tool: 'read_file', text: 'src/App.tsx' },
      { ts: now - 130, tool: 'write_file', text: 'src/sprites/frames.ts' },
    ]),
    agent('coder', 'Coder', 'coder', 'idle', null, {
      id: 's_demo_coder', title: 'Fatura analiz POC', model: 'poolside/laguna-s-2.1', provider: 'nous',
      started_at: now - 7200, messages: 88, tool_calls: 21, tokens_in: 24100, tokens_out: 9100, cost_usd: 0.0402,
    }),
    agent('qa', 'QA', 'qa', 'offline', null, null),
    agent('librarian', 'Librarian', 'librarian', 'idle', null, {
      id: 's_demo_lib', title: 'docs/architecture taraması', model: 'deepseek/deepseek-v4.1-flash', provider: 'openrouter',
      started_at: now - 5400, messages: 40, tool_calls: 9, tokens_in: 18300, tokens_out: 7200, cost_usd: 0.0182,
    }),
    agent('growth-hacker', 'Growth Hacker', 'growth-hacker', 'offline', null, null),
    agent('opencode-cli', 'OpenCode CLI', 'cli', 'busy', {
      kind: 'tool', tool: 'bash', detail: 'npx shadcn add @8bitcn/button', since: now - 3, elapsed_s: 3,
    }, {
      id: 's_demo_cli', title: 'obs-v2 P1 foundation', model: 'deepseek-v4.1-flash', provider: 'opencode',
      started_at: now - 600, messages: 55, tool_calls: 17, tokens_in: 54825, tokens_out: 31200, cost_usd: 0.0,
    }, [
      { ts: now - 3, tool: 'bash', text: 'npx shadcn add @8bitcn/button' },
      { ts: now - 28, tool: 'edit', text: 'components.json' },
    ], { assigned: 0, in_progress: 1, titles: ['Observatory v2 P1 — 8bitcn foundation'] }),
  ],
  kanban: {
    counts: { todo: 2, assigned: 1, 'in-progress': 3, review: 0, done: 18, blocked: 1 },
    tasks: [],
  },
  delegations: [],
  totals: {
    agents_busy: 2, agents_idle: 2, tokens_today: 408588, cost_today_usd: 0.1748, active_sessions: 4,
  },
};
