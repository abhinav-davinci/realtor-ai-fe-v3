import { Suspense } from "react";
import { AgentBuilder } from "@/components/ai-team/agent-builder";

export default async function BuildAgentPage({
  params,
}: {
  params: Promise<{ template: string }>;
}) {
  const { template } = await params;
  return (
    <Suspense>
      <AgentBuilder templateId={template} />
    </Suspense>
  );
}
