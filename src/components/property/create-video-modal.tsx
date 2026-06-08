"use client";

import { useEffect, useRef, useState } from "react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Loader2,
  MapPin,
  Rocket,
  TriangleAlert,
  Video,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { SparkleIcon } from "@/components/content/brand-glyphs";

const MODAL_IMAGES = [
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80",
];

const STATS: [string, string][] = [
  ["300%", "More Views"],
  ["50%", "Faster Sale"],
  ["30s", "Generation"],
];

type Phase = "idle" | "working" | "done" | "error";

export function CreateVideoModal({
  images = [],
  onClose,
  onVideoReady,
  onGenerate,
  title,
  location,
  building,
}: {
  images?: File[];
  onClose: () => void;
  onVideoReady?: (url: string) => void;
  /** When provided, "Generate Video" hands off to a page-level generating view. */
  onGenerate?: () => void;
  title?: string;
  location?: string;
  building?: string;
}) {
  const propTitle = title || "Your Property Video";
  // Show the user's uploaded photos when available; otherwise stock visuals.
  // Object URLs are created AND revoked inside the effect so React Strict Mode's
  // double-mount recreates them (creating in useMemo + revoking in a cleanup
  // leaves the <img> pointing at already-revoked URLs → broken images).
  const [gallery, setGallery] = useState<string[]>(MODAL_IMAGES);
  useEffect(() => {
    if (!images.length) {
      setGallery(MODAL_IMAGES);
      return;
    }
    const urls = images.map((f) => URL.createObjectURL(f));
    setGallery(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [images]);

  const [active, setActive] = useState(0);
  const n = gallery.length;
  const prev = () => setActive((a) => (a - 1 + n) % n);
  const next = () => setActive((a) => (a + 1) % n);

  const [phase, setPhase] = useState<Phase>("idle");
  const [statusText, setStatusText] = useState("");
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    // Reset on (re)mount — StrictMode's mount→unmount→remount in dev would
    // otherwise leave this stuck `true` from the first cleanup, aborting generate().
    cancelled.current = false;
    return () => {
      cancelled.current = true;
    };
  }, []);

  async function generate() {
    setError(null);
    setProgress(0);
    setVideoUrl(null);
    setPhase("working");
    try {
      const gen = await api.video.create(propTitle);

      setStatusText("Uploading images…");
      // Use the user's uploaded photos when available; else fetch the stock images.
      const toUpload: File[] = images.length
        ? images
        : await Promise.all(
            MODAL_IMAGES.map(async (url, i) => {
              const blob = await (await fetch(url)).blob();
              return new File([blob], `image-${i + 1}.jpg`, { type: blob.type || "image/jpeg" });
            })
          );
      for (const file of toUpload) {
        await api.video.uploadImage(gen.generation_id, file);
        if (cancelled.current) return;
      }

      setStatusText("Starting AI generation…");
      await api.video.trigger(gen.generation_id);

      setStatusText("Creating your video…");
      // Poll until the backend reports completed / failed.
      while (!cancelled.current) {
        await new Promise((r) => setTimeout(r, 2500));
        const st = await api.video.status(gen.generation_id);
        setProgress(st.progress ?? 0);
        if (st.status === "completed") {
          setVideoUrl(st.video_url);
          setPhase("done");
          if (st.video_url) onVideoReady?.(st.video_url);
          return;
        }
        if (st.status === "failed") {
          setError(st.error_message || "Video generation failed.");
          setPhase("error");
          return;
        }
      }
    } catch (err) {
      if (cancelled.current) return;
      setError(
        err instanceof ApiError ? err.message : "Could not generate the video. Please try again."
      );
      setPhase("error");
    }
  }

  const busy = phase === "working";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={busy ? undefined : onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
          <div className="flex items-start gap-3">
            <span className="bg-accent-blue/10 text-accent-blue grid size-10 shrink-0 place-items-center rounded-lg">
              <Video className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-ink text-xl font-bold">{propTitle}</h2>
              <div className="text-ink-muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                {location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-4" />
                    {location}
                  </span>
                )}
                {location && building && <span className="h-4 w-px bg-black/15" />}
                {building && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="size-4" />
                    {building}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="text-ink-muted grid size-8 shrink-0 place-items-center rounded-full bg-black/[0.05] transition-colors hover:bg-black/10 disabled:opacity-40"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* AI Video Tour strip */}
        <div className="mx-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-black/[0.03] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Rocket className="text-accent-blue size-5" />
            <div>
              <p className="text-ink text-sm font-bold">AI Video Tour</p>
              <p className="text-ink-muted text-xs">Transform Photos into Video Magic</p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            {STATS.map(([v, l]) => (
              <span key={l} className="text-sm">
                <span className="text-ink font-bold">{v}</span>{" "}
                <span className="text-ink-muted text-xs">{l}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Body */}
        {phase === "idle" ? (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-6 lg:grid-cols-[1fr_300px]">
            <div>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black/[0.04]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={gallery[Math.min(active, n - 1)]}
                  alt="Selected property image"
                  className="size-full object-cover"
                />
              </div>
              <p className="text-ink-muted mt-2 text-sm">
                {active + 1} of {n}
              </p>
            </div>

            <div className="rounded-xl border border-black/[0.07] p-4">
              <p className="text-ink text-sm font-semibold">{n} Images</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {gallery.map((src, i) => (
                  <div key={i}>
                    <button
                      type="button"
                      onClick={() => setActive(i)}
                      className={cn(
                        "relative aspect-[4/3] w-full overflow-hidden rounded-lg ring-2 transition-all",
                        i === active ? "ring-accent-blue" : "ring-transparent hover:ring-black/15"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Image ${i + 1}`} className="size-full object-cover" />
                      {i === active && (
                        <>
                          <span
                            role="button"
                            aria-label="Previous image"
                            onClick={(e) => {
                              e.stopPropagation();
                              prev();
                            }}
                            className="text-ink absolute top-1/2 left-1 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-white/85 shadow-sm"
                          >
                            <ChevronLeft className="size-4" />
                          </span>
                          <span
                            role="button"
                            aria-label="Next image"
                            onClick={(e) => {
                              e.stopPropagation();
                              next();
                            }}
                            className="text-ink absolute top-1/2 right-1 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-white/85 shadow-sm"
                          >
                            <ChevronRight className="size-4" />
                          </span>
                        </>
                      )}
                    </button>
                    <p className="text-ink-muted mt-1 text-xs">{String(i + 1).padStart(2, "0")}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[320px] flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            {phase === "working" && (
              <>
                <Loader2 className="text-accent-blue size-10 animate-spin" />
                <p className="text-ink font-semibold">{statusText}</p>
                {progress > 0 && (
                  <div className="h-2 w-64 overflow-hidden rounded-full bg-black/[0.06]">
                    <div
                      className="bg-accent-blue h-full rounded-full transition-[width] duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
                <p className="text-ink-muted text-sm">This can take up to a minute…</p>
              </>
            )}

            {phase === "done" && videoUrl && (
              <>
                <CircleCheck className="size-10 text-green-500" />
                <p className="text-ink font-semibold">Your video is ready!</p>
                <video src={videoUrl} controls className="max-h-72 w-full max-w-xl rounded-xl bg-black" />
              </>
            )}

            {phase === "error" && (
              <>
                <TriangleAlert className="size-10 text-red-500" />
                <p className="text-ink font-semibold">Video generation failed</p>
                <p className="text-ink-muted max-w-md text-sm">{error}</p>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-black/[0.06] px-6 py-4">
          {phase === "done" ? (
            <Button
              onClick={onClose}
              className="bg-brand-blue hover:bg-brand-blue-hover h-11 rounded-lg px-5 text-sm font-semibold text-white"
            >
              Done
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={busy}
                className="text-ink h-11 rounded-lg border-black/15 px-5 text-sm font-medium"
              >
                {phase === "error" ? "Close" : "Maybe Later"}
              </Button>
              <Button
                onClick={onGenerate ?? generate}
                disabled={busy}
                className="bg-brand-blue hover:bg-brand-blue-hover h-11 rounded-lg px-5 text-sm font-semibold text-white"
              >
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <SparkleIcon className="size-4" />
                    {phase === "error" ? "Try Again" : "Generate Video"}
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
