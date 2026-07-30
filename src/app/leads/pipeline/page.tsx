import { KanbanBoard } from "@/components/leads/kanban/kanban-board";
import { RequireCapability } from "@/components/layout/require-capability";

// The admin's way into the same board the reps work on. One component, scoped by
// capability: here it shows every lead with the owner named on each card.
export default function SalesPipelinePage() {
  return (
    <RequireCapability needs="leads.intelligence" title="Sales Pipeline">
      <KanbanBoard />
    </RequireCapability>
  );
}
