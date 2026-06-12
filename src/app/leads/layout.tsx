import { AppShell } from "@/components/layout/app-shell";
import { LeadsSidebar } from "@/components/layout/leads-sidebar";

/**
 * Shared shell for every Leads route, so the rail, top bar, and Leads sidebar
 * stay mounted as you move between Lead Intelligence and its (upcoming) CRM
 * siblings; only the page content swaps.
 */
export default function LeadsLayout({ children }: { children: React.ReactNode }) {
  return <AppShell sidebar={<LeadsSidebar />}>{children}</AppShell>;
}
