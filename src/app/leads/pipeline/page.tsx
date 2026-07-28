import { KanbanSquare } from "lucide-react";
import { ComingSoon } from "@/components/leads/coming-soon";
import { RequireCapability } from "@/components/layout/require-capability";

export default function SalesPipelinePage() {
  return (
    <RequireCapability needs="leads.intelligence" title="Sales Pipeline">
      <ComingSoon
        title="Sales Pipeline"
        description="Track every lead through your deal stages, from new enquiry to booking, on one board."
        icon={KanbanSquare}
      />
    </RequireCapability>
  );
}
