import { Suspense } from "react";
import { CallHistory } from "@/components/leads/call-history/call-history";

export default function CallHistoryPage() {
  return (
    <Suspense>
      <CallHistory />
    </Suspense>
  );
}
