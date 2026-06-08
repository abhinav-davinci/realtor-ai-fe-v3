import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AiTeamSidebar } from "@/components/layout/ai-team-sidebar";
import { AgentBuilder } from "@/components/ai-team/agent-builder";

export default async function BuildAgentPage({
  params,
}: {
  params: Promise<{ template: string }>;
}) {
  const { template } = await params;
  return (
    <AppShell sidebar={<AiTeamSidebar />}>
      <Suspense>
        <AgentBuilder templateId={template} />
      </Suspense>
    </AppShell>
  );
}
