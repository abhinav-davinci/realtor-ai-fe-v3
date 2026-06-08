"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** Page numbers with ellipses, e.g. [1,2,3,4,5,"…",12]. */
export function getPages(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

/**
 * Pinned list footer — count + numbered pagination (prev/next + ellipsis) +
 * rows selector. Shared across My Properties, Platform Content and My Content.
 */
export function ListFooter({
  showing,
  total,
  noun,
  page,
  totalPages,
  onPageChange,
  rows,
  onRowsChange,
}: {
  showing: number;
  total: number;
  noun: string;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  rows: number;
  onRowsChange: (r: number) => void;
}) {
  const pages = Math.max(totalPages, 1);

  return (
    <div className="bg-cream sticky bottom-0 z-10 mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-black/[0.06] px-4 sm:px-6 lg:px-8 py-3.5 text-sm">
      <p className="text-ink-muted">
        Showing <span className="text-ink font-medium">{showing}</span> of{" "}
        <span className="text-ink font-medium">{total}</span> {noun}
      </p>

      <nav className="flex items-center gap-2">
        {getPages(page, pages).map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="text-ink-muted px-0.5 text-sm">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={cn(
                "grid size-9 place-items-center rounded-full text-sm font-medium transition-colors",
                p === page
                  ? "bg-accent-blue text-white"
                  : "text-ink border border-black/10 bg-white hover:bg-black/[0.03]"
              )}
            >
              {p}
            </button>
          )
        )}
      </nav>

      <div className="text-ink-muted flex items-center gap-2">
        <span>Show</span>
        <Select value={String(rows)} onValueChange={(value) => onRowsChange(Number(value))}>
          <SelectTrigger className="h-9 rounded-lg border-black/10 bg-white">
            <SelectValue>{rows} rows</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 rows</SelectItem>
            <SelectItem value="20">20 rows</SelectItem>
            <SelectItem value="50">50 rows</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
