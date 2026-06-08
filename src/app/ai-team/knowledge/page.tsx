import { AppShell } from "@/components/layout/app-shell";
import { AiTeamSidebar } from "@/components/layout/ai-team-sidebar";
import { KnowledgeBase } from "@/components/ai-team/knowledge-base";

export default function KnowledgeBasePage() {
  return (
    <AppShell sidebar={<AiTeamSidebar />}>
      <KnowledgeBase />
    </AppShell>
  );
}
