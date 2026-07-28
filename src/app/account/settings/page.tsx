import { Settings } from "lucide-react";
import { ComingSoon } from "@/components/leads/coming-soon";

// The back link points at leads because every role can reach those; User
// Management is admins only.
export default function AccountSettingsPage() {
  return (
    <ComingSoon
      title="Account Settings"
      description="Your organization profile, branding, and login preferences, all in one place."
      icon={Settings}
      eyebrow="Part of your account"
      backHref="/leads/overview"
      backLabel="Go to my leads"
    />
  );
}
