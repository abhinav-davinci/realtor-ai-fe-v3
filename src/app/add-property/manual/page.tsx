import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ManualForm } from "@/components/property/manual-form";

export default function ManualFormPage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <ManualForm />
      </Suspense>
    </AppShell>
  );
}
