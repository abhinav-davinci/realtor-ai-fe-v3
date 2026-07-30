import { KanbanBoard } from "@/components/leads/kanban/kanban-board";

// The rep's pipeline board. Scoped to the viewer by the component, so an admin
// opening it sees the whole org's leads and a User sees only their own.
export default function BoardPage() {
  return <KanbanBoard />;
}
