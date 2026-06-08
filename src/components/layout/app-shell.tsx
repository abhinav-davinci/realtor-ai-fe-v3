import { IconRail } from "./icon-rail";
import { ContentStudioSidebar } from "./content-studio-sidebar";
import { TopBar } from "./top-bar";
import { AuthGate } from "@/components/auth/auth-gate";

export function AppShell({
  children,
  sidebar,
}: {
  children: React.ReactNode;
  /** Override the secondary sidebar (defaults to the Content Studio menu). */
  sidebar?: React.ReactNode;
}) {
  return (
    <AuthGate>
      <div className="bg-cream text-ink flex h-screen w-full overflow-hidden">
        <IconRail />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <div className="flex min-h-0 flex-1">
            {sidebar ?? <ContentStudioSidebar />}
            <main className="min-w-0 flex-1 overflow-hidden bg-white">{children}</main>
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
