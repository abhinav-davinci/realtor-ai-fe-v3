import { AppShell } from "@/components/layout/app-shell";
import { AiTeamSidebar } from "@/components/layout/ai-team-sidebar";

/**
 * Shared shell for every AI Team route. Keeping the rail, top bar, and sidebar
 * in a layout means they stay mounted as you move between Launch AI Agents,
 * My Agents, and Knowledge Base, so only the page content swaps (no shell
 * re-mount, no flash).
 */
export default function AiTeamLayout({ children }: { children: React.ReactNode }) {
  return <AppShell sidebar={<AiTeamSidebar />}>{children}</AppShell>;
}
