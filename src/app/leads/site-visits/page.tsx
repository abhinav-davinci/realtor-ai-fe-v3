import { CalendarCheck } from "lucide-react";
import { ComingSoon } from "@/components/leads/coming-soon";

export default function SiteVisitsPage() {
  return (
    <ComingSoon
      title="Site Visits"
      description="See scheduled visits, send reminders, and cut no-shows, all in one place."
      icon={CalendarCheck}
    />
  );
}
