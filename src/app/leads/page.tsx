import { LeadsLanding } from "@/components/leads/leads-landing";

// Where the Leads rail item drops you, which depends on who you are: admins
// open on the Overview, a User opens on the list of people they have to call.
export default function LeadsPage() {
  return <LeadsLanding />;
}
