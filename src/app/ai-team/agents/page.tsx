import { AppShell } from "@/components/layout/app-shell";
import { AiTeamSidebar } from "@/components/layout/ai-team-sidebar";
import { AgentsList } from "@/components/ai-team/agents-list";

export default function MyAgentsPage() {
  return (
    <AppShell sidebar={<AiTeamSidebar />}>
      <AgentsList />
    </AppShell>
  );
}
