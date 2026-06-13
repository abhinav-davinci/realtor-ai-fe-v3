import { Suspense } from "react";
import { LeadsTable } from "@/components/leads/leads-table";

export default function AllLeadsPage() {
  return (
    <Suspense>
      <LeadsTable />
    </Suspense>
  );
}
