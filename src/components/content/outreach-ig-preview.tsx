"use client";

/**
 * Hyperrealistic Instagram phone mockup for the publishing studio. Renders two
 * surfaces from the same props: a full-bleed Reel and a feed Post / Carousel.
 * Everything updates live as the composer changes the media, caption, or
 * account. Dark theme to match Instagram's reels + modern feed.
 */
import { useState } from "react";
import {
  BatteryFull,
  Bookmark,
  Camera,
  Heart,
  Home,
  Image as ImageIcon,
  MessageCircle,
  MoreHorizontal,
  Music2,
  Play,
  PlusSquare,
  Search,
  Send,
  Signal,
  User,
  Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InstagramGlyph } from "./brand-glyphs";

export type IgPreviewKind = "reel" | "photo";

/** 1840 -> "1,840"; 24300 -> "24.3K". */
function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString("en-IN");
}

/** Gradient-ringed account avatar, like Instagram's story ring. */
function Avatar({ className }: { className?: string }) {
  return (
    <span
      className={cn("grid place-items-center rounded-full p-[1.5px]", className)}
      style={{ background: "linear-gradient(45deg,#FEDA75,#FA7E1E,#D62976,#962FBF,#4F5BD5)" }}
    >
      <span className="grid size-full place-items-center rounded-full bg-black p-[1.5px]">
        <span className="grid size-full place-items-center rounded-full bg-white">
          <InstagramGlyph className="size-2/3" />
        </span>
      </span>
    </span>
  );
}

/**
 * The phone hardware: bezel, dynamic island, hardware keys. Fills the height of
 * its parent so the composer can size it to the available column (the parent
 * clamps min/max), which keeps the whole phone on screen without page scroll.
 */
function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto flex h-full w-[344px] flex-col">
      <span aria-hidden className="bg-ink/70 absolute top-[120px] -left-[2px] h-7 w-[3px] rounded-l" />
      <span aria-hidden className="bg-ink/70 absolute top-[164px] -left-[2px] h-12 w-[3px] rounded-l" />
      <span aria-hidden className="bg-ink/70 absolute top-[140px] -right-[2px] h-16 w-[3px] rounded-r" />
      <div className="bg-ink flex min-h-0 flex-1 flex-col rounded-[2.9rem] p-2.5 shadow-2xl shadow-black/30 ring-1 ring-white/10">
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2.4rem] bg-black">
          {/* dynamic island */}
          <div className="absolute top-2 left-1/2 z-30 h-[22px] w-24 -translate-x-1/2 rounded-full bg-black" />
          {children}
        </div>
      </div>
    </div>
  );
}

function StatusBar({ className }: { className?: string }) {
  return (
    <div className={cn("flex shrink-0 items-center justify-between px-5 pt-2.5 pb-1 text-[11px] font-medium text-white", className)}>
      <span className="tabular-nums">9:41</span>
      <span className="flex items-center gap-1.5">
        <Signal className="size-3" />
        <Wifi className="size-3" />
        <BatteryFull className="size-3.5" />
      </span>
    </div>
  );
}

/** Bottom tab bar. `active` brightens the matching icon. */
function BottomNav({ active }: { active: "home" | "reels" }) {
  return (
    <div className="z-20 flex shrink-0 items-center justify-around border-t border-white/10 bg-black px-4 py-2.5">
      <Home className={cn("size-5", active === "home" ? "fill-white text-white" : "text-white/80")} />
      <Search className="size-5 text-white/80" />
      <PlusSquare className="size-5 text-white/80" />
      <Camera className={cn("size-5", active === "reels" ? "text-white" : "text-white/80")} />
      <span className="grid size-5 place-items-center rounded-full bg-white/15 ring-1 ring-white/40">
        <User className="size-3 text-white" />
      </span>
    </div>
  );
}

export function IgPreview({
  kind,
  media,
  hasVideo = false,
  caption,
  account,
  likes = 0,
  comments = 0,
}: {
  kind: IgPreviewKind;
  /** Slide image urls. For a reel only the first is used (the cover). */
  media: string[];
  /** Reel: show the play affordance over the cover. */
  hasVideo?: boolean;
  caption: string;
  account: string;
  likes?: number;
  comments?: number;
}) {
  return <PhoneShell>{kind === "reel" ? (
    <ReelView media={media} hasVideo={hasVideo} caption={caption} account={account} likes={likes} comments={comments} />
  ) : (
    <PostView media={media} caption={caption} account={account} likes={likes} comments={comments} />
  )}</PhoneShell>;
}

/* --------------------------------- reel ----------------------------------- */

