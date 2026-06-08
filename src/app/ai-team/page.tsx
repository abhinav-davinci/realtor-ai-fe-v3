import { AppShell } from "@/components/layout/app-shell";
import { AiTeamSidebar } from "@/components/layout/ai-team-sidebar";
import { LaunchAgents } from "@/components/ai-team/launch-agents";

export default function AiTeamPage() {
  return (
    <AppShell sidebar={<AiTeamSidebar />}>
      <LaunchAgents />
    </AppShell>
  );
}
