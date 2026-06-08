"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, MessageSquare, MoreVertical, RotateCw, Search, ThumbsUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FacebookGlyph, InstagramGlyph, YoutubeGlyph } from "./brand-glyphs";

type Platform = "youtube" | "instagram" | "facebook";

interface Reply {
  name: string;
  avatar: string;
  ago: string;
  text: string;
  likes: number;
}
interface Comment {
  id: number;
  name: string;
  avatar: string;
  ago: string;
  platform: Platform;
  hot?: boolean;
  text: string;
  likes: number;
  unread?: boolean;
  flagged?: boolean;
  replies: Reply[];
}

const PLATFORM: Record<Platform, { glyph: React.ComponentType<{ className?: string }>; label: string }> = {
  youtube: { glyph: YoutubeGlyph, label: "YouTube" },
  instagram: { glyph: InstagramGlyph, label: "Instagram" },
  facebook: { glyph: FacebookGlyph, label: "Facebook" },
};

const A1 = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&q=80";
const A2 = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=64&q=80";
const A3 = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=64&q=80";

// Representative comments — there is no aggregated cross-platform comments API yet.
const COMMENTS: Comment[] = [
  { id: 1, name: "Sayali Gujarathi", avatar: A1, ago: "2 hours ago", platform: "youtube", hot: true, unread: true, likes: 23, text: "Beautiful property! What is the availability? I am interested in scheduling a visit.", replies: [] },
  { id: 2, name: "Prasoon Mishra", avatar: A2, ago: "2 hours ago", platform: "instagram", unread: true, likes: 23, text: "This property looks amazing! Is it still available for rent?", replies: [{ name: "Sameer Raut", avatar: A3, ago: "2 hours ago", text: "Yes, it's available! Let us know if you'd like to schedule a visit.", likes: 23 }] },
  { id: 3, name: "Sayali Gujarathi", avatar: A1, ago: "2 hours ago", platform: "facebook", hot: true, likes: 23, text: "Beautiful property! What is the availability? I am interested in scheduling a visit.", replies: [] },
  { id: 4, name: "Rohan Kulkarni", avatar: A2, ago: "3 hours ago", platform: "instagram", unread: true, likes: 12, text: "Loved the interiors. Can you share the carpet area and the floor?", replies: [] },
  { id: 5, name: "Aditi Sharma", avatar: A1, ago: "5 hours ago", platform: "youtube", likes: 8, text: "Is parking included? And how far is the nearest metro station?", replies: [{ name: "Sameer Raut", avatar: A3, ago: "4 hours ago", text: "Two covered parkings are included. Metro is a 5-min drive.", likes: 5 }] },
  { id: 6, name: "Vikram Patel", avatar: A2, ago: "1 day ago", platform: "facebook", flagged: true, likes: 2, text: "Price seems a bit high for this locality. Any room to negotiate?", replies: [] },
];

