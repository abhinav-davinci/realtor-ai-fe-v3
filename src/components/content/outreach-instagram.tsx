"use client";

/**
 * Instagram publishing studio for the Outreach section. The realtor composes a
 * Reel or a Photo post, sees it render live in a phone mockup, and publishes
 * (or schedules) it. Frontend-only over the mock listings / videos; published
 * posts are kept in localStorage (see src/lib/outreach.ts), no backend touched.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  Calendar,
  Check,
  ChevronDown,
  Clapperboard,
  Globe,
  Hash,
  Image as ImageIcon,
  Images,
  Link2,
  MapPin,
  MessageSquareOff,
  Play,
  Plus,
  Send,
  SlidersHorizontal,
  Sparkles,
  Unplug,
  Upload,
  Video as VideoIcon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_LISTINGS, MOCK_VIDEOS } from "@/lib/mock-data";
import type { ListingItem, VideoStatusResponse } from "@/lib/api";
import {
  IG_ACCOUNT,
  igKindFor,
  saveIgPost,
  seedIgPosts,
  type IgPost,
  type TabKey,
} from "@/lib/outreach";
import { ConfirmDialog, EASE_OUT, StatusPill } from "./outreach-shared";
import { FacebookGlyph, InstagramGlyph } from "./brand-glyphs";
import { IgPreview } from "./outreach-ig-preview";
import { InstagramPosts } from "./outreach-ig-posts";

const CAPTION_MAX = 2200;
const MAX_SLIDES = 10;

const HASHTAGS = [
  "#Pune", "#RealEstate", "#PropertyTour", "#NewListing",
  "#DreamHome", "#PuneProperties", "#LuxuryHomes", "#RealtorLife",
];

/* -------------------------------- studio ---------------------------------- */

export function InstagramStudio({
  tab,
  onNavigate,
  onDisconnect,
}: {
  tab: TabKey;
  onNavigate: (t: TabKey) => void;
  onDisconnect: () => void;
}) {
  // Seed the demo gallery once, the moment the studio opens, so Posts is never
  // empty even if the realtor publishes before ever opening that tab.
  useEffect(() => {
    seedIgPosts();
  }, []);

  // Posts is a full-width gallery, so its tabs sit above it. Compose keeps its
  // tabs inside the left column (see InstagramComposer) so the preview can take
  // the full height of the right column.
  if (tab === "posts") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <IgTabs active="posts" onNavigate={onNavigate} />
        <div className="flex min-h-0 flex-1 flex-col pt-5">
          <InstagramPosts onNavigate={onNavigate} />
        </div>
      </div>
    );
  }
  return <InstagramComposer onNavigate={onNavigate} onDisconnect={onDisconnect} />;
}

