import { Suspense } from "react";
import { LeadsTable } from "@/components/leads/leads-table";

// A User's calling list. Same list component as Lead Intelligence, which scopes
// itself to the viewer, so a User only ever sees the leads assigned to them.
export default function MyCallsPage() {
  return (
    <Suspense>
      <LeadsTable />
    </Suspense>
  );
}
