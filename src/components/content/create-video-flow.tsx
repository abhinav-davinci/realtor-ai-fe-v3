"use client";

import { createElement, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Bell,
  Calendar,
  Check,
  Clock,
  Download,
  ImagePlus,
  Info,
  Lightbulb,
  Loader,
  Mic,
  Pencil,
  Phone,
  Play,
  RotateCw,
  Sparkles,
  Video,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { saveVideoFile } from "@/lib/download";
import { SparkleIcon } from "./brand-glyphs";

/* Brand glyphs (lucide dropped social icons). */
type GlyphProps = { className?: string };
const FacebookGlyph = ({ className }: GlyphProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="#1877F2" aria-hidden>
    <path d="M24 12a12 12 0 1 0-13.875 11.854v-8.385H7.078V12h3.047V9.356c0-3.007 1.792-4.669 4.533-4.669 1.313 0 2.686.235 2.686.235v2.953H15.83c-1.49 0-1.955.925-1.955 1.874V12h3.328l-.532 3.469h-2.796v8.385A12.002 12.002 0 0 0 24 12Z" />
  </svg>
);
const InstagramGlyph = ({ className }: GlyphProps) => (
  <svg viewBox="2.16 2.16 19.68 19.68" className={className} aria-hidden>
    <defs>
      <linearGradient id="ig-gradient" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FEDA75" />
        <stop offset="25%" stopColor="#FA7E1E" />
        <stop offset="50%" stopColor="#D62976" />
        <stop offset="75%" stopColor="#962FBF" />
        <stop offset="100%" stopColor="#4F5BD5" />
      </linearGradient>
    </defs>
    <path fill="url(#ig-gradient)" d="M12 2.16c3.2 0 3.58.012 4.85.07 1.17.054 1.8.249 2.23.413.56.218.96.479 1.38.9.42.42.68.82.9 1.38.164.42.36 1.06.413 2.23.058 1.27.07 1.65.07 4.85s-.012 3.58-.07 4.85c-.054 1.17-.249 1.8-.413 2.23-.218.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.164-1.06.36-2.23.413-1.27.058-1.65.07-4.85.07s-3.58-.012-4.85-.07c-1.17-.054-1.8-.249-2.23-.413a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.164-.42-.36-1.06-.413-2.23C2.172 15.58 2.16 15.2 2.16 12s.012-3.58.07-4.85c.054-1.17.249-1.8.413-2.23.218-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.164 1.06-.36 2.23-.413C8.42 2.172 8.8 2.16 12 2.16Zm0 3.68A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84Zm0 10.16A4 4 0 1 1 16 12a4 4 0 0 1-4 4Zm6.4-10.4a1.44 1.44 0 1 1-1.44-1.44 1.44 1.44 0 0 1 1.44 1.44Z" />
  </svg>
);
const YoutubeGlyph = ({ className }: GlyphProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="#FF0000" aria-hidden>
    <path d="M23.5 6.5a3 3 0 0 0-2.1-2.1C19.5 3.9 12 3.9 12 3.9s-7.5 0-9.4.5A3 3 0 0 0 .5 6.5 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.5 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.5ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
  </svg>
);
const WhatsappGlyph = ({ className }: GlyphProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="#25D366" aria-hidden>
    <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.157 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24Zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.82 9.82 0 0 0 1.523 5.26l-.999 3.648 3.965-1.072Zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414Z" />
  </svg>
);

type Step = "upload" | "caption" | "generating" | "preview" | "publish" | "confirm";
const STEP_PCT: Record<Step, number> = {
  upload: 12,
  caption: 32,
  generating: 55,
  preview: 72,
  publish: 88,
  confirm: 96,
};

/** Turn raw render/Replicate failure strings into friendly, actionable guidance. */
function humanizeVideoError(raw: string | null): { title: string; detail: string } {
  const e = (raw || "").toLowerCase();
  if (e.includes("sensitive") || e.includes("e005") || e.includes("flagged")) {
    return {
      title: "Photos flagged by the AI safety filter",
      detail:
        "Some images (or a generated frame) were flagged as sensitive. Try different property photos — avoid people, bedrooms/bathrooms, and wall art — then retry. A retry alone often works too.",
    };
  }
  if (
    e.includes("moderation") ||
    e.includes("real estate") ||
    e.includes("settings interface") ||
    e.includes("dashboard") ||
    e.includes("not a property") ||
    e.includes("not a real")
  ) {
    return {
      title: "Image isn't recognized as a property photo",
      detail: "Upload real estate photos — rooms, interiors, or the building exterior — and try again.",
    };
  }
  if (e.includes("timed out") || e.includes("timeout")) {
    return { title: "The video service timed out", detail: "It took too long to respond. Please try again in a moment." };
  }
  if (e.includes("credit") || e.includes("insufficient")) {
    return { title: "Video service temporarily unavailable", detail: "The render service is out of capacity right now. Please try again later." };
  }
  if (e.includes("connect") || e.includes("api returned") || e.includes("nonetype") || e.includes("strip")) {
    return { title: "Couldn't reach the video service", detail: "There was a problem starting the render. Please try again shortly." };
  }
  return { title: "Video generation failed", detail: raw || "Something went wrong. Please try again." };
}

const EXAMPLES = [
  "Modern luxury video",
  "Amenities highlight",
  "Interior showcase",
  "Location & connectivity",
  "Lifestyle video",
];

interface PlatformDef {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}
const PLATFORMS: PlatformDef[] = [
  { key: "facebook", label: "Facebook", icon: FacebookGlyph },
  { key: "instagram", label: "Instagram", icon: InstagramGlyph },
  { key: "youtube", label: "YouTube", icon: YoutubeGlyph },
  { key: "whatsapp", label: "WhatsApp", icon: WhatsappGlyph },
];

const GEN_STEPS = ["Preparing Your Inputs", "Generating Video", "Adding Scenes & Transitions", "Finalizing Video"];

function activeGenStep(progress: number): number {
  if (progress >= 90) return 3;
  if (progress >= 75) return 2;
  if (progress >= 15) return 1;
  return 0;
}

/** Confetti burst behind the success checkmark. */
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
  ["0px", "-125px", "165px", "300deg", "#f59e0b"],
  ["-60px", "-75px", "130px", "240deg", "#2f6bed"],
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

function Radial({ value }: { value: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div className="relative grid size-40 place-items-center">
      <svg className="size-40 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="8" className="stroke-accent-blue/15" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className="stroke-accent-blue transition-[stroke-dashoffset] duration-500"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <Play className="text-accent-blue size-7 fill-accent-blue/20" />
        <span className="text-ink mt-1 text-2xl font-bold">{value}%</span>
      </div>
    </div>
  );
}

export function CreateVideoFlow() {
  const router = useRouter();
  const params = useSearchParams();
  // Deep-link: /create-video?publish=1 opens the Publish & Schedule step directly.
  const [step, setStep] = useState<Step>(params.get("publish") ? "publish" : "upload");
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const [progress, setProgress] = useState(0);
  const [genError, setGenError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const [caption, setCaption] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [strategy, setStrategy] = useState<"now" | "single" | "custom">("custom");
  const [singleDate, setSingleDate] = useState("");
  const [singleTime, setSingleTime] = useState("");
  const [customSched, setCustomSched] = useState<Record<string, { date: string; time: string }>>({});
  const [posted, setPosted] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  // Brief centered loader shown over the caption page right after Generate,
  // before switching to the full generating view.
  const [starting, setStarting] = useState(false);

  const cancelled = useRef(false);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);
  useEffect(() => () => void (cancelled.current = true), []);

  // Load connected platforms when entering the publish step.
  useEffect(() => {
    if (step !== "publish") return;
    let off = false;
    api.channels
      .list()
      .then((res) => {
        if (off) return;
        const map: Record<string, boolean> = {};
        for (const ch of res.channels) map[ch.platform.toLowerCase()] = ch.connected !== false;
        setConnected(map);
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [step]);

  function addFiles(picked: File[]) {
    if (picked.length) setFiles((p) => [...p, ...picked]);
  }

  async function generate() {
    setGenError(null);
    setProgress(0);
    setVideoUrl(null);
    cancelled.current = false;
    // Show the centered intro loader briefly, then reveal the generating page.
    setStarting(true);
    await new Promise((r) => setTimeout(r, 1800));
    if (cancelled.current) {
      setStarting(false);
      return;
    }
    setStarting(false);
    setProgress(5); // show a moving radial immediately; real progress overwrites it
    setStep("generating");
    try {
      const gen = await api.video.create(title || "Property Video");
      for (const file of files) {
        await api.video.uploadImage(gen.generation_id, file);
        if (cancelled.current) return;
      }
      await api.video.trigger(gen.generation_id, desc || undefined);
      while (!cancelled.current) {
        await new Promise((r) => setTimeout(r, 2500));
        const st = await api.video.status(gen.generation_id);
        setProgress((p) => Math.max(p, st.progress ?? 0));
        if (st.status === "completed") {
          setVideoUrl(st.video_url);
          setCaption(desc || `Check out ${title || "this property"}!`);
          setProgress(100); // triggers the success-tick celebration in GeneratingStep
          // Hold the celebratory checkmark briefly, then move to Preview & Edit.
          await new Promise((r) => setTimeout(r, 1800));
          if (cancelled.current) return;
          setStep("preview");
          return;
        }
        if (st.status === "failed") {
          setGenError(st.error_message || "Video generation failed.");
          return;
        }
      }
    } catch (err) {
      if (!cancelled.current)
        setGenError(err instanceof ApiError ? err.message : "Could not generate the video.");
    }
  }

  const canContinueUpload = files.length >= 2;
  const chosenPlatforms = PLATFORMS.filter((p) => selected[p.key]);

  // Actually publish the generated video to the connected platforms. Facebook
  // posts the video for real; Instagram/YouTube wiring is pending their flows.
  async function publishNow() {
    setPublishing(true);
    setPublishError(null);
    try {
      const wantsFacebook = chosenPlatforms.some((p) => p.key === "facebook") && connected["facebook"];
      if (wantsFacebook && videoUrl) {
        const pages = (await api.channels.facebookPages()).pages ?? [];
        const pageId = pages[0]?.id;
        if (!pageId) throw new ApiError(400, "No Facebook page is connected. Reconnect Facebook and try again.");
        await api.channels.facebookPostVideo(pageId, videoUrl, caption || "");
      }

      const wantsInstagram = chosenPlatforms.some((p) => p.key === "instagram") && connected["instagram"];
      if (wantsInstagram && videoUrl) {
        const accounts = (await api.channels.instagramAccounts()).accounts ?? [];
        const igId = accounts[0]?.ig_user_id || accounts[0]?.id;
        if (!igId) throw new ApiError(400, "No Instagram account is connected. Reconnect Instagram and try again.");
        // 1) create container, 2) poll until FINISHED (~90s max), 3) publish.
        const { container_id } = await api.channels.instagramCreateReel(igId, videoUrl, caption || "");
        let status = "IN_PROGRESS";
        for (let i = 0; i < 30 && status === "IN_PROGRESS"; i++) {
          await new Promise((r) => setTimeout(r, 3000));
          status = (await api.channels.instagramReelStatus(igId, container_id)).status_code;
        }
        if (status !== "FINISHED")
          throw new ApiError(
            400,
            status === "ERROR"
              ? "Instagram couldn't process the video. Please try a different video."
              : "Instagram is still processing the video — please try publishing again shortly."
          );
        await api.channels.instagramPublishReel(igId, container_id);
      }

      setPosted(true);
    } catch (e) {
      setPublishError(e instanceof ApiError ? e.message : "Couldn't publish. Please try again.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {starting && <GeneratingIntroModal />}
      {posted && (
        <SuccessModal
          count={chosenPlatforms.length}
          note={
            strategy === "custom"
              ? "Custom schedule applied per platform"
              : strategy === "single"
                ? "Scheduled at a single time"
                : "Published immediately to all platforms"
          }
          onCreateNew={() => {
            setPosted(false);
            setStep("upload");
            setFiles([]);
            setTitle("");
            setDesc("");
            setVideoUrl(null);
            setSelected({});
          }}
          onGoToContent={() => router.push("/platform-content")}
        />
      )}

      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div>
          <h1 className="text-ink text-2xl font-bold">
            {step === "publish" || step === "confirm" ? "Publish & Schedule" : "Create Content"}
          </h1>
          <p className="text-ink-muted text-sm">Turn property photos into a shareable AI video.</p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/create-video/videos" />}
          className="bg-brand-blue hover:bg-brand-blue-hover h-10 rounded-lg px-4 text-sm font-semibold text-white"
        >
          <Video className="size-4" />
          My Videos
        </Button>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white">
          <div className="h-1 w-full bg-black/[0.06]">
            <div
              className="bg-accent-blue h-full rounded-r-full transition-[width] duration-500"
              style={{ width: `${posted ? 100 : STEP_PCT[step]}%` }}
            />
          </div>

          <div key={step} className="p-7" style={{ animation: "fade-in-up 320ms ease-out both" }}>
            {step === "upload" && (
              <UploadStep
                files={files}
                previews={previews}
                onAdd={addFiles}
                onClear={() => setFiles([])}
                onContinue={() => setStep("caption")}
                canContinue={canContinueUpload}
              />
            )}
            {step === "caption" && (
              <CaptionStep
                title={title}
                setTitle={setTitle}
                desc={desc}
                setDesc={setDesc}
                count={files.length}
                onBack={() => setStep("upload")}
                onGenerate={generate}
              />
            )}
            {step === "generating" && (
              <GeneratingStep
                progress={progress}
                error={genError}
                onRetry={generate}
                onBack={() => setStep("caption")}
                onCheckLater={() => router.push("/create-video/videos")}
              />
            )}
            {step === "preview" && (
              <PreviewStep
                videoUrl={videoUrl}
                videoName={title || "Your AI Video"}
                onBack={() => setStep("generating")}
                onPublish={() => setStep("publish")}
              />
            )}
            {step === "publish" && (
              <PublishStep
                caption={caption}
                setCaption={setCaption}
                selected={selected}
                setSelected={setSelected}
                connected={connected}
                strategy={strategy}
                setStrategy={setStrategy}
                platforms={chosenPlatforms}
                singleDate={singleDate}
                setSingleDate={setSingleDate}
                singleTime={singleTime}
                setSingleTime={setSingleTime}
                customSched={customSched}
                setCustomSched={setCustomSched}
                onBack={() => setStep("preview")}
                onConfirm={() => setStep("confirm")}
              />
            )}
            {step === "confirm" && (
              <ConfirmStep
                caption={caption}
                platforms={chosenPlatforms}
                strategy={strategy}
                singleDate={singleDate}
                singleTime={singleTime}
                customSched={customSched}
                onBack={() => setStep("publish")}
                onConfirm={publishNow}
                submitting={publishing}
                error={publishError}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Upload ---------------- */

function UploadStep({
  files,
  previews,
  onAdd,
  onClear,
  onContinue,
  canContinue,
}: {
  files: File[];
  previews: string[];
  onAdd: (f: File[]) => void;
  onClear: () => void;
  onContinue: () => void;
  canContinue: boolean;
}) {
  const [drag, setDrag] = useState(false);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-ink text-lg font-bold">Upload Media</h2>
        <p className="text-ink-muted text-sm">Upload property images and generate an AI-powered video</p>
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          onAdd(Array.from(e.dataTransfer.files ?? []).filter((f) => f.type.startsWith("image/")));
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-all",
          drag ? "border-accent-blue bg-accent-blue/[0.05] scale-[1.005]" : "border-black/15 bg-black/[0.01] hover:border-accent-blue/40"
        )}
      >
        <input
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            onAdd(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        <span className={cn("bg-accent-blue/10 text-accent-blue grid size-16 place-items-center rounded-2xl transition-transform", drag && "scale-110")}>
          <ImagePlus className="size-8" />
        </span>
        <p className="text-ink mt-4 font-semibold">Drag and drop photos here</p>
        <span className="border-accent-blue/40 text-accent-blue mt-4 rounded-lg border bg-white px-5 py-2 text-sm font-semibold">
          {files.length > 0 ? "Add More Images" : "Add Images"}
        </span>
        <p className="text-ink-muted mt-4 text-xs">
          Use clear, well-lit photos from multiple angles for best video results · JPG, PNG, WebP · Max 10MB each
        </p>
      </label>

      {files.length > 0 && (
        <div style={{ animation: "fade-in-up 300ms ease-out both" }}>
          <div className="flex items-center justify-between">
            <p className="text-ink text-sm font-bold">Selected Photos &amp; Video ({files.length})</p>
            <button type="button" onClick={onClear} className="text-accent-blue text-sm font-medium">
              Clear All
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {previews.map((src, i) => (
              <span key={i} className="relative size-20 overflow-hidden rounded-xl ring-1 ring-black/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Photo ${i + 1}`} className="size-full object-cover" />
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-start gap-2.5 rounded-xl bg-accent-blue/[0.06] px-4 py-3">
        <Sparkles className="text-accent-blue mt-0.5 size-4 shrink-0" />
        <p className="text-ink-muted text-sm">
          <span className="text-ink font-semibold">Tip: </span>
          Upload at least 2 high-quality images. Our AI uses them to generate an engaging marketing video.
        </p>
      </div>

      <div className="flex items-center justify-end border-t border-black/[0.06] pt-5">
        <Button
          onClick={onContinue}
          disabled={!canContinue}
          className={cn(
            "h-11 rounded-lg px-6 text-sm font-semibold",
            canContinue ? "bg-brand-blue hover:bg-brand-blue-hover text-white" : "text-ink-muted bg-black/[0.06]"
          )}
        >
          Continue
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Caption ---------------- */

function CaptionStep({
  title,
  setTitle,
  desc,
  setDesc,
  count,
  onBack,
  onGenerate,
}: {
  title: string;
  setTitle: (v: string) => void;
  desc: string;
  setDesc: (v: string) => void;
  count: number;
  onBack: () => void;
  onGenerate: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-ink text-lg font-bold">Write Caption</h2>
        <p className="text-ink-muted text-sm">Create an engaging video from {count} uploaded media</p>
      </div>

      <div>
        <label className="text-ink mb-2 block text-sm font-medium">Video Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter video title"
          className="text-ink placeholder:text-ink-muted/60 focus:border-accent-blue/50 h-11 w-full rounded-lg border border-black/15 bg-white px-3.5 text-sm outline-none"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-ink text-sm font-medium">Describe Your Video</label>
          <span className="text-ink-muted text-xs">{desc.length} / 500 characters</span>
        </div>
        <textarea
          rows={3}
          maxLength={500}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="eg. Create a modern and luxurious lifestyle video highlighting amenities, connectivity and interior spaces."
          className="text-ink placeholder:text-ink-muted/60 focus:border-accent-blue/50 w-full resize-none rounded-lg border border-black/15 bg-white p-3.5 text-sm outline-none"
        />
        <div className="mt-3">
          <p className="text-ink text-sm font-semibold">Try these examples:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setDesc(ex)}
                className="text-ink hover:border-accent-blue/50 rounded-full border border-black/15 px-3 py-1.5 text-sm transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-black/[0.06] pt-5">
        <Button variant="outline" onClick={onBack} className="text-ink h-11 rounded-lg border-black/15 px-6 text-sm font-medium">
          Back
        </Button>
        <Button onClick={onGenerate} className="bg-brand-blue hover:bg-brand-blue-hover h-11 rounded-lg px-6 text-sm font-semibold text-white">
          <SparkleIcon className="size-4" />
          Generate Video
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Generating ---------------- */

function GeneratingIntroModal() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4" style={{ animation: "fade-in 160ms ease-out both" }}>
      <div
        className="flex w-full max-w-sm flex-col items-center rounded-2xl bg-white px-8 py-10 text-center shadow-2xl"
        style={{ animation: "scale-in 200ms ease-out both" }}
      >
        <Loader className="text-accent-blue size-9 animate-spin" />
        <h2 className="text-ink mt-5 text-xl font-bold">Generating Your Video</h2>
        <p className="text-ink-muted mt-1.5 text-sm">AI is working on your video. This may take a few minutes.</p>
      </div>
    </div>
  );
}

function GeneratingStep({
  progress,
  error,
  onRetry,
  onBack,
  onCheckLater,
}: {
  progress: number;
  error: string | null;
  onRetry: () => void;
  onBack: () => void;
  onCheckLater: () => void;
}) {
  const cur = activeGenStep(progress);

  return (
    <div className="space-y-7">
      <div className="flex items-center gap-3">
        <span className="bg-accent-blue/10 text-accent-blue grid size-11 place-items-center rounded-full">
          <Sparkles className="size-6" />
        </span>
        <div>
          <h2 className="text-ink text-xl font-bold">Generating Your Video</h2>
          <p className="text-ink-muted text-sm">AI is working on your video. This may take a few minutes.</p>
        </div>
      </div>

      <div className="bg-brand-orange/[0.07] flex items-start gap-2.5 rounded-xl px-4 py-3">
        <Mic className="text-brand-orange mt-0.5 size-5 shrink-0" />
        <p className="text-ink-muted text-sm">
          <span className="text-ink font-semibold">Add Your Voice! </span>
          Record your voice or upload audio after video generation to make your video more engaging.
        </p>
      </div>

      <div className="grid min-h-[260px] place-items-center rounded-2xl bg-black/[0.02] py-14">
        {error ? (
          <div className="flex flex-col items-center text-center">
            <span className="grid size-14 place-items-center rounded-full bg-red-50 text-red-500">
              <X className="size-7" />
            </span>
            <p className="text-ink mt-3 font-semibold">{humanizeVideoError(error).title}</p>
            <p className="text-ink-muted mt-1 max-w-md text-sm">{humanizeVideoError(error).detail}</p>
            <Button onClick={onRetry} className="bg-brand-blue hover:bg-brand-blue-hover mt-4 h-10 rounded-lg px-5 text-sm font-semibold text-white">
              <RotateCw className="size-4" />
              Try Again
            </Button>
          </div>
        ) : progress >= 100 ? (
          <div className="relative flex flex-col items-center">
            <div className="relative grid size-28 place-items-center">
              <Confetti />
              <span
                className="bg-rail grid size-24 place-items-center rounded-full text-white"
                style={{ animation: "tick-pop 500ms cubic-bezier(0.2,0.8,0.2,1.4) both" }}
              >
                <Check className="size-12" strokeWidth={3} />
              </span>
            </div>
            <p className="text-accent-blue mt-3 flex items-center gap-1.5 text-sm font-medium">
              Finalizing Video
              <span className="flex gap-0.5">
                <span className="bg-accent-blue size-1.5 animate-pulse rounded-full" />
                <span className="bg-accent-blue/60 size-1.5 animate-pulse rounded-full [animation-delay:150ms]" />
              </span>
            </p>
          </div>
        ) : (
          <>
            <Radial value={progress} />
            <p className="text-accent-blue mt-2 flex items-center gap-1.5 text-sm font-medium">
              Generating
              <span className="flex gap-0.5">
                <span className="bg-accent-blue size-1.5 animate-pulse rounded-full" />
                <span className="bg-accent-blue/60 size-1.5 animate-pulse rounded-full [animation-delay:150ms]" />
              </span>
            </p>
          </>
        )}
      </div>

      {!error && (
        <>
          <div className="text-center">
            <span className="bg-brand-orange/10 text-brand-orange inline-block rounded-full px-3 py-1 text-xs font-semibold">
              ✦ Great things take a little time!
            </span>
            <p className="text-ink mt-2 font-bold">Almost There! Your Video is Being Created</p>
            <p className="text-ink-muted mx-auto mt-1 max-w-xl text-sm">
              I&apos;m creating your property video with the best visuals and smooth transitions. Your video will be ready soon.
            </p>
          </div>

          <div className="mx-auto flex max-w-2xl items-start px-2">
            {GEN_STEPS.map((label, i) => (
              <div key={label} className="relative flex flex-1 flex-col items-center text-center">
                {i < GEN_STEPS.length - 1 && (
                  <span
                    className={cn(
                      "absolute left-1/2 top-4 h-0.5 w-full -translate-y-1/2 transition-colors",
                      i < cur ? "bg-accent-blue" : "bg-black/[0.1]"
                    )}
                  />
                )}
                <span
                  className={cn(
                    "relative z-10 grid size-8 place-items-center rounded-full text-xs font-bold transition-colors",
                    i < cur ? "bg-accent-blue text-white" : i === cur ? "bg-accent-blue text-white" : "bg-black/[0.06] text-ink-muted"
                  )}
                >
                  {i < cur ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                </span>
                <span className={cn("mt-2 max-w-[88px] text-[11px] leading-tight", i <= cur ? "text-ink font-medium" : "text-ink-muted")}>{label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex items-start gap-2.5 rounded-xl bg-black/[0.02] px-4 py-3">
        <Bell className="text-accent-blue mt-0.5 size-5 shrink-0" />
        <p className="text-ink-muted text-sm">
          <span className="text-ink font-semibold">We&apos;ll Notify You. </span>
          Video generation takes time. You&apos;ll get a notification once it&apos;s ready.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-black/[0.06] pt-5">
        <Button variant="outline" onClick={onBack} className="text-ink h-11 rounded-lg border-black/15 px-6 text-sm font-medium">
          Back
        </Button>
        {error ? (
          <Button variant="outline" disabled className="text-ink-muted h-11 rounded-lg border-black/15 px-6 text-sm font-medium">
            Generation failed
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={onCheckLater}
              className="text-ink h-11 rounded-lg border-black/15 px-6 text-sm font-semibold"
            >
              I&apos;ll check back later
            </Button>
            <Button
              disabled
              className="bg-brand-blue h-11 rounded-lg px-6 text-sm font-semibold text-white opacity-40"
            >
              <SparkleIcon className="size-4" />
              Ready to Publish
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- Preview ---------------- */

function PreviewStep({
  videoUrl,
  videoName,
  onBack,
  onPublish,
}: {
  videoUrl: string | null;
  videoName: string;
  onBack: () => void;
  onPublish: () => void;
}) {
  const voiceInput = useRef<HTMLInputElement>(null);
  const [voiceFile, setVoiceFile] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);

  // Let the user choose where to save, then show the "Download Complete" card
  // once the file is actually saved (not if they cancel the dialog).
  async function handleDownload() {
    if (!videoUrl) return;
    const filename = `${(videoName || "property-video").replace(/[^\w-]+/g, "-")}.mp4`;
    const result = await saveVideoFile(videoUrl, filename);
    if (result === "saved") {
      setDownloaded(true);
      window.setTimeout(() => setDownloaded(false), 2800);
    }
  }

  const generatedAt = useMemo(
    () =>
      new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    []
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="bg-accent-blue/10 text-accent-blue grid size-9 place-items-center rounded-full">
          <Sparkles className="size-5" />
        </span>
        <div>
          <h2 className="text-ink text-lg font-bold">Preview &amp; Edit</h2>
          <p className="text-ink-muted text-sm">Review your AI-generated video and caption before publishing</p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-green-500 text-white">
          <Check className="size-4" strokeWidth={3} />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-green-700">Your Video is Ready</p>
          <p className="text-ink-muted truncate text-xs">
            <span className="text-ink font-medium">{videoName}</span> Generated successfully on {generatedAt}
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-black">
        {videoUrl ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={videoUrl} controls className="max-h-[440px] w-full bg-black" />
        ) : (
          <div className="grid aspect-video place-items-center text-white/70">No video</div>
        )}
        <span className="pointer-events-none absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-ink shadow-sm">
          <Sparkles className="text-accent-blue size-3" /> AI Generated
        </span>
        <button
          onClick={() => voiceInput.current?.click()}
          className="text-brand-orange absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-sm hover:bg-white/90"
        >
          <span className="bg-brand-orange size-1.5 rounded-full" /> {voiceFile ? "Voice Added" : "Add Voice"}
        </button>
        <input
          ref={voiceInput}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => setVoiceFile(e.target.files?.[0]?.name ?? null)}
        />

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
      <p className="text-ink-muted text-xs">
        Duration: ~60 seconds | Quality: 1080p | Format: MP4
        {voiceFile && <span className="text-brand-green"> · Voice: {voiceFile}</span>}
      </p>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-black/[0.06] pt-5">
        <Button variant="outline" onClick={onBack} className="text-ink h-11 rounded-lg border-black/15 px-5 text-sm font-medium">
          Back
        </Button>
        <Button
          variant="outline"
          onClick={handleDownload}
          className="text-ink h-11 rounded-lg border-black/15 px-5 text-sm font-medium"
        >
          <Download className="size-4" />
          Download
        </Button>
        <Button variant="outline" onClick={() => setLimitOpen(true)} className="text-ink h-11 rounded-lg border-black/15 px-5 text-sm font-medium">
          <RotateCw className="size-4" />
          Regenerate
        </Button>
        <Button onClick={onPublish} className="bg-brand-blue hover:bg-brand-blue-hover h-11 rounded-lg px-5 text-sm font-semibold text-white">
          Scheduled &amp; Publish
          <ArrowRight className="size-4" />
        </Button>
      </div>

      {limitOpen && <FreeGenUsedModal onClose={() => setLimitOpen(false)} />}
    </div>
  );
}

/* ---------------- Free generation limit ---------------- */

function FreeGenUsedModal({ onClose }: { onClose: () => void }) {
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

  const features = [
    "Unlimited AI video generations",
    "Priority video processing",
    "Advanced customization options",
    "Dedicated support team",
  ];

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/45 p-4"
      onClick={onClose}
      style={{ animation: "fade-in 160ms ease-out both" }}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "scale-in 200ms ease-out both" }}
      >
        {/* Header */}
        <div className="bg-brand-orange/[0.08] relative px-6 pt-7 pb-6 text-center">
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-ink-muted hover:text-ink absolute top-4 right-4 grid size-8 place-items-center rounded-full"
          >
            <X className="size-5" />
          </button>
          <span className="bg-brand-orange mx-auto grid size-14 place-items-center rounded-xl text-white shadow-sm">
            <Zap className="size-7 fill-white" />
          </span>
          <h2 className="text-ink mt-4 text-2xl font-bold">Free Generation Used</h2>
          <p className="text-ink-muted mt-1 text-sm">You&apos;ve used your 1 free video generation</p>
        </div>

        <div className="px-6 py-6">
          {/* Usage counter */}
          <div className="border-brand-orange/40 bg-brand-orange/[0.05] grid grid-cols-2 divide-x divide-black/[0.08] rounded-xl border text-center">
            <div className="py-3">
              <p className="text-brand-orange text-2xl font-bold">1/1</p>
              <p className="text-ink-muted text-xs">Used</p>
            </div>
            <div className="py-3">
              <p className="text-brand-orange text-2xl font-bold">0</p>
              <p className="text-ink-muted text-xs">Remaining</p>
            </div>
          </div>

          {/* Upsell */}
          <p className="text-ink mt-5 flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="text-accent-blue size-4" /> Get Unlimited Generations
          </p>
          <ul className="mt-3 space-y-2.5">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-green-100 text-green-600">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                <span className="text-ink-muted">{f}</span>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <Button className="bg-brand-blue hover:bg-brand-blue-hover mt-6 h-12 w-full rounded-lg text-sm font-semibold text-white">
            <Phone className="size-4" /> Contact Sales
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="text-ink mt-3 h-12 w-full rounded-lg border-black/15 text-sm font-semibold"
          >
            Maybe Later
          </Button>
          <p className="text-ink-muted mt-4 text-center text-xs">
            Our sales team will help you find the perfect plan for your needs
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Publish ---------------- */

const STRATEGIES: { key: "now" | "single" | "custom"; title: string; desc: string }[] = [
  { key: "now", title: "Publish Immediately", desc: "Your content will be live across all selected platforms right now" },
  { key: "single", title: "Publish at Single Time", desc: "Publish to all selected platforms at the same date & time" },
  { key: "custom", title: "Custom Schedule Per Platform", desc: "Set different dates & times for each platform to optimize engagement" },
];

type Sched = Record<string, { date: string; time: string }>;

/** Styled date/time field: shows a "Select date/time" placeholder + icon, while a
 * transparent native input on top opens the real picker. */
function SchedField({
  type,
  value,
  onChange,
  placeholder,
}: {
  type: "date" | "time";
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const Icon = type === "date" ? Calendar : Clock;
  let display = placeholder;
  if (value && type === "date") {
    const [y, m, d] = value.split("-");
    display = `${d}/${m}/${y}`;
  } else if (value) {
    const [h, min] = value.split(":").map(Number);
    display = `${String(((h + 11) % 12) + 1).padStart(2, "0")}:${String(min).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  }
  return (
    <div className="relative h-11 w-full">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
        className="absolute inset-0 size-full cursor-pointer opacity-0"
      />
      <div
        className={cn(
          "pointer-events-none flex h-full w-full items-center justify-between rounded-lg border border-black/15 bg-white px-3 text-sm",
          value ? "text-ink" : "text-ink-muted/60"
        )}
      >
        <span>{display}</span>
        <Icon className="text-ink-muted size-4" />
      </div>
    </div>
  );
}

function PublishStep({
  caption,
  setCaption,
  selected,
  setSelected,
  connected,
  strategy,
  setStrategy,
  platforms,
  singleDate,
  setSingleDate,
  singleTime,
  setSingleTime,
  customSched,
  setCustomSched,
  onBack,
  onConfirm,
}: {
  caption: string;
  setCaption: (v: string) => void;
  selected: Record<string, boolean>;
  setSelected: (v: Record<string, boolean>) => void;
  connected: Record<string, boolean>;
  strategy: "now" | "single" | "custom";
  setStrategy: (v: "now" | "single" | "custom") => void;
  platforms: PlatformDef[];
  singleDate: string;
  setSingleDate: (v: string) => void;
  singleTime: string;
  setSingleTime: (v: string) => void;
  customSched: Sched;
  setCustomSched: (v: Sched) => void;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const anySelected = Object.values(selected).some(Boolean);
  const platformNames = platforms.map((p) => p.label).join(", ") || "your selected platforms";
  const now = useMemo(() => new Date().toLocaleString("en-GB"), []);
  const setCustom = (key: string, patch: { date?: string; time?: string }) => {
    const prev = customSched[key] ?? { date: "", time: "" };
    setCustomSched({ ...customSched, [key]: { ...prev, ...patch } });
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-green-500 text-white">
          <Check className="size-4" strokeWidth={3} />
        </span>
        <p className="font-medium text-green-700">Your marketing content has been created and is ready to publish.</p>
      </div>

      <div>
        <label className="text-ink mb-2 block font-semibold">Caption</label>
        <textarea
          rows={3}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write an engaging caption that highlights the property's best features. Include relevant hashtags and a call to action."
          className="text-ink placeholder:text-ink-muted/60 focus:border-accent-blue/50 w-full resize-none rounded-lg border border-black/15 bg-white p-3.5 text-sm outline-none"
        />
      </div>

      <div>
        <p className="text-ink font-semibold">Select Social Media Channels</p>
        <p className="text-ink-muted text-sm">Choose which platforms you want to publish your content to</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PLATFORMS.map((p) => {
            const isSel = !!selected[p.key];
            const isConn = connected[p.key];
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setSelected({ ...selected, [p.key]: !isSel })}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 transition-all",
                  isSel ? "border-accent-blue bg-accent-blue/[0.04]" : "border-transparent bg-black/[0.03] hover:bg-black/[0.05]"
                )}
              >
                {createElement(p.icon, { className: "size-7" })}
                <span className="text-ink text-sm font-medium">{p.label}</span>
                {isSel ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                    <Check className="size-3" strokeWidth={3} /> Selected
                  </span>
                ) : (
                  <span className={cn("text-[11px]", isConn ? "text-ink-muted" : "text-brand-orange")}>
                    {isConn ? "Connected" : "Not connected"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-ink font-semibold">Choose Your Scheduling Strategy</p>
        <p className="text-ink-muted text-sm">Select how you want to publish and schedule your content across platforms.</p>
        <div className="mt-3 space-y-3">
          {STRATEGIES.map((s) => {
            const active = strategy === s.key;
            return (
              <div
                key={s.key}
                className={cn(
                  "rounded-xl border transition-colors",
                  active ? "border-accent-blue bg-accent-blue/[0.04]" : "border-black/[0.1] hover:bg-black/[0.02]"
                )}
              >
                <button type="button" onClick={() => setStrategy(s.key)} className="flex w-full items-start gap-3 p-4 text-left">
                  <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2", active ? "border-accent-blue" : "border-black/25")}>
                    {active && <span className="bg-accent-blue size-2.5 rounded-full" />}
                  </span>
                  <span>
                    <span className="text-ink block text-sm font-semibold">{s.title}</span>
                    <span className="text-ink-muted block text-xs">{s.desc}</span>
                  </span>
                </button>

                {active && s.key === "now" && (
                  <div className="mx-4 mb-4 rounded-xl bg-white p-4 ring-1 ring-black/[0.06]">
                    <p className="text-ink font-semibold">Current Time</p>
                    <p className="text-ink-muted mt-1 text-sm">
                      Your content will be published instantly to: <span className="text-accent-blue font-medium">{platformNames}</span>
                    </p>
                    <p className="text-accent-blue mt-3 font-semibold">Now</p>
                    <p className="text-ink-muted text-sm">{now}</p>
                  </div>
                )}

                {active && s.key === "single" && (
                  <div className="mx-4 mb-4 rounded-xl bg-white p-4 ring-1 ring-black/[0.06]">
                    <p className="text-ink font-semibold">Schedule All Platforms</p>
                    <p className="text-ink-muted text-sm">All selected platforms will publish at the same time</p>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-ink mb-1.5 block text-sm font-medium">Set Date</label>
                        <SchedField type="date" value={singleDate} onChange={setSingleDate} placeholder="Select date" />
                      </div>
                      <div>
                        <label className="text-ink mb-1.5 block text-sm font-medium">Set Time</label>
                        <SchedField type="time" value={singleTime} onChange={setSingleTime} placeholder="Select time" />
                      </div>
                    </div>
                    {platforms.length > 0 && (
                      <p className="text-ink-muted mt-3 text-xs">Publish to: {platforms.map((p) => p.label).join(" • ")}</p>
                    )}
                  </div>
                )}

                {active && s.key === "custom" && (
                  <div className="mx-4 mb-4 grid gap-3 sm:grid-cols-2">
                    {platforms.map((p) => (
                      <div key={p.key} className="rounded-xl bg-white p-4 ring-1 ring-black/[0.06]">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            {createElement(p.icon, { className: "size-5" })}
                            <span className="text-ink text-sm font-semibold">{p.label}</span>
                          </span>
                          <span className="text-accent-blue bg-accent-blue/10 rounded-md px-2 py-0.5 text-[11px] font-medium">Custom</span>
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="text-ink mb-1.5 block text-sm font-medium">Set Date</label>
                            <SchedField
                              type="date"
                              value={customSched[p.key]?.date ?? ""}
                              onChange={(v) => setCustom(p.key, { date: v })}
                              placeholder="Select date"
                            />
                          </div>
                          <div>
                            <label className="text-ink mb-1.5 block text-sm font-medium">Set Time</label>
                            <SchedField
                              type="time"
                              value={customSched[p.key]?.time ?? ""}
                              onChange={(v) => setCustom(p.key, { time: v })}
                              placeholder="Select time"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {platforms.length === 0 && (
                      <p className="text-ink-muted text-sm">Select at least one platform above to set a schedule.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-accent-blue/[0.06] flex items-start gap-2.5 rounded-xl px-4 py-3">
        <Lightbulb className="text-accent-blue mt-0.5 size-5 shrink-0" />
        <p className="text-ink-muted text-sm">
          <span className="text-ink font-semibold">Pro Tip </span>
          Each platform has peak engagement times. Instagram peaks in the morning, YouTube in the evening, and LinkedIn during business hours.
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-black/[0.06] pt-5">
        <Button variant="outline" onClick={onBack} className="text-ink h-11 rounded-lg border-black/15 px-6 text-sm font-medium">
          Back
        </Button>
        <Button
          onClick={onConfirm}
          disabled={!anySelected}
          className={cn(
            "h-11 rounded-lg px-6 text-sm font-semibold",
            anySelected ? "bg-brand-blue hover:bg-brand-blue-hover text-white" : "text-ink-muted bg-black/[0.06]"
          )}
        >
          Confirm to Publish
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Confirm ---------------- */

function ConfirmStep({
  caption,
  platforms,
  strategy,
  singleDate,
  singleTime,
  customSched,
  onBack,
  onConfirm,
  submitting = false,
  error = null,
}: {
  caption: string;
  platforms: PlatformDef[];
  strategy: "now" | "single" | "custom";
  singleDate: string;
  singleTime: string;
  customSched: Sched;
  onBack: () => void;
  onConfirm: () => void;
  submitting?: boolean;
  error?: string | null;
}) {
  const stratLabel = STRATEGIES.find((s) => s.key === strategy)?.title ?? "";
  // Format the chosen schedule (inputs give yyyy-mm-dd / HH:MM).
  const fmtDate = (d: string) => {
    if (!d) return "Not set";
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };
  const fmtTime = (t: string) => {
    if (!t) return "Not set";
    const [h, min] = t.split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM";
    return `${String(((h + 11) % 12) + 1).padStart(2, "0")}:${String(min).padStart(2, "0")} ${ap}`;
  };
  const dateFor = (key: string) => (strategy === "custom" ? fmtDate(customSched[key]?.date ?? "") : fmtDate(singleDate));
  const timeFor = (key: string) => (strategy === "custom" ? fmtTime(customSched[key]?.time ?? "") : fmtTime(singleTime));

  const Edit = () => (
    <button onClick={onBack} className="text-accent-blue flex items-center gap-1 text-sm font-medium hover:underline">
      <Pencil className="size-3.5" /> Edit
    </button>
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-ink text-lg font-bold">Confirm Publishing</h2>
        <p className="text-ink-muted text-sm">Review your publishing details before confirming</p>
      </div>

      <div className="rounded-xl border border-black/[0.08] p-4">
        <div className="flex items-center justify-between">
          <p className="text-ink-muted text-xs font-semibold tracking-wide">CAPTION &amp; DESCRIPTION</p>
          <Edit />
        </div>
        <p className="text-ink mt-2 rounded-lg bg-black/[0.02] p-3 text-sm">{caption || "—"}</p>
      </div>

      <div className="rounded-xl border border-black/[0.08] p-4">
        <div className="flex items-center justify-between">
          <p className="text-ink-muted text-xs font-semibold tracking-wide">
            PUBLISHING TO {platforms.length} PLATFORM{platforms.length === 1 ? "" : "S"}
          </p>
          <Edit />
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          {platforms.map((p) => (
            <span key={p.key} className="inline-flex items-center gap-2.5 rounded-xl bg-black/[0.03] px-4 py-2.5">
              {createElement(p.icon, { className: "size-6" })}
              <span className="text-ink text-sm font-semibold">{p.label}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-black/[0.08] p-4">
        <div className="flex items-center justify-between">
          <p className="text-ink-muted text-xs font-semibold tracking-wide">SCHEDULE TYPE</p>
          <Edit />
        </div>
        <p className="text-ink mt-1 font-bold">{stratLabel}</p>
        {strategy === "now" ? (
          <p className="text-ink-muted mt-2 text-sm">Publishing immediately to all selected platforms.</p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {platforms.map((p) => (
              <div key={p.key} className="rounded-xl bg-black/[0.03] p-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white shadow-sm ring-1 ring-black/[0.05]">
                    {createElement(p.icon, { className: "size-4" })}
                  </span>
                  <span className="text-ink text-sm font-semibold">{p.label}</span>
                </div>
                <div className="text-ink-muted mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" /> Date: <span className="text-ink font-medium">{dateFor(p.key)}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" /> Time: <span className="text-ink font-medium">{timeFor(p.key)}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-green-500 text-white">
          <Check className="size-5" strokeWidth={3} />
        </span>
        <div>
          <p className="font-semibold text-green-700">Content Ready for Publishing</p>
          <p className="text-sm text-green-700/80">
            Your property content will be optimized and formatted for each platform automatically
          </p>
        </div>
      </div>

      <div className="bg-brand-orange/[0.08] rounded-xl px-4 py-3">
        <p className="text-ink flex items-center gap-2 text-sm font-semibold">
          <Info className="text-brand-orange size-5" /> Before Publishing:
        </p>
        <div className="text-brand-orange mt-2 flex flex-wrap gap-x-6 gap-y-1.5 text-xs font-medium">
          {["Ensure all hashtags and links are correct", "Check that content doesn't violate platform policies", "Verify images and videos display correctly"].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <Check className="size-3.5" strokeWidth={3} /> {t}
            </span>
          ))}
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-end gap-3 border-t border-black/[0.06] pt-5">
        <Button variant="outline" onClick={onBack} disabled={submitting} className="text-ink h-11 rounded-lg border-black/15 px-6 text-sm font-medium">
          Back
        </Button>
        <Button
          onClick={onConfirm}
          disabled={submitting}
          className="bg-brand-blue hover:bg-brand-blue-hover h-11 rounded-lg px-6 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? <Loader className="size-4 animate-spin" /> : null}
          {submitting ? "Publishing…" : "Publish Now"}
          {!submitting && <ArrowRight className="size-4" />}
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Success ---------------- */

function SuccessModal({
  count,
  note,
  onCreateNew,
  onGoToContent,
}: {
  count: number;
  note: string;
  onCreateNew: () => void;
  onGoToContent: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4" style={{ animation: "fade-in 200ms ease-out both" }}>
      <div
        className="flex w-full max-w-md flex-col items-center rounded-2xl bg-white px-6 py-9 text-center shadow-2xl"
        style={{ animation: "scale-in 260ms cubic-bezier(0.2,0.8,0.2,1) both" }}
      >
        <span className="grid size-16 place-items-center rounded-full bg-green-500 text-white" style={{ animation: "tick-pop 500ms cubic-bezier(0.2,0.8,0.2,1.4) both" }}>
          <Check className="size-8" strokeWidth={3} />
        </span>
        <h2 className="text-ink mt-5 text-2xl font-bold">Published Successfully!</h2>
        <p className="text-ink-muted mt-2 text-sm">
          Your content has been scheduled to {count} platform{count === 1 ? "" : "s"}.
          <br />
          {note}
        </p>
        <div className="mt-6 flex w-full items-center gap-3">
          <Button variant="outline" onClick={onCreateNew} className="text-ink h-11 flex-1 rounded-lg border-black/15 text-sm font-medium">
            <SparkleIcon className="size-4" />
            Create New Content
          </Button>
          <Button onClick={onGoToContent} className="bg-brand-blue hover:bg-brand-blue-hover h-11 flex-1 rounded-lg text-sm font-semibold text-white">
            Go To Platform Content
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
