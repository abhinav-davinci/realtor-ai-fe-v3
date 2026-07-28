"use client";

/**
 * Site Visits, not built yet. An admin manages every visit in the org; a User
 * only ever deals with the ones they are running, so the promise differs.
 */
import { CalendarCheck } from "lucide-react";
import { ComingSoon } from "@/components/leads/coming-soon";
import { useViewer } from "@/lib/use-viewer";

export function SiteVisitsPlaceholder() {
  const viewer = useViewer();
  if (!viewer.ready) return <div className="h-full" aria-hidden />;

  const orgWide = viewer.can("leads.intelligence");
  return (
    <ComingSoon
      title={orgWide ? "Site Visits" : "My Site Visits"}
      description={
        orgWide
          ? "See scheduled visits, send reminders, and cut no-shows, all in one place."
          : "The visits you are running, with a tap to confirm each one after it happens."
      }
      icon={CalendarCheck}
      backHref={orgWide ? "/leads/overview" : "/leads/my-calls"}
      backLabel={orgWide ? "Go to Overview" : "Go to my calling list"}
    />
  );
}
