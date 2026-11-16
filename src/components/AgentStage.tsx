import type { Agent } from "@/lib/types";
import { AgentCard } from "./AgentCard";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/8bit/empty";

export function AgentStage({ agents }: { agents: Agent[] }) {
  if (agents.length === 0) {
    return (
      <Empty className="border-4 border-dashed border-border">
        <EmptyHeader>
          <EmptyTitle>AJAN YOK</EmptyTitle>
          <EmptyDescription>
            Hermes oturumu bulunamadı. Snapshot geldiğinde ajanlar burada görünecek.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
}
