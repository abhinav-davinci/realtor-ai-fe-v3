import { Contact } from "lucide-react";
import { ComingSoon } from "@/components/leads/coming-soon";

export default function ContactsPage() {
  return (
    <ComingSoon
      title="Contacts"
      description="A single directory of every person your agents have captured, with their details and history in one place."
      icon={Contact}
    />
  );
}
