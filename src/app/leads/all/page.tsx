import { redirect } from "next/navigation";

// Lead Intelligence moved to /leads/intelligence; keep the old path working.
export default function AllLeadsPage() {
  redirect("/leads/intelligence");
}
