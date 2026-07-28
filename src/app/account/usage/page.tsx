import { CreditCard } from "lucide-react";
import { ComingSoon } from "@/components/leads/coming-soon";
import { RequireCapability } from "@/components/layout/require-capability";

export default function CreditUsagePage() {
  return (
    <RequireCapability needs="billing.view" title="Credit & Usage">
      <ComingSoon
        title="Credit & Usage"
        description="See where your calling and content credits go, and top up before you run out."
        icon={CreditCard}
        eyebrow="Part of your account"
        backHref="/account/users"
        backLabel="Go to User Management"
      />
    </RequireCapability>
  );
}