function ReelView({
  media,
  hasVideo,
  caption,
  account,
  likes,
  comments,
}: {
  media: string[];
  hasVideo: boolean;
  caption: string;
  account: string;
  likes: number;
  comments: number;
}) {
  const cover = media[0] ?? null;
  const handle = account.replace(/^@/, "");
  return (
    <div className="relative flex-1">
      {/* cover / empty */}
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" className="absolute inset-0 size-full object-cover" />
      ) : hasVideo ? (
        // a video is chosen but has no cover frame (e.g. a custom URL)
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-black/40" />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-b from-white/[0.06] to-transparent">
          <div className="flex flex-col items-center gap-2 text-white/55">
            <Camera className="size-9" />
            <span className="text-sm">Select a video</span>
          </div>
        </div>
      )}
      {/* legibility gradients */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/55 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-black/70 to-transparent" />

      {/* foreground chrome */}
      <div className="absolute inset-0 flex flex-col">
        <StatusBar />
        <div className="flex shrink-0 items-center justify-between px-4 pt-1.5 text-white">
          <span className="text-base font-bold drop-shadow">Reels</span>
          <Camera className="size-5 drop-shadow" />
        </div>

        <div className="relative flex-1">
          {cover && hasVideo && (
            <span className="absolute top-1/2 left-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/35 ring-1 ring-white/30 backdrop-blur-sm">
              <Play className="size-6 fill-white text-white" />
            </span>
          )}
        </div>

        {/* right action rail */}
        <div className="absolute right-2.5 bottom-24 flex flex-col items-center gap-4 text-white">
          <RailItem icon={Heart} label={compact(likes)} />
          <RailItem icon={MessageCircle} label={compact(comments)} />
          <RailItem icon={Send} />
          <RailItem icon={Bookmark} />
          <MoreHorizontal className="size-6 drop-shadow" />
          <span className="mt-1 grid size-6 place-items-center overflow-hidden rounded-md ring-2 ring-white/80">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" className="size-full object-cover" />
            ) : (
              <Music2 className="size-3 text-white" />
            )}
          </span>
        </div>

        {/* caption block */}
        <div className="relative z-10 px-3.5 pb-3.5 text-white">
          <div className="mb-2 flex items-center gap-2">
            <Avatar className="size-8" />
            <span className="text-sm font-semibold drop-shadow">{handle}</span>
            <span className="rounded-md border border-white/70 px-2 py-0.5 text-[11px] font-semibold">Follow</span>
          </div>
          {caption.trim() ? (
            <p className="line-clamp-2 max-w-[80%] text-[12px] leading-snug drop-shadow">
              {caption}
            </p>
          ) : (
            <p className="max-w-[80%] text-[12px] text-white/70 italic drop-shadow">Your caption will appear here...</p>
          )}
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-white/90">
            <Music2 className="size-3" />
            <span className="truncate">Original audio</span>
          </div>
        </div>

        <BottomNav active="reels" />
      </div>
    </div>
  );
}

function RailItem({ icon: Icon, label }: { icon: typeof Heart; label?: string }) {
  return (
    <span className="flex flex-col items-center gap-0.5">
      <Icon className="size-6 drop-shadow" />
      {label && <span className="text-[10px] font-medium drop-shadow">{label}</span>}
    </span>
  );
}

/* ----------------------------- feed post ---------------------------------- */

function PostView({
  media,
  caption,
  account,
  likes,
  comments,
}: {
  media: string[];
  caption: string;
  account: string;
  likes: number;
  comments: number;
}) {
  const [slide, setSlide] = useState(0);
  const handle = account.replace(/^@/, "");
  const count = media.length;
  // Derive a valid index so the preview self-corrects as the composer adds or
  // removes images (no clamping effect needed).
  const safe = Math.min(slide, Math.max(0, count - 1));
  const current = media[safe] ?? null;

  return (
    <div className="flex flex-1 flex-col text-white">
      <StatusBar />
      {/* app header */}
      <div className="flex shrink-0 items-center gap-2 px-4 pt-1 pb-2.5">
        <InstagramGlyph className="size-6" />
        <span className="text-base font-semibold">Post</span>
      </div>

      {/* post header */}
      <div className="flex shrink-0 items-center gap-2.5 px-3.5 py-2">
        <Avatar className="size-8" />
        <span className="flex-1 text-[13px] font-semibold">{handle}</span>
        <MoreHorizontal className="size-5 text-white/90" />
      </div>

      {/* media */}
      <div className="relative aspect-square w-full shrink-0 bg-white/[0.04]">
        {current ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current} alt="" className="absolute inset-0 size-full object-cover" />
            {count > 1 && (
              <>
                <span className="absolute top-2.5 right-2.5 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold tabular-nums">
                  {safe + 1}/{count}
                </span>
                {/* tap zones to flip slides */}
                {safe > 0 && (
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={() => setSlide(Math.max(0, safe - 1))}
                    className="absolute inset-y-0 left-0 w-1/3"
                  />
                )}
                {safe < count - 1 && (
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={() => setSlide(Math.min(count - 1, safe + 1))}
                    className="absolute inset-y-0 right-0 w-1/3"
                  />
                )}
              </>
            )}
          </>
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <div className="flex flex-col items-center gap-2 text-white/55">
              <ImageIcon className="size-9" />
              <span className="text-sm">Add photos</span>
            </div>
          </div>
        )}
      </div>

      {/* carousel dots */}
      {count > 1 && (
        <div className="flex shrink-0 items-center justify-center gap-1.5 py-2">
          {media.map((_, i) => (
            <span
              key={i}
              className={cn("size-1.5 rounded-full transition-colors", i === safe ? "bg-accent-blue" : "bg-white/30")}
            />
          ))}
        </div>
      )}

      {/* actions + caption */}
      <div className={cn("flex min-h-0 flex-1 flex-col px-3.5", count > 1 ? "pt-0.5" : "pt-2.5")}>
        <div className="flex items-center gap-4">
          <Heart className="size-6" />
          <MessageCircle className="size-6" />
          <Send className="size-6" />
          <Bookmark className="ml-auto size-6" />
        </div>
        {likes > 0 && <p className="mt-2 text-[13px] font-semibold">{compact(likes)} likes</p>}
        <p className={cn("text-[13px] leading-snug", likes > 0 ? "mt-0.5" : "mt-2")}>
          <span className="font-semibold">{handle}</span>{" "}
          {caption.trim() ? (
            <span className="text-white/90">{caption}</span>
          ) : (
            <span className="text-white/45 italic">Your caption will appear here...</span>
          )}
        </p>
        {comments > 0 && (
          <p className="mt-1 text-[12px] text-white/55">View all {compact(comments)} comments</p>
        )}
        <p className="mt-1 text-[10px] tracking-wide text-white/45 uppercase">Just now</p>
        <div className="flex-1" />
      </div>

      <BottomNav active="home" />
    </div>
  );
}
