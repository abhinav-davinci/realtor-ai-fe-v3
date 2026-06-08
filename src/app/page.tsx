import { AppShell } from "@/components/layout/app-shell";
import { MyProperties } from "@/components/property/my-properties";
import { serverListings } from "@/lib/server-api";

// Server-rendered: fetch the user's listings on the server (from the session
// cookie) so the first paint already has data, then hydrate for interactivity.
export default async function Home() {
  const data = await serverListings();
  return (
    <AppShell>
      <MyProperties initialListings={data?.items ?? null} />
    </AppShell>
  );
}
