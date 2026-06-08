import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AiTeamSidebar } from "@/components/layout/ai-team-sidebar";
import { AgentDetail } from "@/components/ai-team/agent-detail";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell sidebar={<AiTeamSidebar />}>
      <Suspense>
        <AgentDetail id={id} />
      </Suspense>
    </AppShell>
  );
}
