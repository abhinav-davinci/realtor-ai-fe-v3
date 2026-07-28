import { AppShell } from "@/components/layout/app-shell";
import { AccountBar } from "@/components/account/account-bar";

/**
 * Shared shell for the account pages reached from the top-bar menu. These sit
 * outside every rail section, so they run full width with no secondary sidebar
 * and carry their own context bar (workspace, your role, plan seats).
 */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell sidebar={null}>
      <div className="flex h-full flex-col">
        <AccountBar />
        {/* Marked so a page can save and restore this scroll position when it
            swaps in a sub-view (see the Removed Members drill-in). */}
        <div data-account-scroll className="min-h-0 flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </AppShell>
  );
}
