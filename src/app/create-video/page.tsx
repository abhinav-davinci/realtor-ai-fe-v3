import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { CreateVideoFlow } from "@/components/content/create-video-flow";

export default function CreateVideoPage() {
  return (
    <AppShell>
      <Suspense>
        <CreateVideoFlow />
      </Suspense>
    </AppShell>
  );
}
