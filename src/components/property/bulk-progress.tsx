"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ImageIcon, MapPin, MoreVertical, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getBulkUpload, clearBulkUpload, bulkProcessed, type BulkUploadState } from "@/lib/bulk-upload";

type RowStatus = "complete" | "partial" | "missing" | "error";

interface Row {
  id: number;
  name: string;
  location: string;
  images: number;
  status: RowStatus;
  folder: string;
  matched: "matched" | "none" | null;
}

/** Deterministic mock rows that mirror the Figma review table. Real per-row
 * status + folder matching will come from the backend extraction pipeline. */
function buildRows(total: number): Row[] {
  const pattern: RowStatus[] = ["missing", "error", "complete", "partial"];
  return Array.from({ length: total }, (_, i) => {
    const status = pattern[i % pattern.length];
    const matched: Row["matched"] =
      status === "error" ? "none" : status === "missing" ? null : "matched";
    return {
      id: i + 1,
      name: "Premium 3BHK in Raheja Vistas, NIBM",
      location: "Bandra West, Mumbai",
      images: status === "complete" ? 12 : status === "partial" ? 1 : 0,
      status,
      folder: status === "error" ? "Greenpark malad" : status === "missing" ? "" : "Raheja Vistas, NIBM",
      matched,
    };
  });
}

const STATUS_META: Record<RowStatus, { label: string; dot: string; text: string }> = {
  complete: { label: "Complete", dot: "bg-green-500", text: "text-green-600" },
  partial: { label: "Partial", dot: "bg-brand-orange", text: "text-brand-orange" },
  missing: { label: "Missing", dot: "bg-black/30", text: "text-ink-muted" },
  error: { label: "Error", dot: "bg-red-500", text: "text-red-500" },
};

const ROWS_PER_PAGE = 10;

