import { Suspense } from "react";
import { LeadIntelligence } from "@/components/leads/lead-intelligence";

export default function LeadsPage() {
  return (
    <Suspense>
      <LeadIntelligence />
    </Suspense>
  );
}
