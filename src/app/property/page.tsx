import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PropertyDetails } from "@/components/property/property-details";

export default function PropertyPage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <PropertyDetails />
      </Suspense>
    </AppShell>
  );
}
