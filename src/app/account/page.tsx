import { redirect } from "next/navigation";

// The account section opens on User Management, the only screen built so far.
export default function AccountPage() {
  redirect("/account/users");
}
