"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Link2, Mail, Play, Share2, X } from "lucide-react";
import { FacebookGlyph, InstagramGlyph, WhatsappGlyph, YoutubeGlyph, SparkleIcon } from "@/components/content/brand-glyphs";

export interface ShareTarget {
  title: string;
  location?: string;
  image?: string | null;
  videoReady?: boolean;
  /** URL to share / copy (property detail page, or a video URL). */
  url: string;
  /** Generated video to preview inside the modal (when showVideo). */
  videoUrl?: string | null;
}

/**
 * Share modal — replaces the native OS share sheet.
 * Two variants:
 *  - default: "Share & Publish" (Share Listing + Publish Video Content)
 *  - content: "Share Content" (video preview + Share Content), publish hidden
 */
export function SharePublishModal({
  target,
  onClose,
  heading = "Share & Publish",
  shareLabel = "Share Listing",
  showVideo = false,
  showPublish = true,
}: {
  target: ShareTarget;
  onClose: () => void;
  heading?: string;
  shareLabel?: string;
  showVideo?: boolean;
  showPublish?: boolean;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const text = `${target.title}${target.location ? " — " + target.location : ""}`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(target.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };
  const openWhatsApp = () =>
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${target.url}`)}`, "_blank", "noopener");
  const openMail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(target.title)}&body=${encodeURIComponent(`${text}\n\n${target.url}`)}`;
  };
  // Publishing requires connected accounts — route to Connect Platforms.
  const publish = () => {
    onClose();
    router.push("/connect-platforms");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "scale-in 200ms ease-out both" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="bg-accent-blue/10 text-accent-blue grid size-8 place-items-center rounded-lg">
              <Share2 className="size-4" />
            </span>
            <h2 className="text-ink text-lg font-bold">{heading}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-ink-muted hover:text-ink">
            <X className="size-5" />
          </button>
        </div>

        {/* Item card */}
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-black/[0.07] p-3">
          <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-black/[0.05]">
            {target.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={target.image} alt="" className="size-full object-cover" />
            ) : (
              <Share2 className="text-ink-muted size-4" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-ink truncate text-sm font-semibold">{target.title}</p>
            {target.location && <p className="text-ink-muted truncate text-xs">{target.location}</p>}
          </div>
          {target.videoReady && (
            <span className="text-brand-green flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium">
              <Check className="size-3" /> Video Ready
            </span>
          )}
        </div>

        {/* Video preview (content share) */}
        {showVideo && (
          <div className="from-accent-blue/10 to-brand-orange/10 relative mt-4 grid aspect-video w-full place-items-center overflow-hidden rounded-xl bg-gradient-to-br">
            {target.videoUrl ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={target.videoUrl} controls preload="metadata" className="size-full bg-black object-contain" />
            ) : (
              <span className="grid size-12 place-items-center rounded-full bg-white/90 shadow">
                <Play className="text-ink size-5 fill-ink" />
              </span>
            )}
            <span className="pointer-events-none absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-ink shadow-sm">
              <SparkleIcon className="text-accent-blue size-3" /> AI Generated
            </span>
          </div>
        )}

        {/* Share */}
        <p className="text-ink mt-5 text-sm font-semibold">{shareLabel}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Tile label="WhatsApp" onClick={openWhatsApp}>
            <WhatsappGlyph className="size-5" />
          </Tile>
          <Tile label="Mail" onClick={openMail} tint="bg-accent-blue/10 text-accent-blue">
            <Mail className="size-5" />
          </Tile>
          <Tile label={copied ? "Copied!" : "Copy link"} onClick={copyLink} tint="bg-black/[0.06] text-ink">
            {copied ? <Check className="size-5 text-brand-green" /> : <Link2 className="size-5" />}
          </Tile>
        </div>

        {/* Publish Video Content */}
        {showPublish && (
        <>
        <p className="text-ink mt-5 text-sm font-semibold">Publish Video Content</p>
        <div className="mt-3 grid grid-cols-4 gap-1">
          <Tile label="WhatsApp" onClick={publish}>
            <WhatsappGlyph className="size-5" />
          </Tile>
          <Tile label="Instagram" onClick={publish}>
            <InstagramGlyph className="size-5" />
          </Tile>
          <Tile label="Facebook" onClick={publish}>
            <FacebookGlyph className="size-5" />
          </Tile>
          <Tile label="YouTube" onClick={publish}>
            <YoutubeGlyph className="size-5" />
          </Tile>
        </div>
        </>
        )}
      </div>
    </div>
  );
}

function Tile({
  label,
  onClick,
  tint = "bg-black/[0.04]",
  children,
}: {
  label: string;
  onClick: () => void;
  tint?: string;
  children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} className="flex min-w-0 flex-col items-center gap-1.5">
      <span className={`grid size-12 shrink-0 place-items-center rounded-full transition-transform hover:scale-105 ${tint}`}>
        {children}
      </span>
      <span className="text-ink-muted w-full truncate text-center text-[11px]">{label}</span>
    </button>
  );
}
