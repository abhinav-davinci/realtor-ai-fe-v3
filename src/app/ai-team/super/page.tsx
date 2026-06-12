import { Suspense } from "react";
import { AgentBuilder } from "@/components/ai-team/agent-builder";

/** The Super Agent (master) setup flow. The builder runs in super mode for the
 * "super" template: it learns from your specialists and your knowledge base. */
export default function SuperAgentPage() {
  return (
    <Suspense>
      <AgentBuilder templateId="super" />
    </Suspense>
  );
}
