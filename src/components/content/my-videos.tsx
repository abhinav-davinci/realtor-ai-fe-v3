"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  CircleAlert,
  Download,
  Image as ImageIcon,
  Lightbulb,
  Loader2,
  Maximize,
  Mic,
  MoreVertical,
  Music,
  Play,
  Upload,
  PlayCircle,
  RotateCw,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TriangleAlert,
  Volume2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api, ApiError, type AddAudioResponse, type VideoStatusResponse } from "@/lib/api";
import { saveVideoFile } from "@/lib/download";
import { SparkleIcon } from "./brand-glyphs";
import { SharePublishModal } from "@/components/property/share-modal";

type VStatus = "ready" | "processing" | "failed";

// A generation still "in progress" after this long has stalled (the render
// timed out) — treat it as failed rather than perpetually "Processing".
const FRESH_MS = 20 * 60 * 1000;
function isFresh(createdAt?: string) {
  const t = createdAt ? new Date(createdAt).getTime() : NaN;
  return !isNaN(t) && Date.now() - t < FRESH_MS;
}

function vStatus(g: VideoStatusResponse): VStatus {
  if (g.status === "completed") return "ready";
  if (g.status === "failed") return "failed";
  if (!isFresh(g.created_at)) return "failed"; // stuck/stalled generation
  return "processing"; // pending | images_uploaded | processing
}

const FALLBACK_DESC =
  "Create a modern and luxurious lifestyle video highlighting amenities, connectivity, and interior spaces. Create a modern and luxurious lifestyle video.";

type StatusFilter = "all" | "ready" | "processing" | "failed";
const STATUS_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All Videos" },
  { key: "ready", label: "Video Ready" },
  { key: "processing", label: "Processing" },
  { key: "failed", label: "Failed" },
];

