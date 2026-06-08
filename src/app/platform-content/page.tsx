import { AppShell } from "@/components/layout/app-shell";
import { PlatformContent } from "@/components/content/platform-content";
import { serverVideos } from "@/lib/server-api";

export default async function PlatformContentPage() {
  const videos = await serverVideos(50);
  return (
    <AppShell>
      <PlatformContent initialItems={videos} />
    </AppShell>
  );
}
