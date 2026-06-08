"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HelpCircle, House, Loader2, Lock, Plus, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListFooter } from "@/components/layout/list-footer";
import { cn } from "@/lib/utils";
import { type Property } from "@/lib/properties";
import { api, ApiError, type ListingItem } from "@/lib/api";
import { listingToProperty } from "@/lib/map-listing";
import { PropertyCard } from "./property-card";

type TabKey = "all" | "sale" | "rent";

/**
 * Add Property CTA — a dark→light green gradient button, sitting inside a green
 * gradient ring that rotates, with a small gap between the ring and the button.
 * Layers: [rotating green ring] · [gap] · [gradient button].
 */
function AddPropertyButton({
  wrapperClassName,
  buttonClassName,
}: {
  wrapperClassName?: string;
  buttonClassName?: string;
}) {
  return (
    <span
      className={cn(
        // outer = the ring; its dark-green base shows the rotating light-green arc
        "relative inline-flex shrink-0 overflow-hidden rounded-[15px] bg-[#0e7d44] p-[1.5px]",
        wrapperClassName
      )}
    >
      {/* Rotating green highlight travelling the ring (light green over the dark base). */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-[-150%] bg-[conic-gradient(from_0deg,transparent_0deg,#86efac_55deg,transparent_135deg)] [animation-duration:3.5s] motion-safe:animate-spin"
      />
      {/* Gap between the ring and the button (matches the white page background). */}
      <span className="relative flex rounded-[13px] bg-white p-[3px]">
        <Button
          nativeButton={false}
          render={<Link href="/add-property" />}
          className={cn(
            "w-full gap-2 rounded-[10px] bg-gradient-to-r from-[#0e7d44] to-[#4ed68f] text-sm font-semibold text-white hover:from-[#0c6e3c] hover:to-[#43c983]",
            buttonClassName
          )}
        >
          <Plus className="size-4" />
          Add Property
        </Button>
      </span>
    </span>
  );
}

function filterByTab(list: Property[], tab: TabKey) {
  if (tab === "sale") return list.filter((p) => p.listingType === "sale");
  if (tab === "rent") return list.filter((p) => p.listingType === "rent");
  return list;
}

function EmptyState() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pb-10 text-center">
      <div className="relative grid size-44 place-items-center">
        <div className="bg-brand-orange/10 absolute inset-5 rounded-full" />
        <HelpCircle className="text-brand-orange/30 absolute top-5 right-7 size-6" strokeWidth={2} />
        <HelpCircle className="text-brand-orange/20 absolute bottom-8 left-6 size-5" strokeWidth={2} />
        <div className="relative">
          <House className="text-brand-orange size-20" strokeWidth={1.25} />
          <span className="bg-brand-orange absolute right-0 bottom-1 grid size-8 place-items-center rounded-full text-white shadow-sm ring-4 ring-cream">
            <Lock className="size-4" />
          </span>
        </div>
      </div>
      <h2 className="text-ink mt-6 text-2xl font-bold">Let&apos;s Add Your First Property</h2>
      <p className="text-ink-muted mt-2 max-w-md text-sm leading-relaxed">
        Start by adding your first property to create videos, publish content, and manage listings
      </p>
      <AddPropertyButton wrapperClassName="mt-6" buttonClassName="h-11 px-5" />
    </div>
  );
}

export function MyProperties({ initialListings }: { initialListings?: ListingItem[] | null }) {
  const [tab, setTab] = useState<TabKey>("all");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);

  // Seed from the server-rendered listings (SSR) so the first paint has data.
  const [allItems, setAllItems] = useState<Property[]>(
    () => (initialListings ?? []).map(listingToProperty)
  );
  const [loading, setLoading] = useState(!initialListings);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Server already provided the first page — don't refetch on mount.
    if (initialListings) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.listings.list({ page: 1, limit: 100 });
        if (!cancelled) setAllItems(res.items.map(listingToProperty));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load properties");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialListings]);

  const counts = useMemo(
    () => ({
      all: allItems.length,
      sale: allItems.filter((p) => p.listingType === "sale").length,
      rent: allItems.filter((p) => p.listingType === "rent").length,
    }),
    [allItems]
  );
  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "all", label: "All Properties", count: counts.all },
    { key: "sale", label: "For Sale", count: counts.sale },
    { key: "rent", label: "For Rent", count: counts.rent },
  ];

  const filtered = useMemo(() => filterByTab(allItems, tab), [allItems, tab]);
  const PAGE_COUNT = Math.max(1, Math.ceil(filtered.length / rows));
  const safePage = Math.min(page, PAGE_COUNT);
  const start = (safePage - 1) * rows;
  const visible = filtered.slice(start, start + rows);

  function selectTab(next: TabKey) {
    setTab(next);
    setPage(1);
  }

  const Header = (
    <div className="shrink-0 px-4 sm:px-6 lg:px-8 pt-6 pb-4">
      <h1 className="text-ink text-2xl font-bold">My Properties</h1>
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        {Header}
        <div className="grid flex-1 place-items-center">
          <Loader2 className="text-accent-blue size-6 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col">
        {Header}
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 sm:px-6 lg:px-8 text-center">
          <TriangleAlert className="size-8 text-red-500" />
          <p className="text-ink font-semibold">Couldn&apos;t load your properties</p>
          <p className="text-ink-muted max-w-md text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (allItems.length === 0) {
    return (
      <div className="flex h-full flex-col">
        {Header}
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header: title + tabs + add */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-3 px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <h1 className="text-ink text-2xl font-bold">My Properties</h1>

        <AddPropertyButton
          wrapperClassName="order-2 ml-auto lg:order-3"
          buttonClassName="h-10 px-4"
        />

        <div className="order-3 -mb-1 flex w-full items-center gap-6 overflow-x-auto pb-1 lg:order-2 lg:mb-0 lg:w-auto lg:overflow-visible lg:pb-0">
          {tabs.map(({ key, label, count }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => selectTab(key)}
                className={cn(
                  "relative flex shrink-0 items-center gap-2 pb-2 text-[15px] font-semibold whitespace-nowrap transition-colors",
                  active ? "text-ink" : "text-ink-muted hover:text-ink"
                )}
              >
                {label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-xs font-semibold",
                    active
                      ? "bg-accent-blue/10 text-accent-blue"
                      : "bg-black/[0.06] text-ink-muted"
                  )}
                >
                  {count}
                </span>
                {active && (
                  <span className="bg-accent-blue absolute inset-x-0 -bottom-px h-0.5 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scroll region: grid + pinned footer share one content box so their
          widths always match (the scrollbar gutter applies to both). */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="grid auto-rows-min grid-cols-1 gap-5 px-4 sm:px-6 lg:px-8 pb-6 sm:grid-cols-2 2xl:grid-cols-3">
          {visible.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onDeleted={(id) => setAllItems((prev) => prev.filter((p) => p.id !== id))}
            />
          ))}
        </div>

        <ListFooter
          showing={visible.length}
          total={filtered.length}
          noun="properties"
          page={safePage}
          totalPages={PAGE_COUNT}
          onPageChange={setPage}
          rows={rows}
          onRowsChange={(r) => {
            setRows(r);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}
