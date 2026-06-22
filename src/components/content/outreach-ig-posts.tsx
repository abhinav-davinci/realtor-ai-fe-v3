"use client";

/**
 * Instagram "Posts" tab: a gallery of everything published or scheduled from
 * the studio. Reads the local store (seeded on first open), filters by type /
 * status, and supports delete. Frontend-only.
 */
import { useEffect, useState } from "react";
import {
  Calendar,
  Clapperboard,
  Heart,
  Image as ImageIcon,
  Images,
  MessageCircle,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  deleteIgPost,
  listIgPosts,
  seedIgPosts,
  type IgPost,
  type IgPostKind,
  type TabKey,
} from "@/lib/outreach";
import { ConfirmDialog, EASE_OUT } from "./outreach-shared";
import { InstagramGlyph } from "./brand-glyphs";

type Filter = "all" | "reel" | "photo" | "scheduled";

const KIND_META: Record<IgPostKind, { icon: typeof ImageIcon; label: string }> = {
  reel: { icon: Clapperboard, label: "Reel" },
  photo: { icon: ImageIcon, label: "Photo" },
  carousel: { icon: Images, label: "Carousel" },
};

/** 24300 -> "24.3K". */
function compact(n: number): string {
  if (n >= 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString("en-IN");
}

function relTime(at: number, now: number): string {
  const diff = at - now;
  const ahead = diff > 0;
  const d = Math.abs(diff);
  const day = 86_400_000;
  const hr = 3_600_000;
  let label: string;
  if (d < hr) label = `${Math.max(1, Math.round(d / 60_000))}m`;
  else if (d < day) label = `${Math.round(d / hr)}h`;
  else label = `${Math.round(d / day)}d`;
  return ahead ? `in ${label}` : `${label} ago`;
}

export function InstagramPosts({ onNavigate }: { onNavigate: (t: TabKey) => void }) {
  const [posts, setPosts] = useState<IgPost[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  // Stamped once on mount (Date.now() is impure, so keep it out of render).
  const [now, setNow] = useState(0);

  useEffect(() => {
    seedIgPosts();
    /* eslint-disable react-hooks/set-state-in-effect */
    setNow(Date.now());
    setPosts(listIgPosts());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function refresh() {
    setPosts(listIgPosts());
  }

  const counts = {
    all: posts.length,
    reel: posts.filter((p) => p.kind === "reel").length,
    photo: posts.filter((p) => p.kind === "photo" || p.kind === "carousel").length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
  };

  const visible = posts.filter((p) => {
    if (filter === "all") return true;
    if (filter === "reel") return p.kind === "reel";
    if (filter === "photo") return p.kind === "photo" || p.kind === "carousel";
    return p.status === "scheduled";
  });

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "reel", label: "Reels" },
    { key: "photo", label: "Photos" },
    { key: "scheduled", label: "Scheduled" },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* filter toolbar */}
      <div className="mb-4 flex shrink-0 flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                active ? "border-accent-blue bg-accent-blue/[0.06] text-accent-blue" : "text-ink-muted hover:text-ink border-black/12"
              )}
            >
              {f.label}
              <span className={cn("rounded-full px-1.5 text-[11px] font-semibold tabular-nums", active ? "bg-accent-blue/15" : "bg-black/[0.05]")}>
                {counts[f.key]}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onNavigate("compose")}
          className="bg-brand-blue hover:bg-brand-blue-hover ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-sm font-semibold text-white transition-colors active:scale-[0.98]"
        >
          <Plus className="size-4" />
          New Post
        </button>
      </div>

      {visible.length === 0 ? (
        <EmptyState onCompose={() => onNavigate("compose")} filtered={posts.length > 0} />
      ) : (
        <div className="grid min-h-0 flex-1 auto-rows-max grid-cols-2 gap-4 overflow-y-auto pb-2 sm:grid-cols-3 xl:grid-cols-4">
          {visible.map((p) => (
            <PostCard key={p.id} post={p} now={now} onDelete={() => setConfirmId(p.id)} />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmId !== null}
        title="Delete this post?"
        message="It will be removed from your studio. Anything already live on Instagram is not affected."
        confirmLabel="Delete"
        onConfirm={() => {
          if (confirmId) deleteIgPost(confirmId);
          setConfirmId(null);
          refresh();
        }}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}

function PostCard({ post, now, onDelete }: { post: IgPost; now: number; onDelete: () => void }) {
  const meta = KIND_META[post.kind];
  const Icon = meta.icon;
  const cover = post.media[0] ?? null;
  const scheduled = post.status === "scheduled";
  return (
    <article
      className="group bg-white relative flex flex-col overflow-hidden rounded-2xl border border-black/[0.07] shadow-sm"
      style={{ animation: `fade-in-up 220ms ${EASE_OUT} both` }}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-black/[0.04]">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        ) : (
          <div className="grid size-full place-items-center text-ink-muted/40">
            <Icon className="size-8" />
          </div>
        )}

        {/* kind badge */}
        <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
          <Icon className="size-3" />
          {meta.label}
        </span>

        {post.kind === "reel" && cover && (
          <span className="absolute top-1/2 left-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/35 ring-1 ring-white/30 backdrop-blur-sm">
            <Play className="size-4 fill-white text-white" />
          </span>
        )}

        {/* status / stats footer */}
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/65 to-transparent px-2.5 pt-6 pb-2 text-[11px] font-medium text-white">
          {scheduled ? (
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3" />
              {relTime(post.at, now)}
            </span>
          ) : (
            <>
              {post.views !== undefined && (
                <span className="inline-flex items-center gap-1">
                  <Play className="size-3 fill-white" />
                  {compact(post.views)}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Heart className="size-3" />
                {compact(post.likes)}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="size-3" />
                {compact(post.comments)}
              </span>
            </>
          )}
        </div>

        {/* delete on hover */}
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete post"
          className="text-ink hover:text-red-500 absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-white/90 opacity-0 shadow-sm transition-all group-hover:opacity-100 hover:bg-white active:scale-95"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <p className="text-ink line-clamp-2 text-[13px] leading-snug">
          {post.caption.trim() || <span className="text-ink-muted/60 italic">No caption</span>}
        </p>
        <div className="mt-2 flex items-center gap-1.5 pt-0.5">
          <InstagramGlyph className="size-3.5" />
          <span className="text-ink-muted truncate text-[11px]">{post.account}</span>
          <span
            className={cn(
              "ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold",
              scheduled ? "bg-gold/30 text-gold-foreground" : "bg-brand-green/10 text-brand-green"
            )}
          >
            {scheduled ? "Scheduled" : "Published"}
          </span>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ onCompose, filtered }: { onCompose: () => void; filtered: boolean }) {
  return (
    <div
      className="grid flex-1 place-items-center rounded-2xl border border-dashed border-black/[0.12] bg-cream/40 p-10 text-center"
      style={{ animation: `fade-in 220ms ${EASE_OUT} both` }}
    >
      <div className="max-w-sm">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-white shadow-sm ring-1 ring-black/[0.05]">
          <InstagramGlyph className="size-9" />
        </span>
        <h3 className="text-ink mt-4 text-lg font-bold">{filtered ? "Nothing here yet" : "No posts yet"}</h3>
        <p className="text-ink-muted mt-1 text-sm">
          {filtered ? "Try a different filter, or compose something new." : "Compose your first reel or photo post to see it here."}
        </p>
        <button
          type="button"
          onClick={onCompose}
          className="bg-brand-blue hover:bg-brand-blue-hover mt-5 inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold text-white transition-colors active:scale-[0.99]"
        >
          <Plus className="size-4" />
          Compose a post
        </button>
      </div>
    </div>
  );
}
