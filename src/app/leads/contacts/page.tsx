import { Suspense } from "react";
import { ContactsHub } from "@/components/leads/contacts/contacts-hub";

export default function ContactsPage() {
  return (
    <Suspense>
      <ContactsHub />
    </Suspense>
  );
}
