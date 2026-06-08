"use client";

import { createElement, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Eye,
  Heart,
  MessageCircle,
  Percent,
  Send,
  Share2,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  api,
  type CloseInStats,
  type ShowUpStats,
  type UnifiedStats,
  type VideoStatusResponse,
} from "@/lib/api";
import { FacebookGlyph, InstagramGlyph, YoutubeGlyph, WhatsappGlyph } from "./brand-glyphs";

/* KPIs (properties, views, leads, engagement) come from the real dashboard
   stats API. Social engagement (likes/comments/shares) needs platform-insights
   APIs that don't exist on the backend yet, so those stay representative. */

interface Metric {
  icon: LucideIcon;
  value: string;
  label: string;
  delta: string;
  up: boolean;
}

// Range dropdown → the period values the dashboard API accepts (7d|30d|90d).
const PERIOD: Record<string, string> = {
  "All Time": "90d",
  "Last 7 Days": "7d",
  "Last 30 Days": "30d",
};

/** 152200 -> "152.2K", 9000 -> "9K", 1_200_000 -> "1.2M". */
function compact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(Math.round(n));
}

const PLATFORM_ROWS = [
  { icon: InstagramGlyph, name: "Instagram" },
  { icon: FacebookGlyph, name: "Facebook" },
  { icon: YoutubeGlyph, name: "YouTube" },
  { icon: WhatsappGlyph, name: "WhatsApp" },
];

const TABS: { label: string; badge?: number }[] = [
  { label: "Overview" },
  { label: "Instagram" },
  { label: "YouTube", badge: 2 },
  { label: "Facebook" },
  { label: "WhatsApp" },
];

const BARS = [12, 18, 9, 22, 15, 28, 19, 24, 14, 30, 21, 17, 26, 11, 23, 16, 29, 13, 20, 25, 18, 27, 10, 22, 19, 26, 14, 21];
const MINI = [4, 7, 3, 8, 5, 9, 6, 7, 4];
const RT_VIEWS = ["84K", "12K", "12K", "2K", "1.2K", "1K"];
const TOP_VIEWS = ["812K", "98K", "92K"];

const RANGES = ["All Time", "Last 7 Days", "Last 30 Days"];

