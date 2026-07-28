import { Suspense } from "react";
import { LeadIntelligence } from "@/components/leads/lead-intelligence";
import { RequireCapability } from "@/components/layout/require-capability";

export default function LeadsOverviewPage() {
  return (
    <RequireCapability needs="leads.intelligence" title="Overview">
      <Suspense>
        <LeadIntelligence />
      </Suspense>
    </RequireCapability>
  );
}
