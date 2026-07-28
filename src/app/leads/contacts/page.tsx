import { Suspense } from "react";
import { ContactsHub } from "@/components/leads/contacts/contacts-hub";
import { RequireCapability } from "@/components/layout/require-capability";

export default function ContactsPage() {
  return (
    <RequireCapability needs="contacts.manage" title="Contacts">
      <Suspense>
        <ContactsHub />
      </Suspense>
    </RequireCapability>
  );
}