export function RecentComments({ propertyTitle, onClose }: { propertyTitle: string; onClose: () => void }) {
  const [tab, setTab] = useState<"all" | "unread" | "replied" | "flagged">("all");
  const [query, setQuery] = useState("");

  // Lock scroll + close on Escape.
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

  const unreadCount = COMMENTS.filter((c) => c.unread).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COMMENTS.filter((c) => {
      if (tab === "unread" && !c.unread) return false;
      if (tab === "replied" && c.replies.length === 0) return false;
      if (tab === "flagged" && !c.flagged) return false;
      if (q && !(c.text.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [tab, query]);

  const TABS = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread", badge: unreadCount },
    { key: "replied", label: "Replied" },
    { key: "flagged", label: "Flagged" },
  ] as const;

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close comments"
        onClick={onClose}
        className="absolute inset-0 bg-black/20"
        style={{ animation: "fade-in 180ms ease-out both" }}
      />
      <aside
        className="absolute inset-y-0 right-0 flex w-full max-w-[600px] flex-col bg-white shadow-2xl"
        style={{ animation: "slide-in-right 260ms cubic-bezier(0.22,1,0.36,1) both" }}
      >
        {/* Header */}
        <div className="shrink-0 px-6 pt-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="bg-accent-blue/10 text-accent-blue grid size-8 place-items-center rounded-lg">
                <MessageSquare className="size-4" />
              </span>
              <h2 className="text-ink text-xl font-bold">Recent Comments</h2>
            </div>
            <button aria-label="Close" onClick={onClose} className="text-ink-muted hover:text-ink">
              <X className="size-5" />
            </button>
          </div>

          <p className="text-ink mt-4 font-semibold">{propertyTitle}</p>
          <p className="text-ink-muted mt-0.5 flex items-center gap-1.5 text-xs">
            <Clock className="size-3.5" /> May 18, 2026 · Published
          </p>

          {/* Search */}
          <div className="mt-4 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="text-ink-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search comment, name..."
                className="text-ink placeholder:text-ink-muted/60 focus:border-accent-blue/50 h-11 w-full rounded-lg border border-black/15 bg-white pl-9 text-sm outline-none"
              />
            </div>
            <button onClick={() => setQuery("")} className="text-accent-blue flex shrink-0 items-center gap-1.5 text-sm font-medium">
              Clear All <RotateCw className="size-3.5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex items-center gap-2">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                    active ? "bg-accent-blue text-white" : "text-ink-muted border border-black/10 hover:bg-black/[0.03]"
                  )}
                >
                  {t.label}
                  {"badge" in t && t.badge ? (
                    <span className={cn("rounded-full px-1.5 text-[11px] font-semibold", active ? "bg-white/25" : "bg-red-500 text-white")}>
                      {t.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <p className="text-ink-muted mt-3 text-sm">Showing {filtered.length} comments</p>
        </div>

        {/* List */}
        <div className="mt-2 min-h-0 flex-1 overflow-y-auto px-6 pb-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
              <MessageSquare className="text-ink-muted size-7" />
              <p className="text-ink font-semibold">No comments</p>
              <p className="text-ink-muted text-sm">Nothing matches this filter yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-black/[0.06]">
              {filtered.map((c) => (
                <CommentRow key={c.id} c={c} />
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}

function CommentRow({ c }: { c: Comment }) {
  const { glyph: Glyph, label } = PLATFORM[c.platform];
  return (
    <li className={cn("py-4", c.unread && "bg-accent-blue/[0.03]")}>
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.avatar} alt={c.name} className="size-9 shrink-0 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-ink text-sm font-semibold">{c.name}</p>
              <p className="text-ink-muted flex items-center gap-1.5 text-xs">
                {c.ago} · <Glyph className="size-3.5" /> {label}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {c.hot && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-600">Hot</span>}
              <button aria-label="More" className="text-ink-muted hover:text-ink">
                <MoreVertical className="size-4" />
              </button>
            </div>
          </div>
          <p className="text-ink mt-1.5 text-sm leading-relaxed">{c.text}</p>
          <CommentActions likes={c.likes} replies={c.replies.length} />

          {c.replies.map((r, i) => (
            <div key={i} className="bg-accent-blue/[0.04] mt-3 rounded-xl p-3">
              <div className="flex items-start gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.avatar} alt={r.name} className="size-8 shrink-0 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-ink text-sm font-semibold">{r.name}</p>
                  <p className="text-ink-muted text-xs">{r.ago}</p>
                  <p className="text-ink mt-1.5 text-sm leading-relaxed">{r.text}</p>
                  <CommentActions likes={r.likes} replies={0} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </li>
  );
}

function CommentActions({ likes, replies }: { likes: number; replies: number }) {
  return (
    <div className="text-ink-muted mt-2 flex items-center gap-3 text-xs">
      <span className="flex items-center gap-1">
        Like · <ThumbsUp className="size-3.5" /> {likes}
      </span>
      <span className="text-black/15">|</span>
      <button className="text-accent-blue font-medium hover:underline">Reply</button>
      {replies > 0 && <span className="text-ink-muted">· {replies} Replies</span>}
    </div>
  );
}
