import { UserManagement } from "@/components/account/user-management";
import { RequireCapability } from "@/components/layout/require-capability";

export default function UserManagementPage() {
  return (
    <RequireCapability needs="team.manage" title="User Management">
      <UserManagement />
    </RequireCapability>
  );
}
