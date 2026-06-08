"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  Clock,
  Eye,
  FileText,
  History,
  Loader2,
  MoreVertical,
  Pencil,
  Play,
  RotateCw,
  Share2,
  Trash2,
  TriangleAlert,
  Video,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListFooter } from "@/components/layout/list-footer";
import { SharePublishModal } from "@/components/property/share-modal";
import { SparkleIcon, InstagramGlyph, YoutubeGlyph, FacebookGlyph } from "./brand-glyphs";
import { cn } from "@/lib/utils";
import { api, ApiError, type VideoStatusResponse } from "@/lib/api";

type Tab = "all" | "published" | "scheduled" | "draft" | "archived";
type LibStatus = "published" | "scheduled" | "draft" | "failed";

/** Map a video-generation status to the content-library status used by the tabs. */
function libStatus(g: VideoStatusResponse): LibStatus {
  if (g.status === "completed") return "published";
  if (g.status === "failed") return "failed";
  return "draft"; // pending / images_uploaded / processing
}

/** Representative view/engagement metrics — no social-insights API yet; stable per card. */
function viewsNum(id: string): number {
  const seed = [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
  return [1890, 3204, 892, 5610, 1204, 740][seed % 6];
}
function engagementNum(id: string): number {
  const seed = [...id].reduce((a, c) => a + c.charCodeAt(0) * 7, 0);
  return [320, 540, 120, 880, 210, 95][seed % 6];
}
function sampleViews(id: string): string {
  return viewsNum(id).toLocaleString();
}

type SortKey = "newest" | "last30" | "last90" | "most_views" | "most_engagement" | "published" | "unpublished";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "last30", label: "Last 30 days" },
  { key: "last90", label: "Last 90 days" },
  { key: "most_views", label: "Most Views" },
  { key: "most_engagement", label: "Most Engagement" },
  { key: "published", label: "Published" },
  { key: "unpublished", label: "Unpublished" },
];