export function MyVideos() {
  const [items, setItems] = useState<VideoStatusResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [pending, setPending] = useState<StatusFilter>("all"); // popover selection before Apply

  useEffect(() => {
    let off = false;
    let timer: ReturnType<typeof setTimeout>;
    const fetchList = async (initial: boolean) => {
      if (initial) {
        setLoading(true);
        setError(null);
      }
      try {
        const res = await api.video.list({ limit: 50 });
        if (off) return;
        const list = res.items ?? [];
        setItems(list);
        // Keep polling while a generation is still in progress so rows update to
        // Ready/Failed instead of getting stuck at "Processing".
        const anyActive = list.some(
          (g) => g.status !== "completed" && g.status !== "failed" && isFresh(g.created_at)
        );
        if (anyActive) timer = setTimeout(() => fetchList(false), 5000);
      } catch (e) {
        if (!off && initial) setError(e instanceof ApiError ? e.message : "Failed to load videos");
      } finally {
        if (!off && initial) setLoading(false);
      }
    };
    fetchList(true);
    return () => {
      off = true;
      clearTimeout(timer);
    };
  }, []);

  const counts = useMemo(() => {
    const c = { total: items.length, ready: 0, processing: 0, failed: 0 };
    for (const g of items) {
      const s = vStatus(g);
      if (s === "ready") c.ready++;
      else if (s === "processing") c.processing++;
      else c.failed++;
    }
    return c;
  }, [items]);

  const visible = useMemo(
    () => (statusFilter === "all" ? items : items.filter((g) => vStatus(g) === statusFilter)),
    [items, statusFilter]
  );

  const openFilter = () => {
    setPending(statusFilter);
    setFilterOpen(true);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10">
      {/* Header */}
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            nativeButton={false}
            render={<Link href="/create-video" />}
            className="text-ink mt-0.5 grid size-8 place-items-center rounded-lg p-0 hover:bg-black/[0.04]"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-ink text-2xl font-bold">My Videos</h1>
            <p className="text-ink-muted text-sm">Access and manage all your AI-generated property videos here.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => (filterOpen ? setFilterOpen(false) : openFilter())}
              className={cn(
                "flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors",
                statusFilter !== "all"
                  ? "border-accent-blue/40 bg-accent-blue/[0.08] text-accent-blue"
                  : "text-accent-blue border-black/15 bg-white hover:bg-black/[0.02]"
              )}
            >
              <SlidersHorizontal className="size-4" /> Filter
              {statusFilter !== "all" && (
                <span className="bg-accent-blue size-1.5 rounded-full" />
              )}
            </button>

            {filterOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
                <div
                  className="absolute right-0 z-50 mt-2 w-[400px] max-w-[calc(100vw-2rem)] rounded-2xl bg-white p-5 text-left shadow-2xl ring-1 ring-black/[0.06]"
                  style={{ animation: "scale-in 160ms ease-out both" }}
                >
                  <h3 className="text-ink text-lg font-bold">Filter by Status</h3>
                  <p className="text-ink-muted mt-1 text-sm">Choose the video status to quickly find your videos</p>
                  <div className="my-4 border-t border-black/[0.07]" />
                  <p className="text-ink text-sm font-semibold">Status</p>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {STATUS_OPTIONS.map((o) => {
                      const sel = pending === o.key;
                      return (
                        <button
                          key={o.key}
                          type="button"
                          onClick={() => setPending(o.key)}
                          className={cn(
                            "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                            sel
                              ? "border-accent-blue text-accent-blue bg-accent-blue/[0.04]"
                              : "text-ink border-black/15 hover:bg-black/[0.02]"
                          )}
                        >
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="my-4 border-t border-black/[0.07]" />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setPending("all")}
                      className="text-ink h-11 flex-1 rounded-xl border border-black/15 text-sm font-semibold hover:bg-black/[0.02]"
                    >
                      Clear All
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter(pending);
                        setFilterOpen(false);
                      }}
                      className="bg-brand-blue hover:bg-brand-blue-hover h-11 flex-1 rounded-xl text-sm font-semibold text-white"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          <Button
            nativeButton={false}
            render={<Link href="/create-video" />}
            className="bg-brand-blue hover:bg-brand-blue-hover h-10 rounded-lg px-4 text-sm font-semibold text-white"
          >
            <SparkleIcon className="size-4" /> Create New Video
          </Button>
        </div>
      </div>

      {/* Body: list + sidebar */}
      <div className="mt-6 flex min-h-0 flex-1 gap-6">
        {/* List */}
        <div className="min-w-0 flex-1 space-y-5">
          {loading ? (
            <div className="grid place-items-center py-24">
              <Loader2 className="text-accent-blue size-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
              <TriangleAlert className="size-8 text-red-500" />
              <p className="text-ink font-semibold">Couldn&apos;t load videos</p>
              <p className="text-ink-muted text-sm">{error}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-black/15 py-20 text-center">
              <span className="bg-accent-blue/10 text-accent-blue grid size-14 place-items-center rounded-2xl">
                <PlayCircle className="size-7" />
              </span>
              <p className="text-ink font-semibold">No videos yet</p>
              <p className="text-ink-muted max-w-sm text-sm">Generate your first AI property video to see it here.</p>
              <Button
                nativeButton={false}
                render={<Link href="/create-video" />}
                className="bg-brand-blue hover:bg-brand-blue-hover mt-1 h-10 rounded-lg px-4 text-sm font-semibold text-white"
              >
                <SparkleIcon className="size-4" /> Create New Video
              </Button>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/15 py-20 text-center">
              <span className="bg-black/[0.04] text-ink-muted grid size-12 place-items-center rounded-full">
                <SlidersHorizontal className="size-5" />
              </span>
              <p className="text-ink font-semibold">No videos match this filter</p>
              <button onClick={() => setStatusFilter("all")} className="text-accent-blue text-sm font-medium hover:underline">
                Clear filter
              </button>
            </div>
          ) : (
            visible.map((g) => <VideoRow key={g.id} g={g} />)
          )}
        </div>

        {/* Sidebar */}
        <aside className="hidden w-[296px] shrink-0 space-y-4 lg:block">
          <OverviewCard counts={counts} />
          <GetNotifiedCard />
          <TipsCard />
          <SecureCard />
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------- video row ------------------------------- */

function VideoRow({ g }: { g: VideoStatusResponse }) {
  const status = vStatus(g);
  const [shareOpen, setShareOpen] = useState(false);
  const [watchOpen, setWatchOpen] = useState(false);
  const date = new Date(g.created_at);
  const valid = !isNaN(date.getTime());
  const dateStr = valid ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  const timeStr = valid ? date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";
  const photos = g.images?.length ?? 0;
  const scenes = Math.max(photos, status === "ready" ? 7 : 6);

  return (
    <article className="rounded-2xl border border-black/[0.08] bg-white p-4">
      <div className="flex gap-4">
        {/* Thumbnail */}
        <VideoThumb g={g} status={status} />

        {/* Middle */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <h3 className="text-ink truncate text-[15px] font-semibold">{g.name || "Untitled Property"}</h3>
              <StatusBadge status={status} />
            </div>
            <button aria-label="More" className="text-ink-muted hover:text-ink -mt-1 grid size-7 shrink-0 place-items-center rounded-lg">
              <MoreVertical className="size-4" />
            </button>
          </div>

          <div className="text-ink-muted mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
            <ImageIcon className="size-3.5" />
            <span>{photos || 8} Photos</span>
            <span className="text-black/20">•</span>
            <span>{dateStr || "Apr 3, 2026"}</span>
            <span className="text-black/20">•</span>
            <span>{timeStr || "02:15 PM"}</span>
          </div>

          <p className="text-ink-muted mt-2 line-clamp-2 text-xs leading-relaxed">{FALLBACK_DESC}</p>

          <p className="text-ink mt-3 text-xs font-medium">Video Scenes</p>
          <div className="mt-1.5 flex gap-1.5">
            {Array.from({ length: Math.min(scenes, 7) }).map((_, i) => (
              <SceneTile key={i} index={i} />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex w-[136px] shrink-0 flex-col gap-2">
          <ActionColumn g={g} status={status} onShare={() => setShareOpen(true)} onWatch={() => setWatchOpen(true)} />
        </div>
      </div>

      {shareOpen && (
        <SharePublishModal
          shareLabel="Share Video"
          showVideo
          target={{
            title: g.name || "Untitled Property",
            location: `${dateStr || "Apr 3, 2026"} • ${timeStr || "02:15 PM"}`,
            videoReady: status === "ready",
            videoUrl: g.video_url,
            url: g.video_url ?? (typeof window !== "undefined" ? window.location.origin + "/create-video/videos" : ""),
          }}
          onClose={() => setShareOpen(false)}
        />
      )}

      {watchOpen && <WatchModal g={g} onClose={() => setWatchOpen(false)} />}
    </article>
  );
}

function VideoThumb({ g, status }: { g: VideoStatusResponse; status: VStatus }) {
  if (status === "processing") {
    return (
      <div className="relative grid h-[148px] w-[232px] shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-[#3a4a6b] to-[#1f2942] text-center">
        <div className="px-6">
          <Loader2 className="mx-auto size-7 animate-spin text-white/90" />
          <p className="mt-2 text-sm font-semibold text-white">Generating Your Video</p>
          <p className="mt-1 text-[11px] text-white/70">AI is working on your video. This may take a few minutes.</p>
        </div>
      </div>
    );
  }
  if (status === "failed") {
    return (
      <div className="relative grid h-[148px] w-[232px] shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-[#4a3a4a] to-[#2a1f2a] text-center">
        <div className="px-6">
          <CircleAlert className="mx-auto size-7 text-red-400" />
          <p className="mt-2 text-sm font-semibold text-white">Video Generation Failed</p>
          <p className="mt-1 text-[11px] text-white/70">Please check your image inputs and try again</p>
        </div>
      </div>
    );
  }
  // ready
  return (
    <div className="relative h-[148px] w-[232px] shrink-0 overflow-hidden rounded-xl bg-black/[0.06]">
      {g.video_url ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video src={g.video_url} muted preload="metadata" className="size-full object-cover" />
      ) : (
        <div className="from-accent-blue/15 to-brand-orange/15 size-full bg-gradient-to-br" />
      )}
      {/* voice badge */}
      <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium text-ink shadow-sm">
        <Volume2 className="text-accent-blue size-3" /> Added Voice
      </span>
      {/* center play */}
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid size-11 place-items-center rounded-full bg-white/90 shadow">
          <Play className="text-ink size-4 fill-ink" />
        </span>
      </span>
      {/* controls */}
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/55 to-transparent px-2.5 pt-5 pb-2 text-white">
        <Play className="size-3.5 fill-white" />
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
          <div className="bg-accent-blue h-full w-1/3 rounded-full" />
        </div>
        <span className="text-[10px] tabular-nums">0:25 / 5:00</span>
        <Volume2 className="size-3.5" />
        <Maximize className="size-3.5" />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: VStatus }) {
  const map = {
    ready: { cls: "bg-green-50 text-brand-green", dot: "bg-brand-green", label: "Video Ready" },
    processing: { cls: "bg-brand-orange/10 text-brand-orange", dot: "bg-brand-orange", label: "Processing" },
    failed: { cls: "bg-red-50 text-red-600", dot: "bg-red-500", label: "Failed" },
  }[status];
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium", map.cls)}>
      <span className={cn("size-1.5 rounded-full", map.dot)} /> {map.label}
    </span>
  );
}

function SceneTile({ index }: { index: number }) {
  const tints = [
    "from-[#cdd6e8] to-[#aab6d0]",
    "from-[#e8e0cd] to-[#d0c4aa]",
    "from-[#cde8d8] to-[#aad0bb]",
    "from-[#e8cdd6] to-[#d0aab6]",
    "from-[#cde2e8] to-[#aac6d0]",
    "from-[#dccde8] to-[#bdaad0]",
    "from-[#e8dccd] to-[#d0bdaa]",
  ];
  return (
    <span
      className={cn("grid size-9 place-items-center rounded-md bg-gradient-to-br", tints[index % tints.length])}
    >
      <Play className="size-3 fill-white text-white/90" />
    </span>
  );
}

function ActionColumn({
  g,
  status,
  onShare,
  onWatch,
}: {
  g: VideoStatusResponse;
  status: VStatus;
  onShare: () => void;
  onWatch: () => void;
}) {
  const [downloaded, setDownloaded] = useState(false);
  const router = useRouter();

  async function handleDownload() {
    if (!g.video_url) return;
    const filename = `${(g.name || "property-video").replace(/[^\w-]+/g, "-")}.mp4`;
    const result = await saveVideoFile(g.video_url, filename);
    if (result === "saved") {
      setDownloaded(true);
      window.setTimeout(() => setDownloaded(false), 2800);
    }
  }

  if (status === "ready") {
    return (
      <>
        <Button
          onClick={onWatch}
          className="bg-brand-green hover:bg-brand-green-hover h-10 w-full rounded-lg text-sm font-semibold text-white"
        >
          <Play className="size-4 fill-white" /> Watch
        </Button>
        <OutlineBtn icon={RotateCw} onClick={() => router.push("/create-video")}>Regenerate</OutlineBtn>
        <OutlineBtn icon={Share2} onClick={onShare}>Share</OutlineBtn>
        <Button
          variant="outline"
          onClick={handleDownload}
          className="text-ink h-10 w-full rounded-lg border-black/15 text-sm font-medium"
        >
          <Download className="size-4" /> Download
        </Button>
        {downloaded && <DownloadCompleteCard onClose={() => setDownloaded(false)} />}
      </>
    );
  }
  if (status === "processing") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <ProgressRing pct={g.progress || 30} />
        <p className="text-ink-muted text-xs font-medium">Generating</p>
        <button className="text-ink mt-1 h-9 w-full rounded-lg border border-black/15 text-sm font-medium hover:bg-black/[0.03]">
          View Status
        </button>
      </div>
    );
  }
  // failed
  return (
    <div className="flex h-full items-start">
      <OutlineBtn icon={RotateCw}>Regenerate</OutlineBtn>
    </div>
  );
}

function OutlineBtn({
  icon: Icon,
  children,
  onClick,
}: {
  icon: typeof RotateCw;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-ink flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-black/15 bg-white text-sm font-medium hover:bg-black/[0.03]"
    >
      <Icon className="text-accent-blue size-4" /> {children}
    </button>
  );
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(100, Math.max(0, pct)) / 100);
  return (
    <div className="relative grid size-[68px] place-items-center">
      <svg viewBox="0 0 64 64" className="size-[68px] -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="var(--color-accent-blue)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <span className="text-ink absolute text-sm font-bold">{Math.round(pct)}%</span>
    </div>
  );
}

/* ------------------------------- sidebar -------------------------------- */

function OverviewCard({ counts }: { counts: { total: number; ready: number; processing: number; failed: number } }) {
  return (
    <section className="rounded-2xl border border-black/[0.08] bg-white p-4">
      <div className="text-ink flex items-center gap-2 text-sm font-semibold">
        <PlayCircle className="text-accent-blue size-4" /> All Video Overview
      </div>
      <div className="mt-3 grid place-items-center rounded-xl bg-black/[0.025] py-4">
        <p className="text-ink text-3xl font-bold tabular-nums">{String(counts.total).padStart(2, "0")}</p>
        <p className="text-ink-muted text-xs">All Videos</p>
      </div>
      <div className="mt-3 space-y-2.5 text-sm">
        <OverviewRow color="bg-brand-green" label="Completed" value={counts.ready} />
        <OverviewRow color="bg-brand-orange" label="Processing" value={counts.processing} />
        <OverviewRow color="bg-red-500" label="Failed" value={counts.failed} />
      </div>
    </section>
  );
}

function OverviewRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-muted flex items-center gap-2">
        <span className={cn("size-2 rounded-full", color)} /> {label}
      </span>
      <span className="text-ink font-semibold tabular-nums">{String(value).padStart(2, "0")}</span>
    </div>
  );
}

