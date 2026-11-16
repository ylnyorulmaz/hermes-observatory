import { buildSnapshot } from '../server/snapshot.mjs';

const snap = buildSnapshot();
console.log('source:', snap.source);
console.log('totals:', JSON.stringify(snap.totals));
console.log('kanban.counts:', JSON.stringify(snap.kanban.counts));
console.log('delegations:', snap.delegations.length);
console.log('--- agents ---');
for (const a of snap.agents) {
  console.log(
    JSON.stringify({
      id: a.id,
      label: a.label,
      status: a.status,
      current: a.current
        ? { kind: a.current.kind, tool: a.current.tool, elapsed_s: a.current.elapsed_s }
        : null,
      session: a.session
        ? { title: a.session.title, model: a.session.model, tok_in: a.session.tokens_in }
        : null,
      tickets: a.tickets,
      recent: a.recent.length,
    }),
  );
}
