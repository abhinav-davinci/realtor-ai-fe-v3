"use client";

import { createElement, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  Clock,
  Eye,
  Heart,
  History,
  Link2,
  Loader2,
  Megaphone,
  MessageCircle,
  Play,
  Share2,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListFooter } from "@/components/layout/list-footer";
import { RecentComments } from "./recent-comments";
import { SharePublishModal } from "@/components/property/share-modal";
import { cn } from "@/lib/utils";
import { api, type VideoStatusResponse } from "@/lib/api";
import { FacebookGlyph, InstagramGlyph, YoutubeGlyph, WhatsappGlyph, SparkleIcon } from "./brand-glyphs";

const PLATFORM_TABS = [
  { key: "all", label: "All Content", icon: null as null | React.ComponentType<{ className?: string }>, count: 90 },
  { key: "instagram", label: "Instagram", icon: InstagramGlyph, count: 22 },
  { key: "facebook", label: "Facebook", icon: FacebookGlyph, count: 24 },
  { key: "youtube", label: "YouTube", icon: YoutubeGlyph, count: 0 },
  { key: "whatsapp", label: "WhatsApp", icon: WhatsappGlyph, count: 0 },
];

const STATS = [
  { icon: Eye, value: "450K", label: "Total Views", delta: "25%" },
  { icon: Heart, value: "12K", label: "Total Likes", delta: "12%" },
  { icon: MessageCircle, value: "230", label: "Total Comments", delta: "12%" },
  { icon: Users, value: "9K", label: "Total Leads", delta: "12%" },
];

