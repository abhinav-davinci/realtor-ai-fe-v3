import { LeadDistributionView } from "@/components/leads/lead-distribution-view";
import { RequireCapability } from "@/components/layout/require-capability";

export default function LeadDistributionPage() {
  return (
    <RequireCapability needs="leads.distribute" title="Lead Distribution">
      <LeadDistributionView />
    </RequireCapability>
  );
}
