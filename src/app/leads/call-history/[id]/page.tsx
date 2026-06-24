import { Suspense } from "react";
import { CallSessionDetail } from "@/components/leads/call-history/call-session-detail";

export default async function CallSessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <CallSessionDetail id={id} />
    </Suspense>
  );
}
