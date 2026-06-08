import { AppShell } from "@/components/layout/app-shell";
import { MyContent } from "@/components/content/my-content";
import { serverVideos } from "@/lib/server-api";

export default async function MyContentPage() {
  const videos = await serverVideos(50);
  return (
    <AppShell>
      <MyContent initialItems={videos} />
    </AppShell>
  );
}
