import { Suspense } from "react";
import { LeadsTable } from "@/components/leads/leads-table";

export default function LeadIntelligencePage() {
  return (
    <Suspense>
      <LeadsTable />
    </Suspense>
  );
}
