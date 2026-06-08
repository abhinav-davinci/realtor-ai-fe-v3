"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  Flame,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  PartyPopper,
  Play,
  Settings,
  ThumbsUp,
  Video,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api, type NotificationItem } from "@/lib/api";

type IconDef = {
  Icon: React.ComponentType<{ className?: string }>;
  tint: string; // bg + text tint for the icon chip
  action?: string; // inline blue link label
  thumb?: boolean; // show right-side content thumbnail
};

/** Map a notification type to its icon, accent, and trailing action link. */
function iconFor(type: string): IconDef {
  const t = type.toLowerCase();
  if (t.includes("publish")) return { Icon: PartyPopper, tint: "bg-green-50 text-brand-green", thumb: true };
  if (t.includes("image") || t.includes("upload")) return { Icon: ImageIcon, tint: "bg-violet-50 text-violet-500" };
  if (t.includes("video") || t.includes("ready")) return { Icon: Video, tint: "bg-accent-blue/10 text-accent-blue", action: "view", thumb: true };
  if (t.includes("lead")) return { Icon: Flame, tint: "bg-brand-orange/10 text-brand-orange" };
  if (t.includes("like") || t.includes("engagement")) return { Icon: ThumbsUp, tint: "bg-rose-50 text-rose-500", action: "View Post", thumb: true };
  if (t.includes("comment")) return { Icon: MessageCircle, tint: "bg-accent-blue/10 text-accent-blue", action: "Reply Now", thumb: true };
  return { Icon: Bell, tint: "bg-black/[0.05] text-ink-muted" };
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "";
  const secs = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (secs < 45) return "Just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.notifications.list({ limit: 30 });
      setItems(res.notifications ?? []);
      setUnread(res.unread_count ?? 0);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial unread badge (no panel needed).
  useEffect(() => {
    api.notifications
      .unreadCount()
      .then((r) => setUnread(r.unread_count ?? 0))
      .catch(() => {});
  }, []);

  // Load list whenever the panel opens; lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    load();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, load]);

  const markAll = async () => {
    setItems((p) => p.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
    try {
      await api.notifications.markAllRead();
    } catch {
      /* ignore */
    }
  };

  const markOne = async (id: string) => {
    setItems((p) => p.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
    try {
      await api.notifications.markRead(id);
    } catch {
      /* ignore */
    }
  };

  const filtered = tab === "unread" ? items.filter((n) => !n.is_read) : items;

  return (
    <>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen(true)}
        className="text-ink-muted hover:text-ink relative transition-colors"
      >
        <Bell className="size-[22px]" strokeWidth={1.75} />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <button
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/20"
            style={{ animation: "fade-in 180ms ease-out both" }}
          />
          {/* Panel */}
          <aside
            className="absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col bg-white shadow-2xl"
            style={{ animation: "slide-in-right 260ms cubic-bezier(0.22,1,0.36,1) both" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-black/[0.07] px-5 py-4">
              <div className="flex items-center gap-2">
                <h2 className="text-ink text-lg font-bold">Notifications</h2>
                <button aria-label="Notification settings" className="text-ink-muted hover:text-ink">
                  <Settings className="size-4" />
                </button>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={markAll} className="text-accent-blue text-sm font-medium hover:underline">
                  Mark all as read
                </button>
                <button aria-label="Close" onClick={() => setOpen(false)} className="text-ink-muted hover:text-ink">
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-black/[0.07] px-5">
              {(["all", "unread"] as const).map((t) => {
                const active = tab === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      "relative flex items-center gap-2 py-3 text-sm font-semibold capitalize transition-colors",
                      active ? "text-ink" : "text-ink-muted hover:text-ink"
                    )}
                  >
                    {t}
                    {t === "unread" && unread > 0 && (
                      <span className="grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                        {unread}
                      </span>
                    )}
                    {active && <span className="bg-accent-blue absolute inset-x-0 -bottom-px h-0.5 rounded-full" />}
                  </button>
                );
              })}
            </div>

            {/* List */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading ? (
                <div className="grid place-items-center py-20">
                  <Loader2 className="text-accent-blue size-6 animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
                  <span className="bg-black/[0.04] text-ink-muted grid size-12 place-items-center rounded-full">
                    <Bell className="size-5" />
                  </span>
                  <p className="text-ink font-semibold">You&apos;re all caught up</p>
                  <p className="text-ink-muted text-sm">
                    {tab === "unread" ? "No unread notifications." : "No notifications yet."}
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-ink-muted px-5 pt-4 pb-1 text-xs font-semibold">Today</p>
                  <ul>
                    {filtered.map((n) => (
                      <NotificationRow key={n.id} n={n} onClick={() => !n.is_read && markOne(n.id)} />
                    ))}
                  </ul>
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function NotificationRow({ n, onClick }: { n: NotificationItem; onClick: () => void }) {
  const { Icon, tint, action, thumb } = iconFor(n.type);
  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          "flex w-full items-start gap-3 border-b border-black/[0.05] px-5 py-3.5 text-left transition-colors hover:bg-black/[0.02]",
          !n.is_read && "bg-accent-blue/[0.04]"
        )}
      >
        <span className={cn("relative grid size-9 shrink-0 place-items-center rounded-full", tint)}>
          <Icon className="size-[18px]" />
          {!n.is_read && <span className="bg-accent-blue absolute -top-0.5 -left-0.5 size-2 rounded-full ring-2 ring-white" />}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-ink text-sm font-semibold leading-snug">{n.title}</p>
          {n.body && (
            <p className="text-ink-muted mt-0.5 text-xs leading-relaxed">
              {n.body}
              {action && <span className="text-accent-blue font-medium">…{action}</span>}
            </p>
          )}
          <p className="text-ink-muted mt-1 text-[11px]">{timeAgo(n.created_at)}</p>
        </div>

        {thumb && (
          <span className="from-accent-blue/15 to-brand-orange/15 relative grid h-11 w-14 shrink-0 place-items-center overflow-hidden rounded-md bg-gradient-to-br">
            <Play className="text-ink/70 size-4 fill-white" />
          </span>
        )}
      </button>
    </li>
  );
}
