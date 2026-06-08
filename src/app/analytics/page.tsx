import { AppShell } from "@/components/layout/app-shell";
import { Analytics } from "@/components/content/analytics";
import { serverVideos, serverDashboard } from "@/lib/server-api";

export default async function AnalyticsPage() {
  const [vids, stats] = await Promise.all([serverVideos(12), serverDashboard("7d")]);
  return (
    <AppShell>
      <Analytics initialVids={vids} initialStats={stats} />
    </AppShell>
  );
}
