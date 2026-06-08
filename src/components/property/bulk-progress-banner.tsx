"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import {
  getBulkUpload,
  clearBulkUpload,
  bulkProcessed,
  type BulkUploadState,
} from "@/lib/bulk-upload";

/** Bottom-of-page banner shown on "Choose Input Method" while a bulk upload is
 * being processed. Polls the simulated progress and links to the review page. */
export function BulkProgressBanner() {
  const router = useRouter();
  const [state, setState] = useState<BulkUploadState | null>(null);
  const [done, setDone] = useState(0);

  useEffect(() => {
    const tick = () => {
      const s = getBulkUpload();
      if (!s) {
        setState(null);
        return;
      }
      const processed = bulkProcessed(s);
      // Once everything is processed, clear it so the banner doesn't show again.
      if (s.total > 0 && processed >= s.total) {
        clearBulkUpload();
        setState(null);
        return;
      }
      setState(s);
      setDone(processed);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!state) return null;

  const pct = state.total ? Math.round((done / state.total) * 100) : 0;
  const label = state.name.replace(/\.[^.]+$/, "");

  return (
    <div className="mt-5 rounded-2xl border border-black/[0.07] bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="bg-accent-blue/10 text-accent-blue grid size-10 shrink-0 place-items-center rounded-full">
          <Upload className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-ink truncate text-sm font-semibold">{label} Bulk Upload Inprogress…</p>
          <p className="text-ink-muted text-xs">
            Reading your properties and organizing the details. This may take a few moments.
          </p>
        </div>
        <button
          onClick={() => router.push("/add-property/bulk/progress")}
          className="bg-brand-blue hover:bg-brand-blue-hover h-9 shrink-0 rounded-lg px-4 text-sm font-semibold text-white"
        >
          View Properties
        </button>
        <button
          onClick={() => {
            clearBulkUpload();
            setState(null);
          }}
          aria-label="Dismiss"
          className="text-ink-muted hover:text-ink grid size-9 shrink-0 place-items-center rounded-full"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="bg-accent-blue/15 h-1.5 flex-1 overflow-hidden rounded-full">
          <div
            className="bg-accent-blue h-full rounded-full transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs">
        <span className="text-ink-muted">
          Processing properties…{" "}
          <span className="text-accent-blue font-medium">
            {done} out of {state.total} completed.
          </span>
        </span>
        <span className="text-accent-blue font-semibold">{pct}%</span>
      </div>
    </div>
  );
}
