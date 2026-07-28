import { Suspense } from "react";
import { LeadsTable } from "@/components/leads/leads-table";
import { RequireCapability } from "@/components/layout/require-capability";

export default function LeadIntelligencePage() {
  return (
    <RequireCapability needs="leads.intelligence" title="Lead Intelligence">
      <Suspense>
        <LeadsTable />
      </Suspense>
    </RequireCapability>
  );
}
