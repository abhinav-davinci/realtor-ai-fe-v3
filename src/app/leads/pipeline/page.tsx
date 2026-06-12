import { KanbanSquare } from "lucide-react";
import { ComingSoon } from "@/components/leads/coming-soon";

export default function SalesPipelinePage() {
  return (
    <ComingSoon
      title="Sales Pipeline"
      description="Track every lead through your deal stages, from new enquiry to booking, on one board."
      icon={KanbanSquare}
    />
  );
}
