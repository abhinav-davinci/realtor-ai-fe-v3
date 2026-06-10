import { Suspense } from "react";
import { AgentDetail } from "@/components/ai-team/agent-detail";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense>
      <AgentDetail id={id} />
    </Suspense>
  );
}