export function Analytics({
  initialVids,
  initialStats,
}: {
  initialVids?: VideoStatusResponse[];
  initialStats?: { u?: UnifiedStats | null; c?: CloseInStats | null; s?: ShowUpStats | null };
}) {
  const [tab, setTab] = useState("Overview");
  const [vids, setVids] = useState<VideoStatusResponse[]>(
    () => (initialVids ?? []).filter((g) => g.status === "completed")
  );
  const [range, setRange] = useState("Last 7 Days");
  const [rangeOpen, setRangeOpen] = useState(false);
  const [stats, setStats] = useState<{ u?: UnifiedStats; c?: CloseInStats; s?: ShowUpStats }>(() => ({
    u: initialStats?.u ?? undefined,
    c: initialStats?.c ?? undefined,
    s: initialStats?.s ?? undefined,
  }));
  // Skip the first client stats fetch when the server already provided them.
  const skipFirstStats = useRef(!!initialStats);

  useEffect(() => {
    if (initialVids) return; // server already provided the videos
    let off = false;
    api.video
      .list({ limit: 12 })
      .then((r) => !off && setVids((r.items ?? []).filter((g) => g.status === "completed")))
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [initialVids]);

  // Real KPIs from the dashboard stats API, refetched when the range changes.
  // Each call is independent (allSettled) so one failing endpoint doesn't blank
  // the others; missing values fall back to representative figures below.
  useEffect(() => {
    if (skipFirstStats.current) {
      skipFirstStats.current = false;
      return; // server-rendered the default-range stats already
    }
    let off = false;
    const period = PERIOD[range] ?? "7d";
    Promise.allSettled([
      api.dashboard.stats(period),
      api.dashboard.closeIn(period),
      api.dashboard.showUp(period),
    ]).then(([u, c, s]) => {
      if (off) return;
      setStats({
        u: u.status === "fulfilled" ? u.value : undefined,
        c: c.status === "fulfilled" ? c.value : undefined,
        s: s.status === "fulfilled" ? s.value : undefined,
      });
    });
    return () => {
      off = true;
    };
  }, [range]);

  // Metric cards: real where the API provides it, representative for social-only.
  const metrics: Metric[] = useMemo(() => {
    const { u, s } = stats;
    return [
      { icon: Share2, label: "Content Published", value: s ? compact(s.properties) : "125", delta: "84%", up: true },
      { icon: Eye, label: "Total Views", value: s ? compact(s.total_views) : "152.2K", delta: "92%", up: true },
      { icon: Heart, label: "Total Likes", value: "12K", delta: "52%", up: false },
      { icon: MessageCircle, label: "Comments", value: "234", delta: "25%", up: true },
      { icon: Send, label: "Shares", value: "234", delta: "20%", up: false },
      { icon: Users, label: "Leads Generated", value: u ? compact(u.total_leads) : "9K", delta: "25%", up: true },
      { icon: Percent, label: "Engagement Rate", value: s ? `${s.engagement_rate}%` : "50.5%", delta: "72%", up: true },
    ];
  }, [stats]);

  // Lead funnel card values from the close-in / unified stats.
  const lead = useMemo(() => {
    const { u, c } = stats;
    return {
      enquiries: c ? c.total_enquiries : 234,
      interested: c ? c.hot_leads : 312,
      contacted: c ? c.site_visits : 186,
      // Real even when 0; only fall back to a representative figure if the
      // unified stats call didn't resolve.
      converted: u
        ? Math.round(u.total_leads * (u.conversion_rate > 1 ? u.conversion_rate / 100 : u.conversion_rate))
        : 128,
    };
  }, [stats]);

  const rtRows = useMemo(() => {
    const base = vids.length ? vids : Array.from({ length: 6 }, () => null);
    return base.slice(0, 6).map((g, i) => ({
      name: g?.name || "Premium 3BHK in Raheja Vistas",
      url: g?.video_url ?? null,
      views: RT_VIEWS[i % RT_VIEWS.length],
    }));
  }, [vids]);

  const topRows = useMemo(() => {
    const base = vids.length ? vids : Array.from({ length: 3 }, () => null);
    return base.slice(0, 3).map((g, i) => ({
      name: g?.name || "Premium 3BHK in Raheja Vistas, NIBM",
      url: g?.video_url ?? null,
      views: TOP_VIEWS[i % TOP_VIEWS.length],
    }));
  }, [vids]);

  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10">
      {/* Header */}
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-ink text-2xl font-bold">Analytics &amp; Performance</h1>
          <p className="text-ink-muted text-sm">Track your content performance and audience engagement</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setRangeOpen((o) => !o)}
            onBlur={() => setTimeout(() => setRangeOpen(false), 150)}
            className="text-ink flex items-center gap-2 rounded-lg border border-black/15 bg-white px-3.5 py-2 text-sm font-medium"
          >
            {range} <ChevronDown className="text-ink-muted size-4" />
          </button>
          {rangeOpen && (
            <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-black/10 bg-white py-1 shadow-lg">
              {RANGES.map((r) => (
                <button
                  key={r}
                  onMouseDown={() => {
                    setRange(r);
                    setRangeOpen(false);
                  }}
                  className="hover:bg-accent-blue/[0.06] flex w-full items-center justify-between px-3 py-2 text-left text-sm"
                >
                  <span className="text-ink">{r}</span>
                  {range === r && <Check className="text-accent-blue size-4" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sub tabs */}
      <div className="mt-5 flex flex-wrap items-center gap-7 border-b border-black/[0.07]">
        {TABS.map((t) => {
          const active = tab === t.label;
          return (
            <button
              key={t.label}
              onClick={() => setTab(t.label)}
              className={cn(
                "relative flex items-center gap-1.5 pb-3 text-sm font-semibold transition-colors",
                active ? "text-ink" : "text-ink-muted hover:text-ink"
              )}
            >
              {t.label}
              {t.badge != null && (
                <span className="bg-accent-blue/10 text-accent-blue grid size-4 place-items-center rounded-full text-[10px] font-bold">
                  {t.badge}
                </span>
              )}
              {active && <span className="bg-accent-blue absolute inset-x-0 -bottom-px h-0.5 rounded-full" />}
            </button>
          );
        })}
      </div>

      {/* Metric cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-2xl bg-black/[0.025] p-4">
            <span className="text-ink-muted grid size-9 place-items-center rounded-full bg-white shadow-sm">
              {createElement(m.icon, { className: "size-4", strokeWidth: 1.75 })}
            </span>
            <p className="text-ink mt-3 text-[22px] leading-none font-bold">{m.value}</p>
            <p className="text-ink-muted mt-1.5 text-xs">{m.label}</p>
            <p className={cn("mt-1.5 flex items-center gap-1 text-xs font-semibold", m.up ? "text-green-600" : "text-red-500")}>
              <TrendingUp className={cn("size-3.5", !m.up && "rotate-180")} />
              {m.delta}
            </p>
          </div>
        ))}
      </div>

      {/* Middle row */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_1fr_1.05fr]">
        {/* Platform Performance */}
        <div className="rounded-2xl border border-black/[0.07] bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-ink text-lg font-bold">Platform Performance</p>
            <button className="text-accent-blue text-sm font-medium">Manage Accounts</button>
          </div>
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="text-ink-muted text-xs">
                <th className="pb-3 font-medium">Platforms</th>
                <th className="pb-3 font-medium">Followers</th>
                <th className="pb-3 font-medium">Views</th>
                <th className="pb-3 font-medium">Engagement</th>
              </tr>
            </thead>
            <tbody>
              {PLATFORM_ROWS.map((r) => (
                <tr key={r.name}>
                  <td className="py-3.5">
                    <span className="flex items-center gap-2">
                      {createElement(r.icon, { className: "size-4" })}
                      <span className="text-ink font-medium">{r.name}</span>
                    </span>
                  </td>
                  <td className="text-ink py-3.5">124K</td>
                  <td className="text-ink py-3.5">125K</td>
                  <td className="py-3.5">
                    <span className="text-ink inline-flex items-center gap-1 font-medium">
                      42.5% <span className="inline-flex items-center gap-0.5 text-green-600">↗ 92%</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Lead */}
        <div className="rounded-2xl border border-black/[0.07] bg-white p-5">
          <p className="text-ink text-lg font-bold">Lead</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <LeadStat value={compact(lead.enquiries)} label="Total Comments" cls="border border-black/[0.08] bg-white" />
            <LeadStat value={compact(lead.interested)} label="Interested" cls="border border-black/[0.08] bg-white" />
            <LeadStat value={compact(lead.contacted)} label="Contacted" cls="bg-brand-orange/[0.1]" />
            <LeadStat value={compact(lead.converted)} label="Converted" cls="bg-green-50" />
          </div>
        </div>

        {/* Realtime */}
        <div className="flex flex-col rounded-2xl border border-black/[0.07] bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-ink font-bold">Realtime</p>
            <div className="flex gap-1 rounded-lg bg-black/[0.04] p-0.5 text-[11px]">
              <span className="text-ink rounded-md bg-white px-2 py-0.5 font-medium shadow-sm">48 HRS</span>
              <span className="text-ink-muted px-2 py-0.5">60 MIN</span>
            </div>
          </div>
          <p className="text-ink mt-3 text-center text-2xl font-bold">120K</p>
          <p className="text-ink-muted text-center text-xs">Views</p>

          {/* chart with y-axis */}
          <div className="mt-3 flex gap-2">
            <div className="text-ink-muted flex h-16 flex-col justify-between text-right text-[10px] leading-none">
              <span>30k</span>
              <span>20K</span>
              <span>10K</span>
              <span>0</span>
            </div>
            <div className="flex h-16 flex-1 items-end gap-[3px]">
              {BARS.map((h, i) => (
                <span key={i} className="flex-1 rounded-sm bg-[#4f86f7]" style={{ height: `${(h / 30) * 100}%` }} />
              ))}
            </div>
          </div>
          <div className="text-ink-muted mt-1 flex justify-between pl-8 text-[10px]">
            <span>48 hours ago</span>
            <span>Now</span>
          </div>

          <div className="mt-3 -mr-2 max-h-56 space-y-2.5 overflow-y-auto pr-2">
            {rtRows.map((r, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="size-9 shrink-0 overflow-hidden rounded-lg bg-black/[0.05]">
                  {r.url ? (
                    // eslint-disable-next-line jsx-a11y/media-has-caption
                    <video src={r.url} muted className="size-full object-cover" />
                  ) : null}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-ink truncate text-xs font-medium">{r.name}</p>
                  <p className="text-ink-muted text-[10px]">May 18, 2026 · 45sec</p>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <InstagramGlyph className="size-3.5" />
                  <YoutubeGlyph className="size-3.5" />
                  <FacebookGlyph className="size-3.5" />
                </div>
                <span className="text-ink shrink-0 text-xs font-semibold">{r.views}</span>
                <span className="flex h-5 shrink-0 items-end gap-[1px]">
                  {MINI.map((h, j) => (
                    <span key={j} className="w-[2px] rounded-sm bg-[#4f86f7]" style={{ height: `${(h / 9) * 100}%` }} />
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing */}
      <div className="mt-5 rounded-2xl border border-black/[0.07] bg-white p-5">
        <p className="text-ink text-lg font-bold">Top Performing Content</p>
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="text-ink-muted bg-black/[0.02] text-xs">
              <th className="rounded-l-lg px-4 py-3 font-medium">Content</th>
              <th className="px-2 py-3 font-medium">Platforms</th>
              <th className="px-2 py-3 font-medium">Views</th>
              <th className="px-2 py-3 font-medium">Likes</th>
              <th className="px-2 py-3 font-medium">Comments</th>
              <th className="rounded-r-lg px-2 py-3 font-medium">Leads</th>
            </tr>
          </thead>
          <tbody>
            {topRows.map((c, i) => (
              <tr key={i} className="border-b border-black/[0.05] last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="size-9 shrink-0 overflow-hidden rounded-lg bg-black/[0.05]">
                      {c.url ? (
                        // eslint-disable-next-line jsx-a11y/media-has-caption
                        <video src={c.url} muted className="size-full object-cover" />
                      ) : null}
                    </span>
                    <div>
                      <p className="text-ink font-medium">{c.name}</p>
                      <p className="text-ink-muted text-xs">May 18, 2026 · 45sec</p>
                    </div>
                  </div>
                </td>
                <td className="px-2 py-3">
                  <span className="flex items-center gap-1">
                    <InstagramGlyph className="size-4" />
                    <YoutubeGlyph className="size-4" />
                    <FacebookGlyph className="size-4" />
                  </span>
                </td>
                <td className="text-ink py-3">{c.views}</td>
                <td className="text-ink py-3">1260</td>
                <td className="text-ink py-3">580</td>
                <td className="text-ink py-3">80</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LeadStat({ value, label, cls }: { value: string; label: string; cls: string }) {
  return (
    <div className={cn("rounded-xl p-4", cls)}>
      <p className="text-ink text-2xl font-bold">{value}</p>
      <p className="text-ink-muted mt-0.5 text-xs">{label}</p>
    </div>
  );
}
