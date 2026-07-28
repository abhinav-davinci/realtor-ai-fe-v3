import { IconRail } from "./icon-rail";
import { ContentStudioSidebar } from "./content-studio-sidebar";
import { TopBar } from "./top-bar";
import { ViewingAsBanner } from "./viewing-as-banner";
import { AuthGate } from "@/components/auth/auth-gate";

export function AppShell({
  children,
  sidebar,
}: {
  children: React.ReactNode;
  /** Override the secondary sidebar (defaults to the Content Studio menu).
   * Pass `null` for a full-width page with no secondary sidebar. */
  sidebar?: React.ReactNode;
}) {
  return (
    <AuthGate>
      <div className="bg-cream text-ink flex h-screen w-full flex-col overflow-hidden">
        <ViewingAsBanner />
        <div className="flex min-h-0 flex-1">
          <IconRail />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar />
            <div className="flex min-h-0 flex-1">
              {sidebar === undefined ? <ContentStudioSidebar /> : sidebar}
              <main className="min-w-0 flex-1 overflow-hidden bg-white">{children}</main>
            </div>
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
