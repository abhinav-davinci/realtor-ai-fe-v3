import { AppShell } from "@/components/layout/app-shell";
import { SettingsSidebar } from "@/components/layout/settings-sidebar";
import { PlanStrip } from "@/components/account/account-bar";

/**
 * Shared shell for the account pages, reached from the rail's Settings item or
 * the top-bar account menu. The Settings sidebar carries the workspace name and
 * your role, so all that is left up here is where the plan stands.
 */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell sidebar={<SettingsSidebar />}>
      <div className="flex h-full flex-col">
        <PlanStrip />
        {/* Marked so a page can save and restore this scroll position when it
            swaps in a sub-view (see the Removed Members drill-in). */}
        <div data-account-scroll className="min-h-0 flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </AppShell>
  );
}
