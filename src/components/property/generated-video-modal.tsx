"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Download, Loader2, Mic, Play, RotateCcw, Sparkles, Trash2, Upload, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { saveVideoFile } from "@/lib/download";

/* ---- Generated video preview modal ---- */

export function GeneratedVideoModal({
  videoUrl,
  genId,
  title,
  sceneCount = 8,
  onClose,
  onAttach,
  attached = false,
  onRemove,
}: {
  videoUrl: string;
  genId?: string | null;
  title: string;
  sceneCount?: number;
  onClose: () => void;
  /** When provided, "Attach to Listing" shows a loader then calls this. */
  onAttach?: () => void;
  /** Whether the video is already attached to the listing. */
  attached?: boolean;
  /** When provided, "Remove" shows a confirm card then calls this. */
  onRemove?: () => void;
}) {
  const [downloaded, setDownloaded] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  function attachToListing() {
    if (!onAttach) {
      onClose();
      return;
    }
    setAttaching(true);
    window.setTimeout(() => {
      setAttaching(false);
      onAttach();
    }, 1800);
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function download() {
    const res = await saveVideoFile(videoUrl, `${title.replace(/[^\w-]+/g, "-") || "property-video"}.mp4`);
    if (res === "saved") {
      setDownloaded(true);
      window.setTimeout(() => setDownloaded(false), 2500);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/45" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
          onClick={(e) => e.stopPropagation()}
          style={{ animation: "scale-in 200ms ease-out both" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-ink text-xl font-bold">Your Property Video is Ready to Shine ✨</h2>
              <p className="text-ink-muted mt-1 text-sm">
                Preview your AI-generated video. Regenerate, download instantly or attach to listing.
              </p>
            </div>
            <button onClick={onClose} aria-label="Close" className="text-ink-muted hover:text-ink grid size-9 shrink-0 place-items-center rounded-full bg-black/[0.04]">
              <X className="size-5" />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-green-500 text-white">
              <Check className="size-4" strokeWidth={3} />
            </span>
            <p className="font-semibold text-green-700">{attached ? "Video Attached Successfully!" : "Your Video is Ready"}</p>
          </div>

          <div className="relative mt-4 overflow-hidden rounded-2xl bg-black">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video src={videoUrl} controls autoPlay className="max-h-[440px] w-full bg-black object-contain" />
            <span className="pointer-events-none absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-ink shadow-sm">
              <Sparkles className="text-accent-blue size-3" /> AI Generated
            </span>
            {genId && (
              <button
                onClick={() => setVoiceOpen(true)}
                className="text-brand-orange absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-sm hover:bg-white/90"
              >
                <span className="bg-brand-orange size-1.5 rounded-full" /> Add Voice
              </button>
            )}
            {downloaded && (
              <div className="absolute inset-0 grid place-items-center bg-black/40" style={{ animation: "fade-in 160ms ease-out both" }}>
                <div className="flex flex-col items-center rounded-2xl bg-white px-8 py-6 text-center shadow-2xl">
                  <span className="grid size-12 place-items-center rounded-full bg-green-500 text-white">
                    <Check className="size-7" strokeWidth={3} />
                  </span>
                  <p className="text-ink mt-3 font-bold">Download Complete</p>
                </div>
              </div>
            )}
            {attaching && (
              <div className="absolute inset-0 grid place-items-center bg-black/40" style={{ animation: "fade-in 160ms ease-out both" }}>
                <div className="flex max-w-sm flex-col items-center rounded-2xl bg-white px-8 py-7 text-center shadow-2xl">
                  <Loader2 className="text-accent-blue size-8 animate-spin" />
                  <p className="text-ink mt-4 text-lg font-bold">Attaching Video to Your Listing</p>
                  <p className="text-ink-muted mt-1 text-sm">
                    Please wait while we securely add your AI video tour to the property listing.
                  </p>
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
                <span className="text-ink absolute top-1 left-1 rounded bg-white/85 px-1 text-[10px] font-semibold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {i === 0 && <Play className="size-4 fill-white text-white/90" />}
              </span>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-black/[0.06] pt-5">
            <Button variant="outline" onClick={onClose} className="text-accent-blue h-11 rounded-lg border-black/15 px-5 text-sm font-semibold">
              <RotateCcw className="size-4" /> Regenerate New Video
            </Button>
            <Button variant="outline" onClick={download} disabled={attaching} className="text-accent-blue h-11 rounded-lg border-black/15 px-5 text-sm font-semibold">
              <Download className="size-4" /> Download
            </Button>
            {attached ? (
              <Button onClick={() => setConfirmRemove(true)} className="h-11 rounded-lg bg-red-500 px-5 text-sm font-semibold text-white hover:bg-red-600">
                Remove
              </Button>
            ) : (
              <Button onClick={attachToListing} disabled={attaching} className="bg-brand-blue hover:bg-brand-blue-hover h-11 rounded-lg px-5 text-sm font-semibold text-white disabled:opacity-60">
                Attach to Listing <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {voiceOpen && genId && (
        <AddVoiceOverlay videoUrl={videoUrl} genId={genId} title={title} onClose={() => setVoiceOpen(false)} />
      )}

      {confirmRemove && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/45 p-4" onClick={(e) => e.stopPropagation()}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl" style={{ animation: "scale-in 200ms ease-out both" }}>
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-red-50 text-red-500">
              <Trash2 className="size-6" />
            </span>
            <h3 className="text-ink mt-4 text-lg font-bold">Remove Video from Listing?</h3>
            <p className="text-ink-muted mt-1 text-sm">
              Please confirm if you want to delete this generated video from your property listing.
            </p>
            <div className="mt-5 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmRemove(false)}
                className="text-ink h-11 flex-1 rounded-lg border-black/15 text-sm font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setConfirmRemove(false);
                  onRemove?.();
                  onClose();
                }}
                className="h-11 flex-1 rounded-lg bg-red-500 text-sm font-semibold text-white hover:bg-red-600"
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Add Voice overlay (record/upload narration onto the AI video) ---- */

function AddVoiceOverlay({
  videoUrl,
  genId,
  title,
  onClose,
}: {
  videoUrl: string;
  genId: string;
  title: string;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"record" | "upload">("record");
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audio, setAudio] = useState<{ blob: Blob; name: string; url: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ approved: boolean; reason?: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<string | null>(null);

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
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [onClose]);

  const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const setAudioFrom = (blob: Blob, name: string) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(blob);
    urlRef.current = url;
    setAudio({ blob, name, url });
    setResult(null);
  };

  async function startRec() {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = () => {
        setAudioFrom(new Blob(chunksRef.current, { type: "audio/webm" }), "voiceover.webm");
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      recRef.current = mr;
      setElapsed(0);
      setRecording(true);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch {
      setErr("Microphone access was blocked. Allow mic access, or use Upload Audio instead.");
    }
  }
  function stopRec() {
    recRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  async function save() {
    if (!audio) return;
    setSubmitting(true);
    setErr(null);
    try {
      const file = new File([audio.blob], audio.name, { type: audio.blob.type || "audio/webm" });
      const res = await api.video.addAudio(genId, file);
      setResult(res);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Couldn't attach the audio. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/55" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
          onClick={(e) => e.stopPropagation()}
          style={{ animation: "scale-in 200ms ease-out both" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="bg-accent-blue/10 text-accent-blue grid size-10 shrink-0 place-items-center rounded-full">
                <Mic className="size-5" />
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

          <div className="mt-4 flex items-center gap-2.5">
            <span className="bg-accent-blue/10 text-accent-blue grid size-9 shrink-0 place-items-center rounded-lg">
              <Video className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-ink truncate text-sm font-semibold">{title}</p>
              <p className="text-ink-muted truncate text-xs">Video Generated successfully</p>
            </div>
          </div>
          <div className="mt-3 overflow-hidden rounded-xl bg-black">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video src={videoUrl} controls className="max-h-[260px] w-full bg-black object-contain" />
          </div>

          {result ? (
            <div className={cn("mt-4 rounded-xl border px-4 py-3", result.approved ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50")}>
              <p className={cn("flex items-center gap-2 text-sm font-semibold", result.approved ? "text-green-700" : "text-amber-700")}>
                <Check className="size-4" strokeWidth={3} />
                {result.approved ? "Voiceover attached to your video" : "Audio not approved"}
              </p>
              {result.reason && <p className="text-ink-muted mt-1 text-xs">{result.reason}</p>}
              <button onClick={onClose} className="bg-brand-blue hover:bg-brand-blue-hover mt-3 h-10 w-full rounded-lg text-sm font-semibold text-white">
                Done
              </button>
            </div>
          ) : tab === "record" ? (
            <div className="border-brand-orange/40 bg-brand-orange/[0.06] mt-4 flex items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-4">
              <div className="flex items-center gap-3">
                <span className={cn("grid size-11 place-items-center rounded-full text-white", recording ? "animate-pulse bg-red-500" : "bg-brand-orange")}>
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
                <Mic className="size-4" /> {recording ? "Stop" : audio ? "Re-record" : "Start Recording"}
              </button>
            </div>
          ) : (
            <div className="mt-4">
              <button
                onClick={() => fileRef.current?.click()}
                className="border-accent-blue/30 bg-accent-blue/[0.03] hover:bg-accent-blue/[0.07] flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-sm font-semibold"
              >
                <Upload className="text-accent-blue size-5" /> Drag &amp; drop or click to upload audio
              </button>
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

          {audio && !result && (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <audio src={audio.url} controls className="mt-3 w-full" />
          )}
          {err && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}

          <div className="bg-accent-blue/[0.06] mt-4 flex items-center gap-2 rounded-lg px-3 py-2.5">
            <Mic className="text-accent-blue size-4 shrink-0" />
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