export function PlatformContent({ initialItems }: { initialItems?: VideoStatusResponse[] }) {
  const [items, setItems] = useState<VideoStatusResponse[]>(
    () => (initialItems ?? []).filter((g) => g.status === "completed")
  );
  const [loading, setLoading] = useState(!initialItems || initialItems.length === 0);
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState("Last 30 days");
  const [sortOpen, setSortOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const SORTS = ["Newest", "Last 30 days", "Last 90 days", "Most Views", "Most Engagement", "Published", "Unpublished"];

  useEffect(() => {
    if (initialItems && initialItems.length) return; // server already provided data
    let off = false;
    (async () => {
      try {
        const res = await api.video.list({ limit: 50 });
        if (!off) setItems((res.items ?? []).filter((g) => g.status === "completed"));
      } catch {
        /* empty */
      } finally {
        if (!off) setLoading(false);
      }
    })();
    return () => {
      off = true;
    };
  }, [initialItems]);

  // Stable representative engagement per card (until social-insights API exists).
  const cards = useMemo(
    () =>
      items.map((g, i) => ({
        g,
        views: ["450K", "120K", "98K", "812K", "1.2K"][i % 5],
        likes: ["120k", "12k", "1260", "8.4k", "980"][i % 5],
        comments: ["120", "80", "230", "45", "12"][i % 5],
        leads: ["10", "8", "24", "5", "3"][i % 5],
        engagement: [25.5, 100, 42.5, 88, 64][i % 5],
      })),
    [items]
  );

  const totalPages = Math.max(1, Math.ceil(cards.length / rows));
  const safePage = Math.min(page, totalPages);
  const visible = cards.slice((safePage - 1) * rows, safePage * rows);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 px-4 sm:px-6 lg:px-8 pt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-ink text-2xl font-bold">Content by Platform</h1>
          <p className="text-ink-muted text-sm">View all your published content organized by social media platform</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative">
            <button
              onClick={() => setSortOpen((o) => !o)}
              onBlur={() => setTimeout(() => setSortOpen(false), 150)}
              className="text-ink flex items-center gap-2 rounded-lg border border-black/15 bg-white px-3 py-2 text-sm font-medium"
            >
              {sort} <ChevronDown className="text-ink-muted size-4" />
            </button>
            {sortOpen && (
              <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-black/10 bg-white py-1 shadow-lg">
                {SORTS.map((s) => (
                  <button
                    key={s}
                    onMouseDown={() => {
                      setSort(s);
                      setSortOpen(false);
                    }}
                    className="hover:bg-accent-blue/[0.06] flex w-full items-center justify-between px-3 py-2 text-left text-sm"
                  >
                    <span className="text-ink">{s}</span>
                    {sort === s && <Check className="text-accent-blue size-4" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/connect-platforms" />}
            className="text-accent-blue border-accent-blue/30 hover:bg-accent-blue/[0.04] h-10 rounded-lg px-3 text-sm font-medium"
          >
            <Link2 className="size-4" />
            Connect More Platform
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/create-video" />}
            className="bg-brand-blue hover:bg-brand-blue-hover h-10 rounded-lg px-4 text-sm font-semibold text-white"
          >
            <SparkleIcon className="size-4" />
            Create Video & Content
          </Button>
        </div>
      </div>

      {/* Platform tabs — segmented bar: icon chip + label + count pill, blue underline on active. */}
      <div className="mt-6 flex overflow-x-auto rounded-xl border border-black/[0.08] bg-white">
        {PLATFORM_TABS.map((t, i) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "relative flex min-w-fit flex-1 items-center justify-center gap-2.5 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors",
                i > 0 && "border-l border-black/[0.07]",
                active ? "bg-accent-blue/[0.06] text-ink" : "text-ink-muted hover:bg-black/[0.02]"
              )}
            >
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full",
                  active ? "bg-accent-blue text-white" : "bg-black/[0.05] text-ink-muted"
                )}
              >
                {t.icon ? createElement(t.icon, { className: "size-4" }) : <Megaphone className="size-4" />}
              </span>
              {t.label}
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[11px] font-bold",
                  active ? "bg-ink text-white" : "bg-black/[0.06] text-ink-muted"
                )}
              >
                {String(t.count).padStart(2, "0")}
              </span>
              {active && <span className="bg-accent-blue absolute inset-x-3 bottom-0 h-[3px] rounded-t-full" />}
            </button>
          );
        })}
      </div>

      {/* Stat cards */}
      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-black/[0.07] bg-white p-4">
            <span className="bg-accent-blue/10 text-accent-blue grid size-10 place-items-center rounded-xl">
              {createElement(s.icon, { className: "size-5" })}
            </span>
            <div>
              <p className="text-ink text-xl font-bold">
                {s.value} <span className="text-xs font-medium text-green-600">↑ {s.delta}</span>
              </p>
              <p className="text-ink-muted text-xs">{s.label} · Last 30 days</p>
            </div>
          </div>
        ))}
      </div>
      </div>

      {loading ? (
        <div className="grid flex-1 place-items-center px-4 sm:px-6 lg:px-8 py-16">
          <Loader2 className="text-accent-blue size-6 animate-spin" />
        </div>
      ) : cards.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 sm:px-6 lg:px-8 py-16 text-center">
          <span className="bg-accent-blue/10 text-accent-blue grid size-14 place-items-center rounded-2xl">
            <Play className="size-7" />
          </span>
          <p className="text-ink font-semibold">No published content yet</p>
          <Button
            nativeButton={false}
            render={<Link href="/create-video" />}
            className="bg-brand-blue hover:bg-brand-blue-hover mt-1 h-10 rounded-lg px-4 text-sm font-semibold text-white"
          >
            <SparkleIcon className="size-4" /> Create Video
          </Button>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="grid grid-cols-1 gap-5 px-4 sm:px-6 lg:px-8 pt-6 pb-4 sm:grid-cols-2 2xl:grid-cols-3">
            {visible.map((c) => (
              <PlatformCard
                key={c.g.id}
                {...c}
                onViewComments={() => setCommentsFor(c.g.name || "Premium 3BHK in Raheja Vistas, NIBM")}
              />
            ))}
          </div>
          <ListFooter
            showing={visible.length}
            total={cards.length}
            noun="contents"
            page={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
            rows={rows}
            onRowsChange={(r) => {
              setRows(r);
              setPage(1);
            }}
          />
        </div>
      )}

      {commentsFor && (
        <RecentComments propertyTitle={commentsFor} onClose={() => setCommentsFor(null)} />
      )}
    </div>
  );
}

