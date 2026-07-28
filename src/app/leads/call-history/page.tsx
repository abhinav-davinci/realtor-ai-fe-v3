import { Suspense } from "react";
import { CallHistory } from "@/components/leads/call-history/call-history";
import { RequireCapability } from "@/components/layout/require-capability";

export default function CallHistoryPage() {
  return (
    <RequireCapability needs="calls.history" title="AI Call History">
      <Suspense>
        <CallHistory />
      </Suspense>
    </RequireCapability>
  );
}
