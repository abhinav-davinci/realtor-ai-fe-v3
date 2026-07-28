import { Settings } from "lucide-react";
import { ComingSoon } from "@/components/leads/coming-soon";

export default function AccountSettingsPage() {
  return (
    <ComingSoon
      title="Account Settings"
      description="Your organization profile, branding, and login preferences, all in one place."
      icon={Settings}
      eyebrow="Part of your account"
      backHref="/account/users"
      backLabel="Go to User Management"
    />
  );
}