function PlatformCard({
  g,
  views,
  onViewComments,
  likes,
  comments,
  leads,
  engagement,
}: {
  g: VideoStatusResponse;
  views: string;
  likes: string;
  comments: string;
  leads: string;
  engagement: number;
  onViewComments: () => void;
}) {
  const date = new Date(g.created_at);
  const dateStr = isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const [playing, setPlaying] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  return (
    <article className="bg-surface flex flex-col overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/[0.06]">
      <button
        type="button"
        onClick={() => g.video_url && setPlaying(true)}
        className="from-accent-blue/15 to-brand-orange/15 relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br text-left"
      >
        {g.video_url ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={g.video_url} muted preload="metadata" className="size-full object-contain" />
        ) : (
          <div className="grid size-full place-items-center">
            <Play className="text-ink-muted size-8" />
          </div>
        )}
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-ink shadow-sm">
          <Sparkles className="text-accent-blue size-3" /> AI Generated
        </span>
        <span className="absolute right-3 bottom-3 rounded-md bg-black/55 px-2 py-0.5 text-xs font-medium text-white">01:00</span>
        <span className="absolute top-1/2 left-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/85 shadow">
          <Play className="text-ink size-4 fill-ink" />
        </span>
      </button>

      {playing && g.video_url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={() => setPlaying(false)}>
          <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <button aria-label="Close" onClick={() => setPlaying(false)} className="absolute -top-10 right-0 text-white/90 hover:text-white">
              <X className="size-6" />
            </button>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video src={g.video_url} controls autoPlay className="max-h-[80vh] w-full rounded-xl bg-black" />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col p-4">
        <p className="text-accent-blue decoration-accent-blue/40 truncate text-sm font-semibold underline underline-offset-2">
          {g.name || "Premium 3BHK in Raheja Vistas, NIBM"}
        </p>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-ink-muted flex items-center gap-1 text-xs">
            <Clock className="size-3" /> {dateStr} · Published
          </p>
          <div className="text-ink-muted flex items-center gap-2.5">
            <History className="size-4" />
            <button aria-label="Share" onClick={() => setShareOpen(true)} className="hover:text-ink">
              <Share2 className="size-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          {[
            { v: views, l: "Views", icon: Eye },
            { v: likes, l: "Likes", icon: Heart },
            { v: comments, l: "Comments", icon: MessageCircle },
            { v: leads, l: "Leads", icon: Users },
          ].map((s) => (
            <div key={s.l} className="flex items-center gap-1.5 rounded-lg bg-black/[0.03] px-2 py-2">
              <span className="text-ink-muted shrink-0">{createElement(s.icon, { className: "size-3.5" })}</span>
              <div className="min-w-0">
                <p className="text-ink truncate text-sm leading-tight font-bold">{s.v}</p>
                <p className="text-ink-muted text-[10px] leading-tight">{s.l}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <InstagramGlyph className="size-4" />
          <YoutubeGlyph className="size-4" />
          <FacebookGlyph className="size-4" />
          <span className="text-ink-muted ml-auto text-xs">Engagement Rate</span>
          <span className="text-xs font-semibold text-green-600">{engagement}%</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.08]">
          <div className="bg-accent-blue h-full rounded-full" style={{ width: `${Math.min(100, engagement)}%` }} />
        </div>

        <Button
          onClick={onViewComments}
          className="mt-3 h-10 w-full rounded-lg bg-[#2D54A1] text-sm font-semibold text-white hover:bg-[#26488A] active:bg-[#1F3C73]"
        >
          <MessageCircle className="size-4" />
          View Comments
        </Button>
      </div>

      {shareOpen && (
        <SharePublishModal
          heading="Share Content"
          shareLabel="Share content"
          showVideo
          showPublish={false}
          target={{
            title: g.name || "Untitled video",
            videoReady: g.status === "completed",
            videoUrl: g.video_url,
            url: g.video_url ?? (typeof window !== "undefined" ? window.location.origin + "/platform-content" : ""),
          }}
          onClose={() => setShareOpen(false)}
        />
      )}
    </article>
  );
}
