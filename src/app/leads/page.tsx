import { redirect } from "next/navigation";

// The Leads section opens on its Overview.
export default function LeadsPage() {
  redirect("/leads/overview");
}
