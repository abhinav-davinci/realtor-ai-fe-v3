import { MessagesSquare } from "lucide-react";
import { ComingSoon } from "@/components/leads/coming-soon";
import { RequireCapability } from "@/components/layout/require-capability";

export default function LeadsConversationsPage() {
  return (
    <RequireCapability needs="leads.intelligence" title="Conversations">
      <ComingSoon
        title="Conversations"
        description="Every call and chat across all your agents, in one unified log."
        icon={MessagesSquare}
      />
    </RequireCapability>
  );
}