/** Compose / Posts tab bar (accent underline), matching the shell's tab style. */
function IgTabs({ active, onNavigate }: { active: TabKey; onNavigate: (t: TabKey) => void }) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: "compose", label: "Compose" },
    { key: "posts", label: "Posts" },
  ];
  return (
    <div className="relative flex shrink-0 gap-6 border-b border-black/[0.08]">
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onNavigate(t.key)}
            className={cn(
              "relative -mb-px border-b-2 pb-3 text-sm font-medium transition-colors outline-none",
              isActive ? "border-accent-blue text-accent-blue" : "border-transparent text-ink-muted hover:text-ink"
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------- composer --------------------------------- */

type PostType = "reel" | "photo";
type ReelSource = "video" | "url";
type PhotoSource = "property" | "upload" | "url";

interface PhotoItem {
  id: string;
  url: string;
  /** Object URLs (uploads) need revoking on removal/unmount. */
  blob?: boolean;
}

const COMPLETED_VIDEOS = MOCK_VIDEOS.filter((v) => v.status === "completed");

function videoThumb(v: VideoStatusResponse): string | null {
  return v.images?.[0]?.s3_key ?? null;
}
function listingThumb(l: ListingItem): string | null {
  return l.images?.[0]?.preview_url ?? l.images?.[0]?.s3_key ?? null;
}
function priceLabel(l: ListingItem): string {
  if (!l.price) return "";
  return l.property_available_for === "Rent" ? `₹${l.price}/mo` : `₹${l.price}`;
}
function fmtDate(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function InstagramComposer({ onNavigate, onDisconnect }: { onNavigate: (t: TabKey) => void; onDisconnect: () => void }) {
  const [postType, setPostType] = useState<PostType>("reel");

  // reel state
  const [reelSource, setReelSource] = useState<ReelSource>("video");
  const [videoId, setVideoId] = useState<string | null>(COMPLETED_VIDEOS[0]?.id ?? null);
  const [reelUrl, setReelUrl] = useState("");
  const [coverIdx, setCoverIdx] = useState(0);

  // photo state — one ordered list, fed by any of the three sources
  const [photoSource, setPhotoSource] = useState<PhotoSource>("property");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [urlDraft, setUrlDraft] = useState("");

  // shared
  const [caption, setCaption] = useState("");
  const [crossFb, setCrossFb] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [location, setLocation] = useState("");
  const [hideLikes, setHideLikes] = useState(false);
  const [noComments, setNoComments] = useState(false);
  const [schedule, setSchedule] = useState(false);
  const [scheduleAt, setScheduleAt] = useState(() => defaultScheduleValue());
  const [published, setPublished] = useState<IgPost | null>(null);
  const suggestN = useRef(0);

  const selectedVideo = useMemo(() => COMPLETED_VIDEOS.find((v) => v.id === videoId) ?? null, [videoId]);
  const coverUrl =
    reelSource === "video" ? selectedVideo?.images?.[coverIdx]?.s3_key ?? videoThumb(selectedVideo ?? ({} as VideoStatusResponse)) ?? null : null;

  // revoke object URLs when photos drop / on unmount
  useEffect(
    () => () => {
      photos.forEach((p) => p.blob && URL.revokeObjectURL(p.url));
    },
    [photos]
  );

  const previewMedia = postType === "reel" ? (coverUrl ? [coverUrl] : []) : photos.map((p) => p.url);
  const reelReady = reelSource === "video" ? !!selectedVideo : reelUrl.trim().length > 5;
  const hasContent = postType === "reel" ? reelReady : photos.length > 0;
  const scheduleValid = !schedule || scheduleAt.trim().length > 0;
  const canPublish = hasContent && scheduleValid;

  function togglePhotoFromListing(l: ListingItem) {
    const id = `prop-${l.id}`;
    const url = listingThumb(l);
    if (!url) return;
    setPhotos((arr) => {
      const exists = arr.find((p) => p.id === id);
      if (exists) return arr.filter((p) => p.id !== id);
      if (arr.length >= MAX_SLIDES) return arr;
      return [...arr, { id, url }];
    });
  }
  function addUploads(files: FileList | null) {
    if (!files) return;
    setPhotos((arr) => {
      const room = MAX_SLIDES - arr.length;
      const next = Array.from(files)
        .slice(0, Math.max(0, room))
        .map((f, i) => ({ id: `up-${Date.now()}-${i}`, url: URL.createObjectURL(f), blob: true }));
      return [...arr, ...next];
    });
  }
  function addUrlImage() {
    const u = urlDraft.trim();
    if (!u) return;
    setPhotos((arr) => (arr.length >= MAX_SLIDES ? arr : [...arr, { id: `url-${Date.now()}`, url: u }]));
    setUrlDraft("");
  }
  function removePhoto(id: string) {
    setPhotos((arr) => {
      const hit = arr.find((p) => p.id === id);
      if (hit?.blob) URL.revokeObjectURL(hit.url);
      return arr.filter((p) => p.id !== id);
    });
  }
  function movePhoto(id: string, dir: -1 | 1) {
    setPhotos((arr) => {
      const i = arr.findIndex((p) => p.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= arr.length) return arr;
      const next = arr.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function suggest() {
    const title =
      postType === "reel"
        ? selectedVideo?.name ?? "this property"
        : MOCK_LISTINGS.find((l) => `prop-${l.id}` === photos[0]?.id)?.property_title ?? "this home";
    const variants = [
      `Now showing: ${title}. Natural light, smart layout, and a location that works. DM to book a private visit.\n\n#Pune #RealEstate #PropertyTour #DreamHome`,
      `${title} just dropped. The kind of home you stop scrolling for. Save this and send us a message for the full tour.\n\n#PuneProperties #NewListing #RealtorLife`,
      `Take a look around ${title}. Tap the link in bio or DM us, and we will set up a viewing this week.\n\n#RealEstate #Pune #LuxuryHomes`,
    ];
    const next = variants[suggestN.current % variants.length].slice(0, CAPTION_MAX);
    suggestN.current += 1;
    setCaption(next);
  }
  function addHashtag(tag: string) {
    setCaption((c) => {
      if (c.includes(tag)) return c;
      const joined = c.trim().length ? `${c.replace(/\s+$/, "")} ${tag}` : tag;
      return joined.slice(0, CAPTION_MAX);
    });
  }

  function publish() {
    if (!canPublish) return;
    const kind = igKindFor(postType, postType === "reel" ? 1 : photos.length);
    const post: IgPost = {
      id: `ig-${Date.now()}`,
      kind,
      status: schedule ? "scheduled" : "published",
      caption: caption.trim(),
      media: postType === "reel" ? (coverUrl ? [coverUrl] : []) : photos.map((p) => p.url),
      videoUrl: postType === "reel" ? selectedVideo?.video_url ?? (reelSource === "url" ? reelUrl.trim() : null) : null,
      account: IG_ACCOUNT,
      at: schedule ? new Date(scheduleAt).getTime() || Date.now() : Date.now(),
      likes: 0,
      comments: 0,
      views: postType === "reel" ? 0 : undefined,
    };
    saveIgPost(post);
    setPublished(post);
  }

  function resetAll() {
    setPublished(null);
    setCaption("");
    setPhotos((arr) => {
      arr.forEach((p) => p.blob && URL.revokeObjectURL(p.url));
      return [];
    });
    setReelUrl("");
    setCrossFb(false);
    setSchedule(false);
    setAdvanced(false);
    setLocation("");
    setHideLikes(false);
    setNoComments(false);
  }

  const verb = schedule ? "Schedule" : "Publish";
  const noun = postType === "reel" ? "Reel" : photos.length > 1 ? "Carousel" : "Photo";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* left column: tabs + post-type + the scrolling form. Keeping these in a
            column (not full width) lets the preview take the full height beside it. */}
        <div className="flex min-h-0 min-w-0 flex-col">
          <IgTabs active="compose" onNavigate={onNavigate} />
          <div className="shrink-0 pt-5 pb-4">
            <div className="inline-flex rounded-xl border border-black/[0.08] bg-black/[0.02] p-1">
              <TypeTab active={postType === "reel"} icon={Clapperboard} label="Reel" onClick={() => setPostType("reel")} />
              <TypeTab active={postType === "photo"} icon={ImageIcon} label="Photo" onClick={() => setPostType("photo")} />
            </div>
          </div>
          {/* form scrolls on its own so the preview can stay whole */}
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pb-6 lg:pr-1">
          {/* account */}
          <Section label="Instagram account">
            <AccountSelect onDisconnect={onDisconnect} />
          </Section>

          {/* media */}
          {postType === "reel" ? (
            <Section label="Reel video">
              <Seg
                value={reelSource}
                onChange={(v) => setReelSource(v as ReelSource)}
                options={[
                  { value: "video", label: "Generated videos", icon: Clapperboard },
                  { value: "url", label: "Video URL", icon: Link2 },
                ]}
              />
              {reelSource === "video" ? (
                COMPLETED_VIDEOS.length ? (
                  <div className="grid grid-cols-2 gap-3">
                    {COMPLETED_VIDEOS.map((v) => (
                      <VideoCard
                        key={v.id}
                        video={v}
                        selected={videoId === v.id}
                        onSelect={() => {
                          setVideoId(v.id);
                          setCoverIdx(0);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyHint icon={Clapperboard} text="No generated videos yet. Create one in the video studio, or paste a URL." />
                )
              ) : (
                <Field label="Video URL" hint="A public MP4 link">
                  <input
                    value={reelUrl}
                    onChange={(e) => setReelUrl(e.target.value)}
                    placeholder="https://yourcdn.com/reel.mp4"
                    className={INPUT}
                  />
                </Field>
              )}

              {/* cover frame picker */}
              {reelSource === "video" && selectedVideo && (selectedVideo.images?.length ?? 0) > 1 && (
                <Field label="Cover frame" optional>
                  <div className="flex flex-wrap gap-2">
                    {selectedVideo.images.map((im, i) => (
                      <button
                        key={im.s3_key + i}
                        type="button"
                        onClick={() => setCoverIdx(i)}
                        aria-label={`Use frame ${i + 1} as cover`}
                        className={cn(
                          "relative size-14 overflow-hidden rounded-lg ring-2 transition-all active:scale-95",
                          coverIdx === i ? "ring-accent-blue" : "ring-transparent hover:ring-black/15"
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={im.s3_key} alt="" className="size-full object-cover" />
                        {coverIdx === i && (
                          <span className="bg-accent-blue/20 absolute inset-0 grid place-items-center">
                            <span className="bg-accent-blue grid size-5 place-items-center rounded-full text-white">
                              <Check className="size-3" />
                            </span>
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </Field>
              )}
            </Section>
          ) : (
            <Section label={`Photos`} hint={`${photos.length}/${MAX_SLIDES}`}>
              <Seg
                value={photoSource}
                onChange={(v) => setPhotoSource(v as PhotoSource)}
                options={[
                  { value: "property", label: "Properties", icon: Building2 },
                  { value: "upload", label: "Upload", icon: Upload },
                  { value: "url", label: "Image URLs", icon: Link2 },
                ]}
              />

              {photoSource === "property" && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {MOCK_LISTINGS.filter(listingThumb).map((l) => {
                    const idx = photos.findIndex((p) => p.id === `prop-${l.id}`);
                    return (
                      <PropertyCard
                        key={l.id}
                        listing={l}
                        order={idx >= 0 ? idx + 1 : null}
                        full={photos.length >= MAX_SLIDES}
                        onToggle={() => togglePhotoFromListing(l)}
                      />
                    );
                  })}
                </div>
              )}

              {photoSource === "upload" && (
                <label
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-black/15 py-8 text-center transition-colors",
                    photos.length >= MAX_SLIDES
                      ? "pointer-events-none opacity-50"
                      : "hover:border-accent-blue/50 hover:bg-accent-blue/[0.03]"
                  )}
                >
                  <Upload className="text-ink-muted size-5" />
                  <span className="text-ink text-sm font-medium">Add photos</span>
                  <span className="text-ink-muted/70 text-xs">JPG or PNG, up to {MAX_SLIDES} images</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addUploads(e.target.files)} />
                </label>
              )}

              {photoSource === "url" && (
                <div className="flex gap-2">
                  <input
                    value={urlDraft}
                    onChange={(e) => setUrlDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrlImage())}
                    placeholder="https://images.example.com/photo.jpg"
                    className={INPUT}
                  />
                  <button
                    type="button"
                    onClick={addUrlImage}
                    disabled={!urlDraft.trim() || photos.length >= MAX_SLIDES}
                    className="bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/15 grid size-11 shrink-0 place-items-center rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Plus className="size-5" />
                  </button>
                </div>
              )}

              {/* selected media tray */}
              {photos.length > 0 && (
                <div>
                  <div className="text-ink-muted mb-2 flex items-center justify-between text-xs font-medium">
                    <span>
                      {photos.length} selected{photos.length > 1 ? " · Carousel" : ""}
                    </span>
                    {photos.length > 1 && <span className="text-ink-muted/70">Drag order with the arrows</span>}
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {photos.map((p, i) => (
                      <TrayThumb
                        key={p.id}
                        url={p.url}
                        index={i}
                        count={photos.length}
                        onRemove={() => removePhoto(p.id)}
                        onMoveLeft={() => movePhoto(p.id, -1)}
                        onMoveRight={() => movePhoto(p.id, 1)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* caption */}
          <Section label="Caption">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-ink text-sm font-medium">Write a caption</label>
                <button
                  type="button"
                  onClick={suggest}
                  className="text-accent-blue bg-accent-blue/[0.06] hover:bg-accent-blue/10 inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors active:scale-95"
                >
                  <Sparkles className="size-3.5" />
                  Write with AI
                </button>
              </div>
              <textarea
                value={caption}
                maxLength={CAPTION_MAX}
                onChange={(e) => setCaption(e.target.value)}
                rows={5}
                placeholder={`Write a caption for your ${postType}...`}
                className={cn(INPUT, "h-auto resize-y py-2.5 leading-relaxed")}
              />
              <div className="mt-1 flex items-center justify-between">
                <span className="text-ink-muted/70 inline-flex items-center gap-1 text-[11px]">
                  <Hash className="size-3" /> Tip: add 3 to 5 hashtags
                </span>
                <span
                  className={cn(
                    "text-[11px] tabular-nums",
                    caption.length >= CAPTION_MAX * 0.95 ? "text-brand-orange font-semibold" : "text-ink-muted/60"
                  )}
                >
                  {caption.length}/{CAPTION_MAX}
                </span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {HASHTAGS.map((t) => {
                  const on = caption.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => addHashtag(t)}
                      disabled={on}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                        on
                          ? "border-accent-blue/30 bg-accent-blue/[0.06] text-accent-blue/70 cursor-default"
                          : "text-ink-muted hover:border-accent-blue/40 hover:text-accent-blue border-black/12"
                      )}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </Section>

          {/* cross-post */}
          <Section label="Share to">
            <ToggleRow
              icon={<FacebookGlyph className="size-5" />}
              title="Also share to Facebook"
              desc="Cross-post this to your connected Skyline Realty Page."
              checked={crossFb}
              onChange={setCrossFb}
            />
          </Section>

          {/* advanced */}
          <section>
            <button
              type="button"
              onClick={() => setAdvanced((a) => !a)}
              className="text-ink hover:bg-black/[0.02] flex w-full items-center gap-2 rounded-lg py-1.5 text-sm font-semibold"
            >
              <SlidersHorizontal className="text-ink-muted size-4" />
              Advanced settings
              <ChevronDown className={cn("text-ink-muted ml-auto size-4 transition-transform duration-200", advanced && "rotate-180")} />
            </button>
            {advanced && (
              <div
                className="mt-2 space-y-4 rounded-xl border border-black/[0.08] bg-white p-4 sm:p-5"
                style={{ animation: `fade-in-up 200ms ${EASE_OUT} both` }}
              >
                <Field label="Add location" optional>
                  <div className="relative">
                    <MapPin className="text-ink-muted absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Baner, Pune"
                      className={cn(INPUT, "pl-9")}
                    />
                  </div>
                </Field>
                <ToggleRow
                  icon={<Globe className="text-ink-muted size-5" />}
                  title="Hide like and view counts"
                  desc="Only you will see the totals on this post."
                  checked={hideLikes}
                  onChange={setHideLikes}
                />
                <ToggleRow
                  icon={<MessageSquareOff className="text-ink-muted size-5" />}
                  title="Turn off commenting"
                  desc="No one can comment on this post."
                  checked={noComments}
                  onChange={setNoComments}
                />
              </div>
            )}
          </section>

          {/* schedule */}
          <Section label="When to publish">
            <div className="grid grid-cols-2 gap-2.5">
              <ScheduleChoice active={!schedule} icon={Send} title="Publish now" desc="Goes live immediately" onClick={() => setSchedule(false)} />
              <ScheduleChoice active={schedule} icon={Calendar} title="Schedule" desc="Pick a date and time" onClick={() => setSchedule(true)} />
            </div>
            {schedule && (
              <div style={{ animation: `fade-in-up 200ms ${EASE_OUT} both` }}>
                <Field label="Date and time" required>
                  <input
                    type="datetime-local"
                    value={scheduleAt}
                    onChange={(e) => setScheduleAt(e.target.value)}
                    className={INPUT}
                  />
                </Field>
              </div>
            )}
          </Section>

          {/* publish */}
          <div className="pt-1">
            <PublishButton canPublish={canPublish} label={`${verb} ${noun}`} onClick={publish} />
            {!canPublish && (
              <p className="text-ink-muted mt-2 text-center text-xs">
                {postType === "reel" ? "Select a video or paste a URL to publish." : "Add at least one photo to publish."}
              </p>
            )}
          </div>
          </div>
        </div>

        {/* ------------------------------ preview ------------------------------ */}
        <aside className="hidden min-h-0 lg:flex lg:flex-col lg:pb-6">
          <p className="text-ink-muted mb-2.5 shrink-0 text-center text-xs font-medium">Live preview</p>
          <div className="flex min-h-0 flex-1 justify-center">
            {/* fills the column height; clamped so the phone keeps a natural ratio */}
            <div className="h-full max-h-[720px] min-h-[460px]">
              <IgPreview
                kind={postType}
                media={previewMedia}
                hasVideo={postType === "reel" && reelReady}
                caption={caption}
                account={IG_ACCOUNT}
              />
            </div>
          </div>
        </aside>
      </div>

      {published && (
        <SuccessDialog
          post={published}
          onViewPosts={() => {
            setPublished(null);
            onNavigate("posts");
          }}
          onAnother={resetAll}
        />
      )}
    </div>
  );
}

function defaultScheduleValue(): string {
  // tomorrow at 10:00, formatted for <input type="datetime-local">
  const d = new Date(Date.now() + 86_400_000);
  d.setHours(10, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ------------------------------- pieces ----------------------------------- */

function TypeTab({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof ImageIcon; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-colors active:scale-[0.98]",
        active ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink"
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}

function AccountSelect({ onDisconnect }: { onDisconnect: () => void }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const avatar = (size: string) => (
    <span
      className={cn("grid shrink-0 place-items-center rounded-full p-[1.5px]", size)}
      style={{ background: "linear-gradient(45deg,#FEDA75,#FA7E1E,#D62976,#962FBF,#4F5BD5)" }}
    >
      <span className="grid size-full place-items-center rounded-full bg-white">
        <InstagramGlyph className="size-[70%]" />
      </span>
    </span>
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="hover:border-black/25 flex w-full items-center gap-3 rounded-lg border border-black/15 bg-white px-3.5 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent-blue/40"
      >
        {avatar("size-9")}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-ink truncate text-sm font-semibold">{IG_ACCOUNT}</span>
            <StatusPill tone="good" dot>
              Connected
            </StatusPill>
          </span>
          <span className="text-ink-muted block text-xs">Business account · 2,480 followers</span>
        </span>
        <ChevronDown className={cn("text-ink-muted size-4 shrink-0 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="menu"
            className="absolute top-full right-0 left-0 z-40 mt-1.5 overflow-hidden rounded-xl border border-black/[0.08] bg-white p-1 shadow-lg shadow-black/[0.08]"
            style={{ animation: `scale-in 150ms ${EASE_OUT} both`, transformOrigin: "top" }}
          >
            <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
              {avatar("size-8")}
              <span className="min-w-0 flex-1">
                <span className="text-ink block truncate text-sm font-medium">{IG_ACCOUNT}</span>
                <span className="text-ink-muted block text-[11px]">Connected via Meta Business</span>
              </span>
              <Check className="text-accent-blue size-4 shrink-0" />
            </div>
            <div className="my-1 h-px bg-black/[0.06]" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setConfirm(true);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-red-500 outline-none transition-colors hover:bg-red-50"
            >
              <Unplug className="size-4" />
              Disconnect account
            </button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirm}
        title="Disconnect Instagram?"
        message={`You will not be able to publish to ${IG_ACCOUNT} until you reconnect. Posts already published stay on Instagram.`}
        confirmLabel="Disconnect"
        onConfirm={() => {
          setConfirm(false);
          onDisconnect();
        }}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
}

function VideoCard({ video, selected, onSelect }: { video: VideoStatusResponse; selected: boolean; onSelect: () => void }) {
  const thumb = videoThumb(video);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group relative overflow-hidden rounded-xl border text-left transition-all active:scale-[0.99]",
        selected ? "border-accent-blue ring-2 ring-accent-blue/30" : "border-black/[0.08] hover:border-black/20"
      )}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-black/[0.04]">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        ) : (
          <div className="grid size-full place-items-center text-ink-muted/40">
            <VideoIcon className="size-7" />
          </div>
        )}
        <span className="absolute top-1.5 left-1.5 grid size-7 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm">
          <Play className="size-3.5 fill-white" />
        </span>
        {selected && (
          <span className="bg-accent-blue absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full text-white shadow">
            <Check className="size-3" />
          </span>
        )}
      </div>
      <div className="px-2.5 py-2">
        <p className="text-ink truncate text-sm font-semibold">{video.name ?? "Untitled video"}</p>
        <p className="text-ink-muted text-[11px]">{fmtDate(video.created_at)}</p>
      </div>
    </button>
  );
}

function PropertyCard({
  listing,
  order,
  full,
  onToggle,
}: {
  listing: ListingItem;
  order: number | null;
  full: boolean;
  onToggle: () => void;
}) {
  const thumb = listingThumb(listing);
  const selected = order !== null;
  const disabled = full && !selected;
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "group relative overflow-hidden rounded-xl border text-left transition-all",
        disabled && "cursor-not-allowed opacity-50",
        selected ? "border-accent-blue ring-2 ring-accent-blue/30" : "border-black/[0.08] hover:border-black/20 active:scale-[0.99]"
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/[0.04]">
        {thumb && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        )}
        <span
          className={cn(
            "absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full text-xs font-bold ring-2 ring-white transition-all",
            selected ? "bg-accent-blue text-white" : "bg-white/80 text-transparent"
          )}
        >
          {selected ? order : ""}
        </span>
      </div>
      <div className="px-2.5 py-2">
        <p className="text-ink truncate text-[13px] font-semibold">{listing.property_title ?? "Untitled"}</p>
        <p className="text-ink-muted truncate text-[11px]">{[listing.locality, listing.city].filter(Boolean).join(", ")}</p>
        {priceLabel(listing) && <p className="text-accent-blue mt-0.5 text-xs font-semibold">{priceLabel(listing)}</p>}
      </div>
    </button>
  );
}

function TrayThumb({
  url,
  index,
  count,
  onRemove,
  onMoveLeft,
  onMoveRight,
}: {
  url: string;
  index: number;
  count: number;
  onRemove: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
}) {
  return (
    <div
      className="group relative size-20 overflow-hidden rounded-lg border border-black/[0.08]"
      style={{ animation: `scale-in 160ms ${EASE_OUT} both` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="size-full object-cover" />
      <span className="absolute top-1 left-1 grid size-5 place-items-center rounded-full bg-black/55 text-[10px] font-bold text-white">
        {index + 1}
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove image"
        className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500"
      >
        <X className="size-3" />
      </button>
      {count > 1 && (
        <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/55 to-transparent px-1 py-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={onMoveLeft}
            disabled={index === 0}
            aria-label="Move left"
            className="text-white disabled:opacity-30"
          >
            <ChevronDown className="size-4 rotate-90" />
          </button>
          <button
            type="button"
            onClick={onMoveRight}
            disabled={index === count - 1}
            aria-label="Move right"
            className="text-white disabled:opacity-30"
          >
            <ChevronDown className="size-4 -rotate-90" />
          </button>
        </div>
      )}
    </div>
  );
}

function ScheduleChoice({
  active,
  icon: Icon,
  title,
  desc,
  onClick,
}: {
  active: boolean;
  icon: typeof Send;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 text-left transition-[background-color,border-color] active:scale-[0.99]",
        active ? "border-accent-blue bg-accent-blue/[0.06]" : "border-black/12 bg-white hover:border-black/25"
      )}
    >
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg transition-colors", active ? "bg-accent-blue text-white" : "bg-black/[0.04] text-ink-muted")}>
        <Icon className="size-4.5" />
      </span>
      <span className="min-w-0">
        <span className="text-ink block text-sm font-semibold">{title}</span>
        <span className="text-ink-muted block text-xs">{desc}</span>
      </span>
    </button>
  );
}

/** The hero publish action — Instagram-gradient, platform-branded. */
function PublishButton({ canPublish, label, onClick }: { canPublish: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!canPublish}
      className={cn(
        "relative inline-flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-lg text-sm font-semibold text-white transition-transform duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40",
        canPublish ? "active:scale-[0.99]" : "cursor-not-allowed"
      )}
      style={
        canPublish
          ? { background: "linear-gradient(90deg,#FA7E1E,#D62976,#962FBF)" }
          : { background: "var(--color-ink-muted)", opacity: 0.4 }
      }
    >
      <Send className="size-4" />
      {label}
    </button>
  );
}

/* --------------------------- success dialog ------------------------------- */

function SuccessDialog({ post, onViewPosts, onAnother }: { post: IgPost; onViewPosts: () => void; onAnother: () => void }) {
  const scheduled = post.status === "scheduled";
  const when = new Date(post.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true">
      <div className="bg-ink/40 absolute inset-0" style={{ animation: `fade-in 150ms ${EASE_OUT} both` }} onClick={onAnother} aria-hidden />
      <div className="modal-pop relative w-full max-w-sm overflow-hidden rounded-2xl bg-white p-6 text-center shadow-2xl shadow-black/25">
        {/* gradient halo */}
        <div className="relative mx-auto grid size-20 place-items-center">
          <span
            className="absolute inset-0 rounded-full opacity-30 motion-safe:animate-ping"
            style={{ background: "linear-gradient(45deg,#FA7E1E,#D62976,#962FBF)", animationDuration: "1.6s" }}
          />
          <span
            className="relative grid size-16 place-items-center rounded-full text-white shadow-lg"
            style={{ background: "linear-gradient(45deg,#FA7E1E,#D62976,#962FBF)", animation: `scale-in 320ms ${EASE_OUT} both` }}
          >
            {scheduled ? <Calendar className="size-7" /> : <Check className="size-8" />}
          </span>
        </div>

        <h2 className="text-ink mt-4 text-lg font-bold">
          {scheduled ? `${post.kind === "reel" ? "Reel" : "Post"} scheduled` : `${post.kind === "reel" ? "Reel" : "Post"} published`}
        </h2>
        <p className="text-ink-muted mt-1 text-sm">
          {scheduled ? `It will go live on ${when}.` : `Your ${post.kind === "reel" ? "reel" : "post"} is now live on ${post.account}.`}
        </p>

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onViewPosts}
            className="bg-brand-blue hover:bg-brand-blue-hover inline-flex h-11 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold text-white transition-colors active:scale-[0.99]"
          >
            <Images className="size-4" />
            View in Posts
          </button>
          <button
            type="button"
            onClick={onAnother}
            className="text-ink h-11 rounded-lg border border-black/15 text-sm font-semibold transition-colors hover:bg-black/[0.04] active:scale-[0.99]"
          >
            Create another
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- atoms ----------------------------------- */

const INPUT =
  "text-ink placeholder:text-ink-muted/55 focus:border-accent-blue/50 h-11 w-full rounded-lg border border-black/15 bg-white px-3.5 text-sm outline-none transition-colors";

function Section({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2.5 flex items-center gap-2">
        <h3 className="text-ink-muted text-xs font-semibold tracking-wide uppercase">{label}</h3>
        {hint && <span className="text-ink-muted/70 text-xs normal-case tabular-nums">({hint})</span>}
      </div>
      <div className="space-y-4 rounded-xl border border-black/[0.08] bg-white p-4 sm:p-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  optional,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="text-ink text-sm font-medium">
          {label}
          {required && <span className="text-red-500"> *</span>}
          {optional && <span className="text-ink-muted/70 font-normal"> (optional)</span>}
        </label>
        {hint && <span className="text-ink-muted/60 text-[11px]">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Seg({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; icon: typeof Link2 }[];
}) {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl bg-black/[0.03] p-1">
      {options.map((o) => {
        const active = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors active:scale-[0.98]",
              active ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink"
            )}
          >
            <Icon className="size-4" />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function ToggleRow({
  icon,
  title,
  desc,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-black/[0.04]">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-ink text-sm font-medium">{title}</p>
        <p className="text-ink-muted text-xs">{desc}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={title} />
    </div>
  );
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40",
        checked ? "bg-accent-blue" : "bg-black/15"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200",
          checked && "translate-x-5"
        )}
      />
    </button>
  );
}

function EmptyHint({ icon: Icon, text }: { icon: typeof Clapperboard; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-black/12 py-8 text-center">
      <Icon className="text-ink-muted/50 size-6" />
      <p className="text-ink-muted max-w-xs text-sm">{text}</p>
    </div>
  );
}
