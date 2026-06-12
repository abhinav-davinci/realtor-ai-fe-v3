import { MessagesSquare } from "lucide-react";
import { ComingSoon } from "@/components/leads/coming-soon";

export default function LeadsConversationsPage() {
  return (
    <ComingSoon
      title="Conversations"
      description="Every call and chat across all your agents, in one unified log."
      icon={MessagesSquare}
    />
  );
}
