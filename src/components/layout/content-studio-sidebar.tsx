"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Video,
  Link2,
  Table2,
  LineChart,
  TrendingUp,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api, type VideoStatusResponse } from "@/lib/api";

const ACTIVE = new Set(["pending", "images_uploaded", "processing"]);
// A generation still "active" after this long is stuck (render never finished) —
// don't keep showing it as in-progress.
const FRESH_MS = 20 * 60 * 1000;
const isFresh = (createdAt?: string) => {
  const t = createdAt ? new Date(createdAt).getTime() : NaN;
  return !isNaN(t) && Date.now() - t < FRESH_MS;
};

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href?: string;
}

export const NAV: NavItem[] = [
  { label: "My Properties", icon: Building2, href: "/" },
  { label: "Create Video & Content", icon: Video, href: "/create-video" },
  { label: "Connect Platforms", icon: Link2, href: "/connect-platforms" },
  { label: "Platform Content", icon: Table2, href: "/platform-content" },
  { label: "My Content", icon: LineChart, href: "/my-content" },
  { label: "Analytics", icon: TrendingUp, href: "/analytics" },
];

/**
 * Live status of the most recent video generation. Polls while a generation
 * is active, shows a failed state if the latest one failed, and hides itself
 * when there's nothing in progress.
 */
export function VideoGeneratingCard() {
  const [gen, setGen] = useState<VideoStatusResponse | null>(null);

  useEffect(() => {
    let off = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      let activeNow = false;
      try {
        const res = await api.video.list({ limit: 5 });
        const items = res.items ?? [];
        // Only treat a recent generation as in-progress; ignore stuck ones.
        const active = items.find((g) => ACTIVE.has(g.status) && isFresh(g.created_at));
        const latest = items[0];
        activeNow = !!active;
        if (!off) setGen(active ?? (latest && latest.status === "failed" && isFresh(latest.created_at) ? latest : null));
      } catch {
        /* ignore — keep last known */
      }
      // Use the FRESHLY-fetched status (not stale closure state) so the card
      // polls fast (2s) while generating and stays in sync with the main panel.
      if (!off) timer = setTimeout(tick, activeNow ? 2000 : 12000);
    };
    tick();
    return () => {
      off = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!gen) return null;

  const name = gen.name || "Untitled video";
  if (gen.status === "failed") {
    return (
      <div className="rounded-xl bg-surface p-3 shadow-sm ring-1 ring-black/[0.06]">
        <p className="text-ink truncate text-xs font-semibold">{name}</p>
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-red-500/15">
          <div className="h-full w-full rounded-full bg-red-500" />
        </div>
        <div className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-red-500">
          <TriangleAlert className="size-3" /> Generation failed
        </div>
      </div>
    );
  }

  const pct = Math.max(5, Math.min(100, gen.progress || 0));
  return (
    <div className="rounded-xl bg-surface p-3 shadow-sm ring-1 ring-black/[0.06]">
      <p className="text-ink truncate text-xs font-semibold">{name}</p>
      <div className="bg-brand-orange/20 mt-2.5 h-1.5 w-full overflow-hidden rounded-full">
        <div className="bg-brand-orange h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-ink-muted mt-1.5 flex items-center justify-between text-[11px]">
        <span className="text-brand-orange flex items-center gap-1">
          Video Generating
          <span className="flex gap-0.5">
            <span className="bg-brand-orange size-1 animate-pulse rounded-full" />
            <span className="bg-brand-orange/60 size-1 animate-pulse rounded-full [animation-delay:150ms]" />
          </span>
        </span>
        <span className="text-brand-orange font-semibold">{pct}%</span>
      </div>
    </div>
  );
}

export function PocPeriodCard() {
  return (
    <div className="rounded-xl bg-surface p-4 shadow-sm ring-1 ring-black/[0.06]">
      <p className="text-ink text-sm font-semibold">POC Period</p>
      <div className="mt-3 rounded-lg border border-black/[0.07] bg-white p-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.08]">
          <div className="bg-accent-blue h-full rounded-full" style={{ width: "53%" }} />
        </div>
        <p className="text-ink-muted mt-2 text-xs">48 of 90 days · 42 remaining</p>
      </div>
      <Button className="bg-brand-orange hover:bg-brand-orange-hover mt-3 h-9 w-full rounded-lg text-sm font-semibold text-white">
        Upgrade Now
      </Button>
    </div>
  );
}

export function ContentStudioSidebar() {
  const pathname = usePathname();
  return (
    <aside className="bg-cream hidden w-[272px] shrink-0 flex-col border-r border-black/[0.06] lg:flex">
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
        <h2 className="text-ink text-lg font-bold">Content Studio</h2>
        <Badge className="bg-brand-orange relative rounded-md px-2 text-[11px] font-semibold text-white after:absolute after:inset-0 after:-translate-x-full after:bg-gradient-to-r after:from-transparent after:via-white/45 after:to-transparent after:content-[''] motion-safe:after:animate-shimmer">
          <span className="inline-block motion-safe:animate-float">Marketing</span>
        </Badge>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {NAV.map(({ label, icon: Icon, href }) => {
          const active = href === "/" ? pathname === "/" : !!href && pathname.startsWith(href);
          const className = cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            active
              ? "text-ink bg-surface shadow-sm ring-1 ring-black/[0.06]"
              : "text-[#3f4656] hover:bg-black/[0.04]"
          );
          return href ? (
            <Link key={label} href={href} className={className}>
              <Icon className="size-[18px]" strokeWidth={1.75} />
              {label}
            </Link>
          ) : (
            <button key={label} type="button" className={className}>
              <Icon className="size-[18px]" strokeWidth={1.75} />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 p-4">
        <VideoGeneratingCard />
        <PocPeriodCard />
      </div>
    </aside>
  );
}
