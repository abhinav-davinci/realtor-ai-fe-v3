"use client";

/**
 * The Leads section's front door. The viewer only resolves after mount (it
 * lives in localStorage), so this cannot be a server redirect: it waits, then
 * sends admins to the Overview and Users to their calling list.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useViewer } from "@/lib/use-viewer";

export function LeadsLanding() {
  const router = useRouter();
  const viewer = useViewer();

  useEffect(() => {
    if (!viewer.ready) return;
    router.replace(viewer.can("leads.intelligence") ? "/leads/overview" : "/leads/my-calls");
  }, [viewer, router]);

  return <div className="h-full" aria-hidden />;
}
