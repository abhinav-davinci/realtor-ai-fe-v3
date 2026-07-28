import { CreditCard } from "lucide-react";
import { ComingSoon } from "@/components/leads/coming-soon";

export default function CreditUsagePage() {
  return (
    <ComingSoon
      title="Credit & Usage"
      description="See where your calling and content credits go, and top up before you run out."
      icon={CreditCard}
      eyebrow="Part of your account"
      backHref="/account/users"
      backLabel="Go to User Management"
    />
  );
}