export function MyContent({ initialItems }: { initialItems?: VideoStatusResponse[] }) {
  const [items, setItems] = useState<VideoStatusResponse[]>(initialItems ?? []);
  const [loading, setLoading] = useState(!initialItems);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);

  useEffect(() => {
    if (initialItems) return; // server already provided the data
    let off = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.video.list({ limit: 50 });
        if (!off) setItems(res.items ?? []);
      } catch (e) {
        if (!off) setError(e instanceof ApiError ? e.message : "Failed to load content");
      } finally {
        if (!off) setLoading(false);
      }
    })();
    return () => {
      off = true;
    };
  }, [initialItems]);

  const counts = useMemo(() => {
    const c = { all: items.length, published: 0, scheduled: 0, draft: 0, archived: 0 };
    for (const g of items) {
      const s = libStatus(g);
      if (s === "published") c.published++;
      else if (s === "scheduled") c.scheduled++;
      else if (s === "draft" || s === "failed") c.draft++;
    }
    return c;
  }, [items]);

  const sorted = useMemo(() => {
    let arr = [...items];
    const now = Date.now();
    const withinDays = (g: VideoStatusResponse, days: number) => {
      const t = new Date(g.created_at).getTime();
      return !isNaN(t) && now - t <= days * 86_400_000;
    };
    // Date-range / status filters.
    if (sort === "last30") arr = arr.filter((g) => withinDays(g, 30));
    else if (sort === "last90") arr = arr.filter((g) => withinDays(g, 90));
    else if (sort === "published") arr = arr.filter((g) => libStatus(g) === "published");
    else if (sort === "unpublished") arr = arr.filter((g) => libStatus(g) !== "published");
    // Ordering.
    if (sort === "most_views") arr.sort((a, b) => viewsNum(b.id) - viewsNum(a.id));
    else if (sort === "most_engagement") arr.sort((a, b) => engagementNum(b.id) - engagementNum(a.id));
    else arr.sort((a, b) => (new Date(b.created_at).getTime() || 0) - (new Date(a.created_at).getTime() || 0));
    return arr;
  }, [items, sort]);

  const filtered = useMemo(() => {
    if (tab === "all") return sorted;
    return sorted.filter((g) => {
      const s = libStatus(g);
      if (tab === "draft") return s === "draft" || s === "failed";
      return s === tab;
    });
  }, [sorted, tab]);

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "All Content", count: counts.all },
    { key: "published", label: "Published", count: counts.published },
    { key: "scheduled", label: "Scheduled", count: counts.scheduled },
    { key: "draft", label: "Draft", count: counts.draft },
    { key: "archived", label: "Archived", count: counts.archived },
  ];
  const activeLabel = TABS.find((t) => t.key === tab)?.label ?? "All Content";

  const totalPages = Math.max(1, Math.ceil(filtered.length / rows));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * rows, safePage * rows);

  const clearAll = () => {
    setTab("all");
    setSort("newest");
    setPage(1);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-ink text-2xl font-bold">My Content</h1>
            <p className="text-ink-muted text-sm">Manage, edit, and track all your published content</p>
          </div>
          <Button
            nativeButton={false}
            render={<Link href="/create-video" />}
            className="bg-brand-blue hover:bg-brand-blue-hover h-10 rounded-lg px-4 text-sm font-semibold text-white"
          >
            <SparkleIcon className="size-4" />
            Create Video & Content
          </Button>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex flex-wrap items-center gap-6 border-b border-black/[0.07]">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
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
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-xs font-semibold",
                    active ? "bg-accent-blue/10 text-accent-blue" : "bg-black/[0.06] text-ink-muted"
                  )}
                >
                  {String(t.count).padStart(2, "0")}
                </span>
                {active && <span className="bg-accent-blue absolute inset-x-0 -bottom-px h-0.5 rounded-full" />}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="grid flex-1 place-items-center px-4 py-16 sm:px-6 lg:px-8">
          <Loader2 className="text-accent-blue size-6 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-16 text-center sm:px-6 lg:px-8">
          <TriangleAlert className="size-8 text-red-500" />
          <p className="text-ink font-semibold">Couldn&apos;t load content</p>
          <p className="text-ink-muted text-sm">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center sm:px-6 lg:px-8">
          <span className="bg-accent-blue/10 text-accent-blue grid size-14 place-items-center rounded-2xl">
            <Play className="size-7" />
          </span>
          <p className="text-ink font-semibold">No content yet</p>
          <p className="text-ink-muted max-w-sm text-sm">Generate your first video to see it here.</p>
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
          {/* Sub-header: heading + count + Clear All + sort */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-5 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2.5">
              <span className="bg-accent-blue/10 text-accent-blue grid size-9 place-items-center rounded-lg">
                <Video className="size-5" />
              </span>
              <div>
                <p className="text-ink font-bold">{activeLabel === "All Content" ? "All Contents" : activeLabel}</p>
                <p className="text-ink-muted text-xs">Showing {filtered.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={clearAll}
                className="text-ink-muted hover:text-ink flex items-center gap-1.5 text-sm font-medium"
              >
                Clear All <RotateCw className="size-4" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setSortOpen((o) => !o)}
                  onBlur={() => setTimeout(() => setSortOpen(false), 150)}
                  className="text-ink flex h-9 items-center gap-2 rounded-lg border border-black/15 bg-white px-3 text-sm font-medium"
                >
                  {SORT_OPTIONS.find((o) => o.key === sort)?.label ?? "Newest"} <ChevronDown className="text-ink-muted size-4" />
                </button>
                {sortOpen && (
                  <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-black/10 bg-white py-1 shadow-lg">
                    {SORT_OPTIONS.map((o) => (
                      <button
                        key={o.key}
                        onMouseDown={() => {
                          setSort(o.key);
                          setSortOpen(false);
                          setPage(1);
                        }}
                        className="hover:bg-accent-blue/[0.06] flex w-full items-center justify-between px-3 py-2 text-left text-sm"
                      >
                        <span className="text-ink">{o.label}</span>
                        {sort === o.key && <Check className="text-accent-blue size-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 px-4 pt-4 pb-4 sm:grid-cols-2 sm:px-6 lg:px-8 2xl:grid-cols-3">
            {visible.map((g) => (
              <ContentCard
                key={g.id}
                g={g}
                onDeleted={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
              />
            ))}
          </div>
          <ListFooter
            showing={visible.length}
            total={filtered.length}
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
    </div>
  );
}

function ContentCard({ g, onDeleted }: { g: VideoStatusResponse; onDeleted?: (id: string) => void }) {
  const status = libStatus(g);
  const router = useRouter();
  const [playing, setPlaying] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setMenuOpen(false);
    setDeleting(true);
    try {
      await api.video.delete(g.id);
      onDeleted?.(g.id);
    } catch {
      setDeleting(false);
    }
  }
  const date = new Date(g.created_at);
  const dateStr = isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const views = sampleViews(g.id);

  return (
    <article className={cn("bg-surface flex flex-col overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/[0.06] transition-opacity", deleting && "pointer-events-none opacity-50")}>
      {/* Thumbnail — a div (not a button) so the "More options" button and its
          menu can nest inside without producing invalid <button> nesting. */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => g.video_url && setPlaying(true)}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && g.video_url) {
            e.preventDefault();
            setPlaying(true);
          }
        }}
        className="from-accent-blue/12 to-brand-orange/12 relative aspect-[16/10] w-full cursor-pointer overflow-hidden bg-gradient-to-br text-left"
      >
        {g.video_url ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={g.video_url} muted preload="metadata" className="size-full object-contain" />
        ) : (
          <div className="grid size-full place-items-center">
            <Play className="text-ink-muted size-8" />
          </div>
        )}
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-ink shadow-sm">
          <SparkleIcon className="text-accent-blue size-3" /> AI Generated
        </span>
        <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            aria-label="More options"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
            onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
            className="text-ink-muted hover:text-ink grid size-7 place-items-center rounded-full bg-white/90 shadow-sm"
          >
            <MoreVertical className="size-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-black/10 bg-white py-1 shadow-lg">
              {status === "published" && (
                <button
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    router.push("/create-video?publish=1");
                  }}
                  className="text-ink hover:bg-black/[0.04] flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
                >
                  <RotateCw className="size-4" /> Re-schedule
                </button>
              )}
              <button
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50"
              >
                <Trash2 className="size-4" /> Delete
              </button>
            </div>
          )}
        </div>
        {g.video_url && (
          <span className="absolute top-1/2 left-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/85 shadow">
            <Play className="text-ink size-4 fill-ink" />
          </span>
        )}
        <span className="absolute right-3 bottom-3 rounded-md bg-black/55 px-2 py-0.5 text-xs font-medium text-white">01:00</span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <StatusPill status={status} />
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Edit"
              onClick={() => router.push("/create-video")}
              className="text-ink-muted hover:text-ink grid size-8 place-items-center rounded-lg"
            >
              <Pencil className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Share"
              onClick={() => setShareOpen(true)}
              className="text-ink-muted hover:text-ink grid size-8 place-items-center rounded-lg"
            >
              <Share2 className="size-4" />
            </button>
          </div>
        </div>

        <p className="text-ink mt-2 truncate text-[15px] font-semibold">{g.name || "Untitled video"}</p>

        {status === "published" ? (
          <>
            <p className="text-ink-muted mt-1 flex items-center gap-1.5 text-xs">
              <History className="size-3.5" /> {dateStr} · Published
            </p>
            <div className="mt-auto flex items-center gap-2.5 border-t border-black/[0.06] pt-3">
              <InstagramGlyph className="size-[18px]" />
              <YoutubeGlyph className="size-[18px]" />
              <FacebookGlyph className="size-[18px]" />
              <span className="text-ink-muted ml-auto flex items-center gap-1 text-xs">
                <Eye className="size-4" /> {views} views
              </span>
            </div>
          </>
        ) : status === "scheduled" ? (
          <>
            <div className="text-ink-muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" /> Date: <span className="text-ink font-medium">{dateStr}</span>
              </span>
            </div>
            <div className="mt-auto flex items-center gap-2.5 border-t border-black/[0.06] pt-3">
              <InstagramGlyph className="size-[18px]" />
              <FacebookGlyph className="size-[18px]" />
            </div>
          </>
        ) : status === "draft" ? (
          <>
            <p className="text-ink-muted mt-1 flex items-center gap-1.5 text-xs">
              <FileText className="size-3.5" /> Not Published
            </p>
            <Button
              nativeButton={false}
              render={<Link href="/create-video?publish=1" />}
              className="bg-brand-blue hover:bg-brand-blue-hover mt-auto h-10 w-full rounded-lg text-sm font-semibold text-white"
            >
              Schedule &amp; Published
            </Button>
          </>
        ) : (
          <div className="mt-auto border-t border-black/[0.06] pt-3">
            <p className="text-sm font-medium text-red-500">Generation failed</p>
          </div>
        )}
      </div>

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

      {shareOpen && (
        <SharePublishModal
          heading="Share Content"
          shareLabel="Share content"
          showVideo
          showPublish={false}
          target={{
            title: g.name || "Untitled video",
            videoReady: status === "published",
            videoUrl: g.video_url,
            url: g.video_url ?? (typeof window !== "undefined" ? window.location.origin + "/my-content" : ""),
          }}
          onClose={() => setShareOpen(false)}
        />
      )}
    </article>
  );
}

function StatusPill({ status }: { status: LibStatus }) {
  const map = {
    published: { cls: "text-green-700 bg-green-50", label: "Published", Icon: Check },
    scheduled: { cls: "text-brand-orange bg-brand-orange/10", label: "Scheduled", Icon: Clock },
    draft: { cls: "text-ink-muted bg-black/[0.05]", label: "Draft — not published", Icon: FileText },
    failed: { cls: "text-red-600 bg-red-50", label: "Failed", Icon: TriangleAlert },
  }[status];
  const Icon = map.Icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium", map.cls)}>
      <Icon className="size-3" strokeWidth={status === "published" ? 3 : 2} /> {map.label}
    </span>
  );
}
