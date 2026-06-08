import { AppShell } from "@/components/layout/app-shell";
import { ConnectPlatforms } from "@/components/content/connect-platforms";
import { serverChannels } from "@/lib/server-api";

export default async function ConnectPlatformsPage() {
  const channels = await serverChannels();
  return (
    <AppShell>
      <ConnectPlatforms initialChannels={channels} />
    </AppShell>
  );
}