export function BulkProgress() {
  const [state, setState] = useState<BulkUploadState | null>(null);
  const [done, setDone] = useState(0);
  const [tab, setTab] = useState<"all" | RowStatus>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const tick = () => {
      const s = getBulkUpload();
      setState(s);
      if (s) setDone(bulkProcessed(s));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // 25 sample rows like the mock (independent of the small file row count).
  const rows = useMemo(() => buildRows(25), []);
  const counts = useMemo(() => {
    const c = { all: rows.length, complete: 0, partial: 0, missing: 0, error: 0 };
    for (const r of rows) c[r.status]++;
    return c;
  }, [rows]);

  const filtered = tab === "all" ? rows : rows.filter((r) => r.status === tab);
  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);

  const total = state?.total ?? 100;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const TABS: { key: "all" | RowStatus; label: string; count: number }[] = [
    { key: "all", label: "All Properties", count: counts.all },
    { key: "complete", label: "Complete", count: counts.complete },
    { key: "partial", label: "Partial", count: counts.partial },
    { key: "missing", label: "Missing", count: counts.missing },
    { key: "error", label: "Error", count: counts.error },
  ];

  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
      <div className="flex shrink-0 items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          nativeButton={false}
          render={<Link href="/add-property" />}
          aria-label="Back"
          className="text-ink mt-1 size-7 rounded-lg"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-ink text-2xl font-bold">Upload Progress Updated</h1>
          <p className="text-ink-muted text-sm">
            A few property listings are now ready for review. Remaining properties are currently being processed
          </p>
        </div>
      </div>

      {/* Progress banner */}
      {state && (
        <div className="mt-5 flex flex-wrap items-center gap-4 rounded-2xl border border-black/[0.07] bg-white p-4 shadow-sm">
          <span className="bg-accent-blue/10 text-accent-blue grid size-10 shrink-0 place-items-center rounded-full">
            <Upload className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-ink text-sm font-semibold">BulK Upload Inprogress…</p>
            <p className="text-ink-muted text-xs">
              Reading your properties and organizing the details. This may take a few moments.
            </p>
          </div>
          <div className="flex min-w-[260px] flex-1 items-center gap-3">
            <div className="bg-accent-blue/15 h-1.5 flex-1 overflow-hidden rounded-full">
              <div className="bg-accent-blue h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-ink-muted shrink-0 text-xs">
              Processing properties…{" "}
              <span className="text-accent-blue font-medium">{done} out of {total} completed.</span>
            </span>
            <span className="text-accent-blue shrink-0 text-xs font-semibold">{pct}%</span>
          </div>
          <button
            onClick={() => {
              clearBulkUpload();
              setState(null);
            }}
            aria-label="Dismiss"
            className="text-ink-muted hover:text-ink grid size-8 shrink-0 place-items-center rounded-full"
          >
            <X className="size-5" />
          </button>
        </div>
      )}

      {/* Tabs + bulk action */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-6 border-b border-black/[0.07]">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => {
                  setTab(t.key);
                  setPage(1);
                }}
                className={cn(
                  "relative flex items-center gap-2 pb-3 text-sm font-semibold transition-colors",
                  active ? "text-ink" : "text-ink-muted hover:text-ink"
                )}
              >
                {t.label}
                <span className={cn("rounded-full px-1.5 py-0.5 text-xs font-semibold", active ? "bg-accent-blue/10 text-accent-blue" : "bg-black/[0.06] text-ink-muted")}>
                  {String(t.count).padStart(2, "0")}
                </span>
                {active && <span className="bg-accent-blue absolute inset-x-0 -bottom-px h-0.5 rounded-full" />}
              </button>
            );
          })}
        </div>
        <Button variant="outline" className="text-ink h-9 rounded-lg border-black/15 px-4 text-sm font-medium">
          <Upload className="size-4" /> Bulk Upload Images
        </Button>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-black/[0.07] bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="text-ink-muted bg-black/[0.02] text-xs">
              <th className="w-10 px-4 py-3"><input type="checkbox" className="size-4 accent-[#2f6bed]" /></th>
              <th className="px-4 py-3 font-semibold">Property Name</th>
              <th className="px-4 py-3 font-semibold">Images</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Folder name</th>
              <th className="px-4 py-3 font-semibold">Match Folder</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => {
              const sm = STATUS_META[r.status];
              return (
                <tr key={r.id} className={cn("border-t border-black/[0.06]", r.status === "error" && "bg-red-50/40")}>
                  <td className="px-4 py-3"><input type="checkbox" className="size-4 accent-[#2f6bed]" /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="bg-black/[0.04] text-ink-muted grid size-9 shrink-0 place-items-center rounded-lg">
                        <ImageIcon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-ink truncate text-sm font-medium">{r.name}</p>
                        <p className="text-ink-muted flex items-center gap-1 text-xs">
                          <MapPin className="size-3" /> {r.location}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="text-ink-muted px-4 py-3">{r.images > 0 ? `${r.images} Images` : "No Images"}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", sm.text)}>
                      <span className={cn("size-1.5 rounded-full", sm.dot)} /> {sm.label}
                    </span>
                  </td>
                  <td className="text-ink px-4 py-3">{r.folder || "-"}</td>
                  <td className="px-4 py-3">
                    {r.matched === "matched" ? (
                      <span className="text-green-600 text-sm">✓ Matched</span>
                    ) : r.matched === "none" ? (
                      <span className="text-red-500 text-sm">⚠ No Matched</span>
                    ) : (
                      <span className="text-ink-muted">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {r.status === "missing" ? (
                        <button className="text-accent-blue border-accent-blue/30 inline-flex h-8 items-center gap-1.5 rounded-lg border bg-white px-3 text-xs font-semibold">
                          <Upload className="size-3.5" /> Upload Images
                        </button>
                      ) : r.status === "error" ? (
                        <button className="inline-flex h-8 items-center rounded-lg border border-red-300 bg-white px-3 text-xs font-semibold text-red-500">
                          Fix Match
                        </button>
                      ) : (
                        <button className="text-accent-blue border-accent-blue/30 inline-flex h-8 items-center gap-1.5 rounded-lg border bg-white px-3 text-xs font-semibold">
                          + Add more Images
                        </button>
                      )}
                      <button aria-label="More" className="text-ink-muted hover:text-ink grid size-8 place-items-center rounded-lg">
                        <MoreVertical className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-ink-muted text-sm">
          Showing {Math.min(filtered.length, ROWS_PER_PAGE)} of {filtered.length} properties
        </p>
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p <= 5 || p === totalPages)
            .map((p, idx, arr) => (
              <span key={p} className="flex items-center">
                {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-ink-muted px-1">…</span>}
                <button
                  onClick={() => setPage(p)}
                  className={cn(
                    "grid size-8 place-items-center rounded-lg text-sm font-medium",
                    p === safePage ? "bg-accent-blue text-white" : "text-ink hover:bg-black/[0.04]"
                  )}
                >
                  {p}
                </button>
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}