function GetNotifiedCard() {
  const [on, setOn] = useState(true);
  return (
    <section className="rounded-2xl border border-black/[0.08] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="bg-accent-blue/10 text-accent-blue grid size-8 shrink-0 place-items-center rounded-lg">
            <Bell className="size-4" />
          </span>
          <div>
            <p className="text-ink text-sm font-semibold">Get Notified</p>
            <p className="text-ink-muted mt-0.5 text-xs leading-snug">We&apos;ll notify you once your video is ready</p>
          </div>
        </div>
        <button
          onClick={() => setOn((v) => !v)}
          aria-pressed={on}
          className={cn(
            "relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors",
            on ? "bg-accent-blue" : "bg-black/15"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 size-4 rounded-full bg-white shadow transition-all",
              on ? "left-[18px]" : "left-0.5"
            )}
          />
        </button>
      </div>
    </section>
  );
}

function TipsCard() {
  const tips = [
    "Use high quality, well-lit images",
    "Add clear and specific prompts",
    "Mention key highlights like amenities, location, lifestyle",
    "Short and focused videos perform better",
  ];
  return (
    <section className="bg-accent-blue/[0.06] rounded-2xl border border-accent-blue/15 p-4">
      <div className="text-ink flex items-center gap-2 text-sm font-semibold">
        <Lightbulb className="text-accent-blue size-4" /> Tips for Better Videos
      </div>
      <ul className="mt-3 space-y-2">
        {tips.map((t) => (
          <li key={t} className="text-ink-muted flex items-start gap-2 text-xs leading-snug">
            <PlayCircle className="text-accent-blue mt-0.5 size-3.5 shrink-0" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SecureCard() {
  return (
    <section className="bg-accent-blue/[0.06] flex items-start gap-2.5 rounded-2xl border border-accent-blue/15 p-4">
      <span className="bg-accent-blue/10 text-accent-blue grid size-8 shrink-0 place-items-center rounded-lg">
        <ShieldCheck className="size-4" />
      </span>
      <div>
        <p className="text-ink text-sm font-semibold">Secure &amp; Safe</p>
        <p className="text-ink-muted mt-0.5 text-xs leading-snug">
          Your video is securely saved and available anytime in My Videos.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------- watch modal ------------------------------- */

const CONFETTI_PIECES: [string, string, string, string, string][] = [
  ["-110px", "-60px", "150px", "200deg", "#f59e0b"],
  ["110px", "-50px", "160px", "-160deg", "#2f6bed"],
  ["-70px", "-95px", "140px", "320deg", "#22c55e"],
  ["80px", "-100px", "165px", "-220deg", "#ef4444"],
  ["-130px", "10px", "130px", "180deg", "#a855f7"],
  ["130px", "0px", "155px", "-200deg", "#f59e0b"],
  ["-40px", "-115px", "145px", "260deg", "#2f6bed"],
  ["40px", "-120px", "160px", "-260deg", "#22c55e"],
  ["-95px", "-30px", "135px", "160deg", "#ef4444"],
  ["95px", "-35px", "145px", "-180deg", "#a855f7"],
];

function Confetti() {
  return (
    <span className="pointer-events-none absolute inset-0" aria-hidden>
      {CONFETTI_PIECES.map(([tx, peak, fall, r, color], i) => (
        <span
          key={i}
          className="absolute top-1/2 left-1/2 h-2.5 w-1.5 rounded-[1px]"
          style={
            {
              backgroundColor: color,
              "--tx": tx,
              "--peak-y": peak,
              "--fall-y": fall,
              "--r": r,
              animation: `confetti-pop 1200ms ease-out ${i * 25}ms both`,
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  );
}

function DownloadCompleteCard({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-black/30 p-4"
      style={{ animation: "fade-in 160ms ease-out both" }}
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-sm flex-col items-center rounded-2xl bg-white px-8 py-8 text-center shadow-2xl"
        style={{ animation: "scale-in 220ms ease-out both" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative grid size-20 place-items-center">
          <Confetti />
          <span
            className="grid size-14 place-items-center rounded-full bg-green-500 text-white"
            style={{ animation: "tick-pop 500ms cubic-bezier(0.2,0.8,0.2,1.4) both" }}
          >
            <Check className="size-8" strokeWidth={3} />
          </span>
        </div>
        <h3 className="text-ink mt-3 text-lg font-bold">Download Complete</h3>
        <p className="text-ink-muted mt-1 text-sm">The video has been downloaded successfully</p>
      </div>
    </div>
  );
}

function WatchModal({ g, onClose }: { g: VideoStatusResponse; onClose: () => void }) {
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  // Swapped to the voiced URL after Add Voice succeeds, so the player reflects
  // the narration without needing a page reload.
  const [videoUrl, setVideoUrl] = useState<string | null | undefined>(g.video_url);

  // Let the user choose where to save, then show the "Download Complete" card
  // once the file is actually saved (not if they cancel the dialog).
  async function handleDownload() {
    if (!videoUrl) return;
    const filename = `${(g.name || "property-video").replace(/[^\w-]+/g, "-")}.mp4`;
    const result = await saveVideoFile(videoUrl, filename);
    if (result === "saved") {
      setDownloaded(true);
      window.setTimeout(() => setDownloaded(false), 2800);
    }
  }

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const d = new Date(g.created_at);
  const when = isNaN(d.getTime())
    ? ""
    : d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const name = g.name || "Your Property Video";
  const sceneCount = Math.max(g.images?.length ?? 0, 8);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          className="w-full max-w-3xl"
          onClick={(e) => e.stopPropagation()}
          style={{ animation: "scale-in 200ms ease-out both" }}
        >
          {/* Preview card */}
        <div className="rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-ink text-xl font-bold">Your Property Video is Ready to Shine ✨</h2>
              <p className="text-ink-muted mt-1 text-sm">
                Preview your AI-generated video. Regenerate, download instantly or attach to listing.
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-ink-muted hover:text-ink grid size-9 shrink-0 place-items-center rounded-full bg-black/[0.04]"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-green-500 text-white">
              <Check className="size-4" strokeWidth={3} />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-green-700">Your Video is Ready</p>
              <p className="text-ink-muted truncate text-xs">
                <span className="text-ink font-medium">{name}</span> Generated successfully on {when}
              </p>
            </div>
          </div>

          <div className="relative mt-4 overflow-hidden rounded-2xl bg-black">
            {videoUrl ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video key={videoUrl} src={videoUrl} controls autoPlay className="max-h-[460px] w-full bg-black object-contain" />
            ) : (
              <div className="grid aspect-video place-items-center text-white/70">No video</div>
            )}
            <span className="pointer-events-none absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-ink shadow-sm">
              <Sparkles className="text-accent-blue size-3" /> AI Generated
            </span>
            <button
              onClick={() => setVoiceOpen(true)}
              className="text-brand-orange absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-sm hover:bg-white/90"
            >
              <span className="bg-brand-orange size-1.5 rounded-full" /> Add Voice
            </button>

            {downloaded && (
              <div className="absolute inset-0 grid place-items-center bg-black/30 p-4" style={{ animation: "fade-in 160ms ease-out both" }}>
                <div
                  className="flex w-full max-w-sm flex-col items-center rounded-2xl bg-white px-8 py-8 text-center shadow-2xl"
                  style={{ animation: "scale-in 220ms ease-out both" }}
                >
                  <div className="relative grid size-20 place-items-center">
                    <Confetti />
                    <span
                      className="grid size-14 place-items-center rounded-full bg-green-500 text-white"
                      style={{ animation: "tick-pop 500ms cubic-bezier(0.2,0.8,0.2,1.4) both" }}
                    >
                      <Check className="size-8" strokeWidth={3} />
                    </span>
                  </div>
                  <h3 className="text-ink mt-3 text-lg font-bold">Download Complete</h3>
                  <p className="text-ink-muted mt-1 text-sm">The video has been downloaded successfully</p>
                </div>
              </div>
            )}
          </div>

          <p className="text-ink mt-4 text-sm font-semibold">Video Scenes ({sceneCount})</p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {Array.from({ length: Math.min(sceneCount, 8) }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "relative grid size-16 shrink-0 place-items-center rounded-lg bg-gradient-to-br",
                  ["from-[#cdd6e8] to-[#aab6d0]", "from-[#e8e0cd] to-[#d0c4aa]", "from-[#cde8d8] to-[#aad0bb]", "from-[#e8cdd6] to-[#d0aab6]", "from-[#cde2e8] to-[#aac6d0]", "from-[#dccde8] to-[#bdaad0]"][i % 6]
                )}
              >
                <span className="absolute top-1 left-1 rounded bg-white/85 px-1 text-[10px] font-semibold text-ink">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {i === 0 && <Play className="size-4 fill-white text-white/90" />}
              </span>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-black/[0.06] pt-5">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/create-video" />}
              className="text-accent-blue h-11 rounded-lg border-black/15 px-5 text-sm font-semibold"
            >
              <RotateCw className="size-4" /> Regenerate New Video
            </Button>
            <Button
              variant="outline"
              onClick={handleDownload}
              className="text-accent-blue h-11 rounded-lg border-black/15 px-5 text-sm font-semibold"
            >
              <Download className="size-4" /> Download
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/create-video?publish=1" />}
              className="bg-brand-blue hover:bg-brand-blue-hover h-11 rounded-lg px-5 text-sm font-semibold text-white"
            >
              Scheduled &amp; Publish
              <ArrowRight className="size-4" />
            </Button>
          </div>
          </div>
        </div>

        {voiceOpen && <AddVoiceModal g={g} onVoiced={(url) => setVideoUrl(url)} onClose={() => setVoiceOpen(false)} />}
      </div>
    </div>
  );
}

/* ------------------------------ add voice modal ------------------------------ */

function AddVoiceModal({
  g,
  onClose,
  onVoiced,
}: {
  g: VideoStatusResponse;
  onClose: () => void;
  onVoiced?: (url: string) => void;
}) {
  const [tab, setTab] = useState<"record" | "upload">("record");
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audio, setAudio] = useState<{ blob: Blob; name: string; url: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AddAudioResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const audioUrlRef = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, [onClose]);

  const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const setAudioFrom = (blob: Blob, name: string) => {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    const url = URL.createObjectURL(blob);
    audioUrlRef.current = url;
    setAudio({ blob, name, url });
    setResult(null);
  };

  const startRec = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioFrom(blob, "voiceover.webm");
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      recRef.current = mr;
      setElapsed(0);
      setRecording(true);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
      // Play the video from the start so the narration can follow it; muted so
      // the video's own audio doesn't bleed into the recording.
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.muted = true;
        videoRef.current.play().catch(() => {});
      }
    } catch {
      setError("Microphone access was blocked. Allow mic access, or use Upload Audio instead.");
    }
  };
  const stopRec = () => {
    recRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    videoRef.current?.pause();
  };

  const save = async () => {
    if (!audio) return;
    setSubmitting(true);
    setError(null);
    try {
      const file = new File([audio.blob], audio.name, { type: audio.blob.type || "audio/webm" });
      const res = await api.video.addAudio(g.id, file);
      setResult(res);
      if (res.approved && res.video_url) onVoiced?.(res.video_url);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't attach the audio. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const d = new Date(g.created_at);
  const when = isNaN(d.getTime())
    ? ""
    : d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/55" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
          onClick={(e) => e.stopPropagation()}
          style={{ animation: "scale-in 200ms ease-out both" }}
        >
          {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className="bg-accent-blue/10 text-accent-blue grid size-10 shrink-0 place-items-center rounded-full">
              <Volume2 className="size-5" />
            </span>
            <div>
              <h2 className="text-ink text-lg font-bold">Add Voice Overlay</h2>
              <p className="text-ink-muted text-sm">Add voice narration to enhance your video</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-ink-muted hover:text-ink grid size-9 shrink-0 place-items-center rounded-full bg-black/[0.04]">
            <X className="size-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-black/[0.04] p-1">
          {(["record", "upload"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors",
                tab === t ? "bg-white text-accent-blue shadow-sm" : "text-ink-muted hover:text-ink"
              )}
            >
              {t === "record" ? <Mic className="size-4" /> : <Upload className="size-4" />}
              {t === "record" ? "Record Voice" : "Upload Audio"}
            </button>
          ))}
        </div>

        {/* Video info + preview */}
        <div className="mt-4 flex items-center gap-2.5">
          <span className="bg-accent-blue/10 text-accent-blue grid size-9 shrink-0 place-items-center rounded-lg">
            <PlayCircle className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-ink truncate text-sm font-semibold">{g.name || "Your Property Video"}</p>
            <p className="text-ink-muted truncate text-xs">Video Generated successfully on {when}</p>
          </div>
        </div>
        <div className="mt-3 overflow-hidden rounded-xl bg-black">
          {g.video_url ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
              ref={videoRef}
              src={g.video_url}
              controls
              onEnded={() => recording && stopRec()}
              className="max-h-[280px] w-full bg-black object-contain"
            />
          ) : (
            <div className="grid aspect-video place-items-center text-white/60">No video preview</div>
          )}
        </div>

        {/* Result, or recorder / upload */}
        {result ? (
          <div
            className={cn(
              "mt-4 rounded-xl border px-4 py-3",
              result.approved ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"
            )}
          >
            <p className={cn("flex items-center gap-2 text-sm font-semibold", result.approved ? "text-green-700" : "text-amber-700")}>
              {result.approved ? <Check className="size-4" strokeWidth={3} /> : <CircleAlert className="size-4" />}
              {result.approved ? "Voiceover attached to your video" : "Audio not approved"}
            </p>
            <p className="text-ink-muted mt-1 text-xs">{result.reason}</p>
            {result.transcript && (
              <p className="text-ink-muted mt-2 text-xs">
                <span className="text-ink font-medium">Transcript:</span> “{result.transcript}”
              </p>
            )}
            {result.mentioned_competitors?.length > 0 && (
              <p className="mt-1 text-xs text-amber-700">Mentioned competitors: {result.mentioned_competitors.join(", ")}</p>
            )}
            {result.approved && result.video_url && (
              <div className="mt-3 overflow-hidden rounded-lg bg-black">
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video key={result.video_url} src={result.video_url} controls autoPlay className="max-h-[240px] w-full bg-black object-contain" />
              </div>
            )}
            <button onClick={onClose} className="bg-brand-blue hover:bg-brand-blue-hover mt-3 h-10 w-full rounded-lg text-sm font-semibold text-white">
              Done
            </button>
          </div>
        ) : tab === "record" ? (
          <div className="border-brand-orange/40 bg-brand-orange/[0.06] mt-4 flex items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-4">
            <div className="flex items-center gap-3">
              <span className={cn("grid size-11 place-items-center rounded-full text-white", recording ? "bg-red-500 animate-pulse" : "bg-brand-orange")}>
                <Mic className="size-5" />
              </span>
              <span className="text-ink text-xl font-bold tabular-nums">{mmss(elapsed)}</span>
            </div>
            <button
              onClick={recording ? stopRec : startRec}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white",
                recording ? "bg-red-500 hover:bg-red-600" : "bg-brand-orange hover:bg-brand-orange-hover"
              )}
            >
              <Mic className="size-4" /> {recording ? "Stop Recording" : audio ? "Re-record" : "Start Recording"}
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f && f.type.startsWith("audio")) setAudioFrom(f, f.name);
              }}
              className={cn(
                "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-4 transition-colors",
                dragOver ? "border-accent-blue bg-accent-blue/[0.07]" : "border-accent-blue/30 bg-accent-blue/[0.03]"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-ink-muted grid size-11 shrink-0 place-items-center rounded-full bg-black/[0.05]">
                  <Music className="size-5" />
                </span>
                <div>
                  <p className="text-ink text-sm font-bold">Drag &amp; drop your audio file here</p>
                  <p className="text-ink-muted text-xs">Supported: MP3, WAV, M4A, AAC &middot; Max 50MB</p>
                </div>
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="text-accent-blue border-accent-blue/40 hover:bg-accent-blue/[0.06] inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border bg-white px-4 text-sm font-semibold"
              >
                <Upload className="size-4" /> Upload Audio
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setAudioFrom(f, f.name);
              }}
            />
          </div>
        )}

        {/* Recorded/selected audio preview */}
        {audio && !result && (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <audio src={audio.url} controls className="mt-3 w-full" />
        )}

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="bg-accent-blue/[0.06] mt-4 flex items-center gap-2 rounded-lg px-3 py-2.5">
          <Volume2 className="text-accent-blue size-4 shrink-0" />
          <p className="text-ink-muted text-xs">Speak clearly and follow the video for better alignment</p>
        </div>

        {audio && !result && (
          <button
            onClick={save}
            disabled={submitting}
            className="bg-brand-blue hover:bg-brand-blue-hover mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" strokeWidth={3} />}
            {submitting ? "Attaching voiceover…" : "Save Voiceover"}
          </button>
        )}
        </div>
      </div>
    </div>
  );
}
