"use client";

import { createElement, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Bike,
  Building2,
  Camera,
  Car,
  Check,
  CircleCheck,
  Download,
  Dumbbell,
  Eye,
  Gamepad2,
  Leaf,
  Lightbulb,
  Loader2,
  Mic,
  Maximize2,
  MapPin,
  Minus,
  Pause,
  PawPrint,
  Pencil,
  Play,
  Plug,
  Plus,
  RotateCcw,
  Sparkles,
  Square,
  Sun,
  Target,
  Trash2,
  Trees,
  TrendingUp,
  Upload,
  Users,
  Video,
  Waves,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { saveVideoFile } from "@/lib/download";
import { CreateVideoModal } from "./create-video-modal";
import { GeneratedVideoModal } from "./generated-video-modal";

const TARGET_TRANSCRIPT =
  "Hi, I want to list a 3BHK apartment in Koregaon Park, Pune. The building name is Sunshine Apartments. It's around 1200 square feet. I'm looking for 45 lakhs for this property. It has great amenities like gym, swimming pool, and dedicated parking.";

const SPEAK_FIELDS = [
  "Property Title & Type",
  "Category (2BHK/3BHK)",
  "Chargeable Area (in Sq. ft)",
  "Location (City, Locality)",
  "Building Name",
  "Price/Rent",
  "Key Amenities",
];

const QUICK_TIPS = [
  "Speak clearly in a quiet environment",
  "Include as many details as possible for better listing",
  "Don't worry about the order - our AI will organize it",
];

const PRO_TIP =
  "The more accurate your property details are, the better your listing visibility and recommendations will be";

interface CapturedField {
  label: string;
  value: string;
  captured: boolean;
}

const PREVIEW_IMAGES = [
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80",
];

const VIDEO_STATS: { icon: LucideIcon; value: string; label: string }[] = [
  { icon: TrendingUp, value: "+300%", label: "Engagement" },
  { icon: Eye, value: "Top", label: "Rankings" },
  { icon: Sparkles, value: "Premium", label: "Stand Out" },
];

const CONFETTI_COLORS = ["#1c9e57", "#2f6bed", "#ef8e2b", "#e23b58", "#f0d59a", "#6d3bf5", "#16b8c4"];
const CONFETTI = Array.from({ length: 28 }, (_, i) => {
  const rad = ((-162 + (i / 27) * 144) * Math.PI) / 180;
  const dist = 70 + (i % 5) * 18;
  const peakY = Math.round(Math.sin(rad) * dist);
  const shape = i % 3;
  return {
    tx: Math.round(Math.cos(rad) * dist),
    peakY,
    fallY: peakY + 120 + (i % 5) * 14,
    r: (i % 2 ? 1 : -1) * (200 + (i % 4) * 80),
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: (i % 5) * 30,
    w: shape === 1 ? 4 : 6,
    h: shape === 1 ? 10 : 6,
    round: shape === 0,
  };
});

const fmtTime = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex h-9 items-center justify-center gap-1">
      {Array.from({ length: 27 }, (_, i) => (
        <span
          key={i}
          className="bg-brand-orange w-1 origin-center rounded-full"
          style={{
            height: 28,
            animation: active ? "voice-wave 900ms ease-in-out infinite" : "none",
            animationDelay: `${(i % 9) * 90}ms`,
            transform: active ? undefined : "scaleY(0.25)",
            opacity: 0.4 + ((i % 5) * 0.12),
          }}
        />
      ))}
    </div>
  );
}

function Radial({ value }: { value: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div className="relative grid size-24 place-items-center">
      <svg className="size-24 -rotate-90" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" strokeWidth="5" className="stroke-green-100" />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          className="stroke-green-500 transition-[stroke-dashoffset] duration-500"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <span className="text-ink absolute text-xl font-bold">{value}%</span>
    </div>
  );
}

function FieldCapturedCard({ value, note }: { value: number; note?: boolean }) {
  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white p-5">
      <p className="text-ink text-center text-base font-bold">Field Captured Successfully</p>
      <div className="mt-3 flex justify-center">
        <Radial value={value} />
      </div>
      <p className="text-ink mt-3 text-center text-sm font-semibold">You&apos;re doing great!</p>
      <p className="text-ink-muted mt-1 text-center text-xs leading-snug">
        Our AI has identified and organized most of your property details from the recording.
      </p>
      <div className="bg-brand-orange/[0.07] mt-4 flex items-start gap-2 rounded-lg p-3">
        <Sparkles className="text-brand-orange mt-0.5 size-4 shrink-0" />
        <p className="text-ink-muted text-xs leading-snug">
          <span className="text-ink font-semibold">Pro Tip </span>
          {PRO_TIP}
        </p>
      </div>
      {note && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-accent-blue/[0.07] p-3">
          <CircleCheck className="text-accent-blue mt-0.5 size-4 shrink-0" />
          <p className="text-ink-muted text-xs leading-snug">
            <span className="text-ink font-semibold">Note: </span>
            Your listing will be reviewed and published within 2-3 hours. We&apos;ll send you a
            notification once it&apos;s live!
          </p>
        </div>
      )}
    </div>
  );
}

function SpeakDetailsSidebar({ filled }: { filled: number }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/[0.07] bg-white p-5">
        <div className="flex items-center gap-2">
          <Mic className="text-accent-blue size-5" />
          <h3 className="text-ink font-bold">Speak Following Details</h3>
        </div>
        <ul className="mt-4 space-y-3">
          {SPEAK_FIELDS.map((f, i) => (
            <li key={f} className="flex items-center gap-2 text-sm">
              <CircleCheck className={cn("size-4 shrink-0", i < filled ? "text-green-500" : "text-black/20")} />
              <span className={i < filled ? "text-ink" : "text-ink-muted"}>{f}</span>
            </li>
          ))}
        </ul>
        <p className="text-accent-blue mt-4 text-xs font-medium">Keep speaking to complete remaining fields...</p>
      </div>

      <div className="rounded-2xl border border-accent-blue/15 bg-accent-blue/[0.04] p-5">
        <div className="flex items-center gap-2">
          <Lightbulb className="text-accent-blue size-5" />
          <h3 className="text-ink font-bold">Quick Tips</h3>
        </div>
        <ul className="mt-3 space-y-3">
          {QUICK_TIPS.map((t) => (
            <li key={t} className="text-ink-muted flex gap-2 text-sm leading-snug">
              <CircleCheck className="text-accent-blue mt-0.5 size-4 shrink-0" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-brand-orange/[0.07] flex items-start gap-2 rounded-2xl p-4">
        <Sparkles className="text-brand-orange mt-0.5 size-4 shrink-0" />
        <p className="text-ink-muted text-xs leading-snug">
          <span className="text-ink font-semibold">Pro Tip </span>
          You can pause and continue your recording anytime while speaking.
        </p>
      </div>
    </div>
  );
}

function ListingPostedModal({ onClose, onView }: { onClose: () => void; onView: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
      <div className="relative flex w-full max-w-md flex-col items-center rounded-2xl bg-white px-4 sm:px-6 lg:px-8 py-9 text-center shadow-2xl">
        <div className="relative grid size-16 place-items-center">
          {CONFETTI.map((p, i) => (
            <span
              key={i}
              className="pointer-events-none absolute top-1/2 left-1/2"
              style={
                {
                  width: p.w,
                  height: p.h,
                  backgroundColor: p.color,
                  borderRadius: p.round ? "9999px" : "1px",
                  animation: "confetti-pop 1200ms cubic-bezier(0.15, 0.6, 0.4, 1) forwards",
                  animationDelay: `${p.delay}ms`,
                  "--tx": `${p.tx}px`,
                  "--peak-y": `${p.peakY}px`,
                  "--fall-y": `${p.fallY}px`,
                  "--r": `${p.r}deg`,
                } as React.CSSProperties
              }
            />
          ))}
          <span
            className="grid size-16 place-items-center rounded-full bg-green-500 text-white"
            style={{ animation: "tick-pop 500ms cubic-bezier(0.2, 0.8, 0.2, 1.4) both" }}
          >
            <Check className="size-8" strokeWidth={3} />
          </span>
        </div>
        <h2 className="text-ink mt-5 text-2xl font-bold">Listing Posted Successfully!</h2>
        <p className="text-ink-muted mt-2 text-sm leading-relaxed">
          Your property is now live and visible to thousands of potential buyers. You&apos;ll start
          receiving enquiries soon!
        </p>
        <div className="mt-6 flex w-full items-center gap-3 border-t border-black/[0.06] pt-5">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-ink h-11 flex-1 rounded-lg border-black/15 text-sm font-medium"
          >
            Close
          </Button>
          <Button
            onClick={onView}
            className="bg-brand-blue hover:bg-brand-blue-hover h-11 flex-1 rounded-lg text-sm font-semibold text-white"
          >
            <Check className="size-4" />
            View My Listings
          </Button>
        </div>
      </div>
    </div>
  );
}

const AMENITY_GROUPS: { group: string; items: string[] }[] = [
  {
    group: "Green & Comfort",
    items: [
      "Community Garden",
      "Garden",
      "Natural Lighting",
      "Pet Friendly",
      "Green Building / Sustainability",
      "Playground",
    ],
  },
  {
    group: "Leisure & Wellness",
    items: [
      "Swimming Pools",
      "Billiards Table",
      "Kids Play Area",
      "Snooze Room",
      "Spa",
      "Games Room",
      "Gym",
      "Clubhouse",
      "Social Area / Rooftop Garden",
    ],
  },
];
const COUNTER_AMENITIES = ["Car Parking", "Bike Parking", "EV Charger"];
const ALL_TOGGLES = AMENITY_GROUPS.flatMap((g) => g.items);

const AMENITY_ICON: Record<string, LucideIcon> = {
  "Community Garden": Trees,
  Garden: Trees,
  "Natural Lighting": Sun,
  "Pet Friendly": PawPrint,
  "Green Building / Sustainability": Leaf,
  Playground: Users,
  "Swimming Pools": Waves,
  "Billiards Table": Target,
  "Kids Play Area": Users,
  "Snooze Room": BedDouble,
  Spa: Sparkles,
  "Games Room": Gamepad2,
  Gym: Dumbbell,
  Clubhouse: Building2,
  "Social Area / Rooftop Garden": Building2,
  "Car Parking": Car,
  "Bike Parking": Bike,
  "EV Charger": Plug,
};
const amIcon = (l: string) => AMENITY_ICON[l] ?? Sparkles;

function AmChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors",
        selected
          ? "border-accent-blue bg-accent-blue/[0.06] text-ink"
          : "text-ink-muted hover:border-black/25 border-black/15"
      )}
    >
      {createElement(amIcon(label), { className: "text-ink-muted size-4 shrink-0", strokeWidth: 1.75 })}
      {label}
      {selected && (
        <span className="bg-accent-blue grid size-4 place-items-center rounded-full">
          <Check className="size-3 text-white" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

function AmCounter({
  label,
  count,
  onChange,
}: {
  label: string;
  count: number;
  onChange: (n: number) => void;
}) {
  const active = count > 0;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border py-1.5 pr-1.5 pl-3 text-sm font-medium",
        active ? "border-accent-blue bg-accent-blue/[0.06] text-ink" : "text-ink-muted border-black/15"
      )}
    >
      {createElement(amIcon(label), { className: "text-ink-muted size-4 shrink-0", strokeWidth: 1.75 })}
      {label}
      {active && (
        <span className="bg-accent-blue grid size-4 place-items-center rounded-full">
          <Check className="size-3 text-white" strokeWidth={3} />
        </span>
      )}
      <span className="ml-1 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, count - 1))}
          className="text-ink-muted grid size-6 place-items-center rounded-md border border-black/10"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="text-ink w-4 text-center">{count}</span>
        <button
          type="button"
          onClick={() => onChange(count + 1)}
          className="text-ink-muted grid size-6 place-items-center rounded-md border border-black/10"
        >
          <Plus className="size-3.5" />
        </button>
      </span>
    </div>
  );
}

function AddAmenitiesModal({
  initialSel,
  initialCounts,
  onCancel,
  onSave,
}: {
  initialSel: Record<string, boolean>;
  initialCounts: Record<string, number>;
  onCancel: () => void;
  onSave: (sel: Record<string, boolean>, counts: Record<string, number>) => void;
}) {
  const [sel, setSel] = useState(initialSel);
  const [counts, setCounts] = useState(initialCounts);
  const toggle = (l: string) => setSel((s) => ({ ...s, [l]: !s[l] }));
  const setCount = (l: string, n: number) => setCounts((c) => ({ ...c, [l]: Math.max(0, n) }));
  const added = ALL_TOGGLES.filter((l) => sel[l]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
          <div className="flex items-start gap-3">
            <span className="bg-accent-blue/10 text-accent-blue grid size-10 shrink-0 place-items-center rounded-lg">
              <Upload className="size-5" />
            </span>
            <div>
              <h2 className="text-ink text-xl font-bold">Add Amenities</h2>
              <p className="text-ink-muted text-sm">Choose all amenities available in your property.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="text-ink-muted grid size-8 shrink-0 place-items-center rounded-full bg-black/[0.05] transition-colors hover:bg-black/10"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          <div className="border-b border-black/[0.06] pb-4">
            <div className="flex items-center justify-between">
              <p className="text-ink font-semibold">Added {added.length} Amenities</p>
              {added.length > 0 && (
                <button type="button" onClick={() => setSel({})} className="text-accent-blue text-sm font-medium">
                  Clear All
                </button>
              )}
            </div>
            {added.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {added.map((l) => (
                  <span
                    key={l}
                    className="text-ink inline-flex items-center gap-1.5 rounded-full border border-black/15 bg-black/[0.02] px-3 py-1 text-sm"
                  >
                    {l}
                    <button type="button" onClick={() => toggle(l)} aria-label={`Remove ${l}`}>
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-ink text-lg font-bold">Select Amenities</h3>
              <button
                type="button"
                onClick={() => setSel(Object.fromEntries(ALL_TOGGLES.map((l) => [l, true])))}
                className="text-ink-muted rounded-lg border border-black/15 px-3 py-1.5 text-xs font-medium"
              >
                Select All
              </button>
            </div>
            <div className="mt-4 space-y-5">
              {AMENITY_GROUPS.map((g) => (
                <div key={g.group}>
                  <p className="text-ink text-sm font-semibold">{g.group}</p>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {g.items.map((l) => (
                      <AmChip key={l} label={l} selected={!!sel[l]} onClick={() => toggle(l)} />
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <p className="text-ink text-sm font-semibold">Parking &amp; Transport</p>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {COUNTER_AMENITIES.map((l) => (
                    <AmCounter key={l} label={l} count={counts[l] ?? 0} onChange={(n) => setCount(l, n)} />
                  ))}
                </div>
              </div>
              <button type="button" className="text-accent-blue inline-flex items-center gap-1 text-sm font-medium">
                <Plus className="size-4" />
                Add More Amenities
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-black/[0.06] px-6 py-4">
          <Button
            variant="outline"
            onClick={onCancel}
            className="text-ink h-11 flex-1 rounded-lg border-black/15 text-sm font-medium"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onSave(sel, counts)}
            className="bg-brand-blue hover:bg-brand-blue-hover h-11 flex-1 rounded-lg text-sm font-semibold text-white"
          >
            <Check className="size-4" />
            Save &amp; Continue
          </Button>
        </div>
      </div>
    </div>
  );
}

type Step = "record" | "review" | "boost" | "preview";
const PROGRESS: Record<Step, number> = { record: 12, review: 45, boost: 72, preview: 95 };

type Parsed = Record<string, unknown>;

/* Minimal Web Speech API shapes (not in the TS DOM lib here). */
interface SpeechResult {
  isFinal: boolean;
  [index: number]: { transcript: string };
}
interface SpeechResultEvent {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechResult };
}
interface SpeechRec {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: (e: SpeechResultEvent) => void;
  onerror: (e: { error: string }) => void;
  start: () => void;
  stop: () => void;
}

/** Parse a spoken/typed amount like "45 lakhs", "1.25 Cr", "80000" into a number. */
function parseAmount(v: unknown): number | null {
  if (v == null || v === "") return null;
  const s = String(v).toLowerCase();
  const num = parseFloat(s.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return null;
  if (s.includes("cr")) return num * 1e7;
  if (s.includes("lakh") || s.includes("lac")) return num * 1e5;
  if (/\dk\b/.test(s) || s.includes(" k")) return num * 1e3;
  return num;
}

/** Editable, UI-facing model of a listing — the single source of truth. */
interface Form {
  property_title: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  city: string;
  state: string;
  locality: string;
  building_name: string;
  price: string;
  availableFor: "sale" | "rent";
  property_type: string;
  category: string;
  amenities: string[];
}

const EMPTY_FORM: Form = {
  property_title: "",
  bedrooms: null,
  bathrooms: null,
  area_sqft: null,
  city: "",
  state: "",
  locality: "",
  building_name: "",
  price: "",
  availableFor: "sale",
  property_type: "residential",
  category: "apartment_flats",
  amenities: [],
};

/** Seed the editable form from the backend's `extracted` object. */
function formFromParsed(ex: Parsed): Form {
  const amenities = Array.isArray(ex.amenities) ? ex.amenities.map((x) => String(x)) : [];
  const avail = String(ex.property_available_for || "")
    .toLowerCase()
    .includes("rent")
    ? "rent"
    : "sale";
  const num = (v: unknown) => (typeof v === "number" ? v : v != null && v !== "" ? Number(v) : null);
  return {
    property_title: (ex.property_title as string) || "",
    bedrooms: num(ex.bedrooms),
    bathrooms: num(ex.bathrooms),
    area_sqft: num(ex.chargeable_area ?? ex.area_sqft),
    city: (ex.city as string) || "",
    state: (ex.state as string) || "",
    locality: (ex.locality as string) || "",
    building_name: (ex.building_name as string) || "",
    price: ex.price != null ? String(ex.price) : "",
    availableFor: avail,
    property_type: (ex.property_type as string) || "residential",
    category: (ex.category as string) || "apartment_flats",
    amenities,
  };
}

function formLocation(f: Form): string {
  return [f.locality, f.city, f.state].filter(Boolean).join(", ");
}

/** Review cards derived from the (editable) form. */
function reviewFieldsFromForm(f: Form): CapturedField[] {
  const mk = (label: string, value: unknown): CapturedField => {
    const has = value != null && value !== "" && !(Array.isArray(value) && value.length === 0);
    return {
      label,
      value: has ? (Array.isArray(value) ? value.join(", ") : String(value)) : "Not captured",
      captured: has,
    };
  };
  return [
    mk("Property Title", f.property_title),
    mk("Configuration", f.bedrooms != null ? `${f.bedrooms} BHK` : null),
    mk("Chargeable Area", f.area_sqft != null ? `${f.area_sqft} sq. ft.` : null),
    mk("Location", formLocation(f) || null),
    mk("Building Name", f.building_name),
    mk("Price", f.price),
    mk("Amenities", f.amenities.length ? f.amenities : null),
  ];
}

/** Map the editable form → backend submit payload, filling mandatory fields + amenity booleans. */
function buildListingData(f: Form, transcript: string): Record<string, unknown> {
  const am = f.amenities.map((a) => a.toLowerCase());
  const has = (k: string) => am.some((a) => a.includes(k));
  const amount = parseAmount(f.price);
  const data: Record<string, unknown> = {
    property_title: f.property_title || "Untitled Property",
    description: transcript,
    property_type: f.property_type || "residential",
    category: f.category || "apartment_flats",
    listing_as: "broker",
    bedrooms: f.bedrooms,
    bathrooms: f.bathrooms,
    chargeable_area: f.area_sqft,
    area_sqft: f.area_sqft,
    // Required by the backend's mandatory-field rule:
    property_on_floor: 1,
    total_floors: 1,
    year_of_construction: "2020",
    unit_type_preference: "sq-ft",
    city: f.city || null,
    state: f.state || null,
    locality: f.locality || null,
    building_name: f.building_name || null,
    property_available_for: f.availableFor,
    listing_status: "active",
    gym: has("gym"),
    swimming_pool: has("pool") || has("swim"),
    club_house: has("club"),
    garden: has("garden"),
    lift: has("lift"),
    security: has("security"),
    power_backup: has("power"),
    cctv: has("cctv"),
    balcony: has("balcony"),
  };
  if (f.availableFor === "rent") data.rent_rate = amount;
  else data.sale_rate = amount;
  if (f.price) data.price = f.price;
  return data;
}

const EDIT_INPUT =
  "text-ink placeholder:text-ink-muted/60 focus:border-accent-blue/50 h-11 w-full rounded-lg border border-black/15 bg-white px-3.5 text-sm outline-none";

/** Editable details modal — seeded from the parsed form, writes edits back on save. */
function EditDetailsModal({
  initial,
  onCancel,
  onSave,
}: {
  initial: Form;
  onCancel: () => void;
  onSave: (f: Form) => void;
}) {
  const [v, setV] = useState({
    property_title: initial.property_title,
    bedrooms: initial.bedrooms != null ? String(initial.bedrooms) : "",
    bathrooms: initial.bathrooms != null ? String(initial.bathrooms) : "",
    area_sqft: initial.area_sqft != null ? String(initial.area_sqft) : "",
    city: initial.city,
    state: initial.state,
    locality: initial.locality,
    building_name: initial.building_name,
    price: initial.price,
    availableFor: initial.availableFor,
    amenities: initial.amenities.join(", "),
  });
  const set = (k: keyof typeof v, val: string) => setV((s) => ({ ...s, [k]: val }));
  const num = (s: string) => {
    const n = parseFloat(s.replace(/[^0-9.]/g, ""));
    return isNaN(n) ? null : n;
  };
  const remaining = [v.property_title, v.area_sqft, v.city, v.locality, v.price].filter(
    (x) => !String(x).trim()
  ).length;

  function save() {
    onSave({
      ...initial,
      property_title: v.property_title.trim(),
      bedrooms: num(v.bedrooms),
      bathrooms: num(v.bathrooms),
      area_sqft: num(v.area_sqft),
      city: v.city.trim(),
      state: v.state.trim(),
      locality: v.locality.trim(),
      building_name: v.building_name.trim(),
      price: v.price.trim(),
      availableFor: v.availableFor as "sale" | "rent",
      amenities: v.amenities
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  }

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="text-ink mb-2 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
          <div>
            <h2 className="text-ink text-xl font-bold">Edit Property Details</h2>
            <p className="text-ink-muted mt-0.5 text-sm">
              {remaining > 0
                ? `${remaining} key field${remaining > 1 ? "s" : ""} still empty — fill them in`
                : "Review and adjust the extracted details"}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="text-ink-muted grid size-8 shrink-0 place-items-center rounded-full bg-black/[0.05] transition-colors hover:bg-black/10"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 pb-2">
          <Field label="Property Title">
            <input
              value={v.property_title}
              placeholder="e.g., Spacious 3 BHK Apartment"
              onChange={(e) => set("property_title", e.target.value)}
              className={EDIT_INPUT}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Available For">
              <select
                value={v.availableFor}
                onChange={(e) => set("availableFor", e.target.value)}
                className={EDIT_INPUT}
              >
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </Field>
            <Field label="Price / Rent">
              <input
                value={v.price}
                placeholder="e.g., 45 Lakhs or 25000"
                onChange={(e) => set("price", e.target.value)}
                className={EDIT_INPUT}
              />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Bedrooms (BHK)">
              <input
                value={v.bedrooms}
                inputMode="numeric"
                placeholder="3"
                onChange={(e) => set("bedrooms", e.target.value)}
                className={EDIT_INPUT}
              />
            </Field>
            <Field label="Bathrooms">
              <input
                value={v.bathrooms}
                inputMode="numeric"
                placeholder="2"
                onChange={(e) => set("bathrooms", e.target.value)}
                className={EDIT_INPUT}
              />
            </Field>
            <Field label="Area (sq.ft)">
              <input
                value={v.area_sqft}
                inputMode="numeric"
                placeholder="1200"
                onChange={(e) => set("area_sqft", e.target.value)}
                className={EDIT_INPUT}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City">
              <input
                value={v.city}
                placeholder="e.g., Pune"
                onChange={(e) => set("city", e.target.value)}
                className={EDIT_INPUT}
              />
            </Field>
            <Field label="Locality">
              <input
                value={v.locality}
                placeholder="e.g., Koregaon Park"
                onChange={(e) => set("locality", e.target.value)}
                className={EDIT_INPUT}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="State">
              <input
                value={v.state}
                placeholder="e.g., Maharashtra"
                onChange={(e) => set("state", e.target.value)}
                className={EDIT_INPUT}
              />
            </Field>
            <Field label="Building Name">
              <input
                value={v.building_name}
                placeholder="e.g., Sunshine Apartments"
                onChange={(e) => set("building_name", e.target.value)}
                className={EDIT_INPUT}
              />
            </Field>
          </div>
          <Field label="Key Amenities (comma separated)">
            <textarea
              rows={2}
              value={v.amenities}
              placeholder="Gym, Swimming Pool, Parking"
              onChange={(e) => set("amenities", e.target.value)}
              className="text-ink placeholder:text-ink-muted/60 focus:border-accent-blue/50 w-full resize-none rounded-lg border border-black/15 bg-white p-3 text-sm outline-none"
            />
          </Field>
        </div>

        <div className="flex items-center gap-3 border-t border-black/[0.06] px-6 py-4">
          <Button
            variant="outline"
            onClick={onCancel}
            className="text-ink h-11 flex-1 rounded-lg border-black/15 text-sm font-medium"
          >
            Cancel
          </Button>
          <Button
            onClick={save}
            className="bg-brand-blue hover:bg-brand-blue-hover h-11 flex-1 rounded-lg text-sm font-semibold text-white"
          >
            <Check className="size-4" />
            Save Details
          </Button>
        </div>
      </div>
    </div>
  );
}

export function VoiceForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("record");
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [posted, setPosted] = useState(false);
  const [showCreateVideo, setShowCreateVideo] = useState(false);
  const [showAmenities, setShowAmenities] = useState(false);
  const [amSel, setAmSel] = useState<Record<string, boolean>>({
    Spa: true,
    "Social Area / Rooftop Garden": true,
    "Kids Play Area": true,
  });
  const [amCounts, setAmCounts] = useState<Record<string, number>>({
    "Car Parking": 2,
    "Bike Parking": 2,
  });
  const [amSaved, setAmSaved] = useState(false);
  const [showCompleteField, setShowCompleteField] = useState(false);
  const [fieldsComplete, setFieldsComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [generatedVideoGenId, setGeneratedVideoGenId] = useState<string | null>(null);
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoMessage, setVideoMessage] = useState("");
  const videoCancelled = useRef(false);

  // Run AI video generation at the page level (full-page generating view).
  async function runVideoGeneration() {
    setShowCreateVideo(false);
    setStep("preview");
    setVideoGenerating(true);
    setGeneratedVideoUrl(null);
    setVideoProgress(0);
    setVideoMessage("Analysing property details & composition…");
    videoCancelled.current = false;
    try {
      const gen = await api.video.create(form.property_title || "Property Video");
      setGeneratedVideoGenId(gen.generation_id);
      setVideoMessage("Uploading images…");
      for (const f of imageFiles) {
        await api.video.uploadImage(gen.generation_id, f);
        if (videoCancelled.current) return;
      }
      setVideoMessage("Starting AI generation…");
      await api.video.trigger(gen.generation_id);
      setVideoMessage("Creating your video…");
      while (!videoCancelled.current) {
        await new Promise((r) => setTimeout(r, 2500));
        const st = await api.video.status(gen.generation_id);
        setVideoProgress(st.progress ?? 0);
        if (st.status === "completed") {
          if (st.video_url) setGeneratedVideoUrl(st.video_url);
          break;
        }
        if (st.status === "failed") {
          setVideoMessage(st.error_message || "Video generation failed.");
          break;
        }
      }
    } catch {
      if (!videoCancelled.current) setVideoMessage("Couldn't generate the video. Please try again.");
    } finally {
      if (!videoCancelled.current) setVideoGenerating(false);
    }
  }
  const [parsing, setParsing] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);

  // Web Speech API recognition instance + accumulated final transcript.
  // (Typed loosely — the SpeechRecognition class isn't in the TS DOM lib here.)
  const recognitionRef = useRef<{ start: () => void; stop: () => void } | null>(null);
  const finalRef = useRef("");
  const fallbackRef = useRef(false);
  // Mic audio capture — lets us pause/resume the recording.
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);

  function stopAudioCapture() {
    try {
      if (mediaRecRef.current && mediaRecRef.current.state !== "inactive") mediaRecRef.current.stop();
    } catch {
      /* ignore */
    }
    audioStreamRef.current?.getTracks().forEach((t) => t.stop());
    audioStreamRef.current = null;
    mediaRecRef.current = null;
  }

  // Pause/resume the in-progress recording (timer, transcription, and audio).
  function togglePause() {
    if (!recording) return;
    if (paused) {
      setPaused(false);
      try {
        if (mediaRecRef.current?.state === "paused") mediaRecRef.current.resume();
      } catch {
        /* ignore */
      }
      try {
        recognitionRef.current?.start();
      } catch {
        /* already running */
      }
    } else {
      setPaused(true);
      try {
        if (mediaRecRef.current?.state === "recording") mediaRecRef.current.pause();
      } catch {
        /* ignore */
      }
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
    }
  }

  async function submitListing() {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const data = buildListingData(form, transcript);
      if (imageFiles.length > 0) {
        await api.listings.submitWithMedia(data, { images: imageFiles }, { transcript });
      } else {
        await api.listings.submit(data, transcript);
      }
      setPosted(true);
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : "Failed to post the listing. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const amenitiesList = amSaved
    ? [
        ...ALL_TOGGLES.filter((l) => amSel[l]),
        ...COUNTER_AMENITIES.filter((l) => (amCounts[l] ?? 0) > 0).map((l) => `${l}${amCounts[l]}`),
      ]
    : [];

  // Seconds timer while recording (+ a simulated typer only when speech recognition is unavailable).
  useEffect(() => {
    if (!recording || paused) return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    let typer: ReturnType<typeof setInterval> | undefined;
    if (fallbackRef.current) {
      let i = 0;
      typer = setInterval(() => {
        i += 2;
        setTranscript(TARGET_TRANSCRIPT.slice(0, i));
        if (i >= TARGET_TRANSCRIPT.length && typer) clearInterval(typer);
      }, 55);
    }
    return () => {
      clearInterval(timer);
      if (typer) clearInterval(typer);
    };
  }, [recording, paused]);

  // Stop recognition if the component unmounts mid-recording.
  useEffect(
    () => () => {
      recognitionRef.current?.stop();
      audioStreamRef.current?.getTracks().forEach((t) => t.stop());
    },
    []
  );

  const filledFields = Math.min(SPEAK_FIELDS.length, Math.floor(transcript.length / 35));

  function beginRecording() {
    setSeconds(0);
    setTranscript("");
    setLiveError(null);
    finalRef.current = "";

    // Capture the mic audio (best-effort) so we can pause/resume it.
    setPaused(false);
    audioChunksRef.current = [];
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          audioStreamRef.current = stream;
          try {
            const mr = new MediaRecorder(stream);
            mr.ondataavailable = (e) => e.data.size && audioChunksRef.current.push(e.data);
            mr.start(1000);
            mediaRecRef.current = mr;
          } catch {
            /* MediaRecorder unsupported — transcription still works */
          }
        })
        .catch(() => {
          /* mic blocked — handled by the speech-recognition error path */
        });
    }

    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRec;
      webkitSpeechRecognition?: new () => SpeechRec;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SR) {
      // No browser speech support → fall back to the simulated transcript so the flow still works.
      fallbackRef.current = true;
      setRecording(true);
      return;
    }

    fallbackRef.current = false;
    const rec = new SR();
    rec.lang = "en-IN";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e: SpeechResultEvent) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalRef.current += chunk + " ";
        else interim += chunk;
      }
      setTranscript((finalRef.current + interim).trim());
    };
    rec.onerror = (e: { error: string }) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      setLiveError(
        e.error === "not-allowed"
          ? "Microphone access was blocked. Allow mic permission and try again."
          : `Speech recognition error: ${e.error}`
      );
    };
    recognitionRef.current = rec;
    try {
      rec.start();
      setRecording(true);
    } catch {
      fallbackRef.current = true;
      setRecording(true);
    }
  }

  async function finishAndParse() {
    setRecording(false);
    recognitionRef.current?.stop();
    stopAudioCapture();
    const text = transcript.trim() || finalRef.current.trim();
    if (!text) {
      setLiveError("No speech was detected. Please record again and speak clearly.");
      return;
    }
    setParsing(true);
    setLiveError(null);
    try {
      const res = await api.listings.parse(text);
      setForm(formFromParsed(res.extracted || {}));
      setStep("review");
    } catch (err) {
      setLiveError(
        err instanceof ApiError ? err.message : "Couldn't process the recording. Please try again."
      );
    } finally {
      setParsing(false);
    }
  }

  function resetRecording() {
    recognitionRef.current?.stop();
    stopAudioCapture();
    setPaused(false);
    setRecording(false);
    setLiveError(null);
    setSeconds(0);
    setTranscript("");
    finalRef.current = "";
    setForm(EMPTY_FORM);
    setImageFiles([]);
  }
  const progress = posted ? 100 : PROGRESS[step];

  const heading =
    step === "review" ? "Review & Confirm Your Details" : "List Your Property By Voice";
  const subtitle =
    step === "review"
      ? "Our AI has extracted your property details from the voice note. Please review and confirm everything before continuing."
      : "Simply speak naturally — our AI will extract all the property details";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {posted && (
        <ListingPostedModal onClose={() => router.push("/")} onView={() => router.push("/")} />
      )}
      {showCreateVideo && (
        <CreateVideoModal
          images={imageFiles}
          onClose={() => setShowCreateVideo(false)}
          onGenerate={runVideoGeneration}
          title={form.property_title || undefined}
          location={formLocation(form) || undefined}
          building={form.building_name || undefined}
        />
      )}
      {showAmenities && (
        <AddAmenitiesModal
          initialSel={amSel}
          initialCounts={amCounts}
          onCancel={() => setShowAmenities(false)}
          onSave={(s, c) => {
            setAmSel(s);
            setAmCounts(c);
            setAmSaved(true);
            setShowAmenities(false);
          }}
        />
      )}
      {showCompleteField && (
        <EditDetailsModal
          initial={form}
          onCancel={() => setShowCompleteField(false)}
          onSave={(next) => {
            setForm(next);
            setFieldsComplete(true);
            setShowCompleteField(false);
          }}
        />
      )}

      {/* Header */}
      <div className="flex shrink-0 items-start gap-3 px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <Button
          variant="ghost"
          size="icon"
          nativeButton={false}
          render={<Link href="/add-property" />}
          aria-label="Back"
          className="text-ink mt-1 size-7 rounded-lg"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-ink text-2xl font-bold">{heading}</h1>
          <p className="text-ink-muted text-sm">{subtitle}</p>
        </div>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white">
          <div className="h-1 w-full bg-black/[0.06]">
            <div
              className="bg-accent-blue h-full rounded-r-full transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1fr_320px]">
            {/* Main column */}
            <div className="min-w-0">
              {step === "record" && (
                <RecordStep
                  recording={recording}
                  seconds={seconds}
                  transcript={transcript}
                  parsing={parsing}
                  error={liveError}
                  onStart={beginRecording}
                  onReRecord={resetRecording}
                  onStop={finishAndParse}
                  paused={paused}
                  onTogglePause={togglePause}
                />
              )}
              {step === "review" && (
                <ReviewStep
                  transcript={transcript}
                  fields={reviewFieldsFromForm(form)}
                  onEdit={() => setShowCompleteField(true)}
                  onDiscard={() => {
                    resetRecording();
                    setStep("record");
                  }}
                  onRecordAgain={() => {
                    resetRecording();
                    setStep("record");
                  }}
                  onContinue={() => setStep("boost")}
                />
              )}
              {step === "boost" && (
                <BoostStep
                  files={imageFiles}
                  onFiles={(fs) => setImageFiles((prev) => [...prev, ...fs])}
                  onClear={() => setImageFiles([])}
                  onBack={() => setStep("review")}
                  onContinue={() => setStep("preview")}
                  onCreateVideo={() => setShowCreateVideo(true)}
                  amenities={amenitiesList}
                  onAddAmenities={() => setShowAmenities(true)}
                />
              )}
              {step === "preview" && (
                <PreviewStep
                  form={form}
                  files={imageFiles}
                  activeImage={activeImage}
                  setActiveImage={setActiveImage}
                  onBack={() => setStep("boost")}
                  onPost={submitListing}
                  submitting={submitting}
                  error={submitError}
                  generatedVideoUrl={generatedVideoUrl}
                  generatedVideoGenId={generatedVideoGenId}
                  videoGenerating={videoGenerating}
                  videoProgress={videoProgress}
                  videoMessage={videoMessage}
                />
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:border-l lg:border-black/[0.06] lg:pl-6">
              {step === "record" && <SpeakDetailsSidebar filled={recording ? filledFields : 0} />}
              {step === "review" && <FieldCapturedCard value={fieldsComplete ? 100 : 72} />}
              {step === "boost" && <FieldCapturedCard value={fieldsComplete ? 100 : 72} />}
              {step === "preview" && <FieldCapturedCard value={100} note />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Step: Record ---- */

type GuideRow = "top" | "bottom";
const GUIDE_ARROW = "#28324a";
const GUIDE_FIELDS: { key: string; chip: string; row: GuideRow }[] = [
  { key: "area", chip: "Chargeable Area", row: "top" },
  { key: "title", chip: "Property Title", row: "top" },
  { key: "building", chip: "Building name", row: "top" },
  { key: "price", chip: "Pricing", row: "bottom" },
  { key: "amenities", chip: "Amenities", row: "bottom" },
  { key: "location", chip: "Location", row: "bottom" },
];

function RecordStep({
  recording,
  seconds,
  transcript,
  parsing,
  error,
  onStart,
  onReRecord,
  onStop,
  paused,
  onTogglePause,
}: {
  recording: boolean;
  seconds: number;
  transcript: string;
  parsing: boolean;
  error: string | null;
  onStart: () => void;
  onReRecord: () => void;
  onStop: () => void;
  paused: boolean;
  onTogglePause: () => void;
}) {
  return (
    <div className="space-y-5">
      {!recording && (
        <div className="rounded-xl bg-accent-blue/[0.06] px-4 py-3">
          <p className="text-accent-blue text-sm font-semibold">How to record your property</p>
          <p className="text-ink-muted mt-1 text-sm">
            Speak naturally and include these details in your voice note. Mention property type,
            location, area, price, and amenities.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-black/[0.07] p-6">
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={recording ? undefined : onStart}
            aria-label={recording ? "Recording" : "Start recording"}
            className={cn(
              "bg-brand-orange grid size-20 place-items-center rounded-full text-white shadow-lg transition-transform",
              recording && !paused
                ? "ring-brand-orange/30 ring-8 motion-safe:animate-pulse"
                : "hover:scale-105 ring-brand-orange/20 ring-8"
            )}
          >
            <Mic className="size-8" />
          </button>

          <p className="text-ink mt-6 text-4xl font-bold tabular-nums">{fmtTime(seconds)}</p>

          {recording ? (
            paused ? (
              <p className="text-brand-orange mt-2 flex items-center gap-2 text-sm font-medium">
                <span className="bg-brand-orange size-2 rounded-full" />
                Recording is paused
              </p>
            ) : (
              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-green-600">
                <span className="size-2 rounded-full bg-green-500 motion-safe:animate-pulse" />
                Recording in progress
              </p>
            )
          ) : (
            <>
              <p className="text-ink mt-2 font-semibold">Tap to start recording</p>
              <p className="text-ink-muted mt-1 text-sm">Tap start • Typically takes 30–60 seconds</p>
            </>
          )}

          {recording && !paused && (
            <div className="mt-4 w-full max-w-md">
              <Waveform active />
            </div>
          )}

          {!recording && (
            <Button
              onClick={onStart}
              className="bg-brand-blue hover:bg-brand-blue-hover mt-6 h-11 rounded-xl px-6 text-sm font-semibold text-white"
            >
              <Mic className="size-4" />
              Start Recording
            </Button>
          )}

          {error && (
            <p className="mt-4 max-w-md rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        {recording && (
          <>
            <div className="mt-6 rounded-xl border border-black/[0.08] bg-black/[0.01] p-4">
              <p className="text-ink flex items-center gap-2 text-sm font-semibold">
                <span className="text-accent-blue">▤</span> Transcribed Text
              </p>
              <p className="text-ink mt-3 min-h-20 text-sm italic leading-relaxed">
                &ldquo;{transcript}
                <span className="text-ink ml-0.5 inline-block w-px animate-pulse border-l border-ink align-middle">
                  &nbsp;
                </span>
              </p>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={onTogglePause}
                className="text-brand-orange h-11 rounded-lg border-brand-orange/40 px-5 text-sm font-semibold"
              >
                {paused ? <Pause className="size-4" /> : <Play className="size-4" />}
                {paused ? "Pause" : "Play"}
              </Button>
              <Button
                onClick={onReRecord}
                className="h-11 rounded-lg bg-red-500 px-5 text-sm font-semibold text-white hover:bg-red-600"
              >
                <RotateCcw className="size-4" />
                Re-record
              </Button>
              <Button
                onClick={onStop}
                disabled={parsing}
                className="bg-brand-blue hover:bg-brand-blue-hover h-11 rounded-lg px-5 text-sm font-semibold text-white"
              >
                {parsing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <Square className="size-4" />
                    Stop &amp; Submit
                  </>
                )}
              </Button>
            </div>
            <p className="text-ink-muted mt-3 text-center text-xs">
              Minimum 15 seconds recommended for better results
            </p>
          </>
        )}
      </div>

      {!recording && <VoiceNoteGuide />}
    </div>
  );
}

/* ---- Voice note guide (annotated example) ---- */

interface GuidePath {
  d: string;
  head: string;
}

function VoiceNoteGuide() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const nodes = useRef<Record<string, HTMLElement | null>>({});
  const [paths, setPaths] = useState<GuidePath[]>([]);

  const reg = (id: string) => (el: HTMLElement | null) => {
    nodes.current[id] = el;
  };

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const compute = () => {
      const wr = wrap.getBoundingClientRect();
      const next: GuidePath[] = [];
      for (const f of GUIDE_FIELDS) {
        const chip = nodes.current[`chip:${f.key}`];
        const kw = nodes.current[`kw:${f.key}`];
        if (!chip || !kw) continue;
        const c = chip.getBoundingClientRect();
        const k = kw.getBoundingClientRect();
        const top = f.row === "top";
        const sx = c.left + c.width / 2 - wr.left;
        const sy = (top ? c.bottom + 2 : c.top - 2) - wr.top;
        const ex = k.left + k.width / 2 - wr.left;
        const ey = (top ? k.top - 5 : k.bottom + 5) - wr.top;
        // Hand-drawn style sweep: bow the curve sideways toward the word.
        const dy = Math.max(18, Math.abs(ey - sy) * 0.55);
        const bow = (ex - sx) * 0.28;
        const c1x = sx + bow * 0.4;
        const c1y = top ? sy + dy : sy - dy;
        const c2x = ex - bow * 0.4;
        const c2y = top ? ey - dy : ey + dy;
        const d = `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${ex} ${ey}`;
        // arrowhead oriented along the incoming tangent (c2 -> end)
        const ang = Math.atan2(ey - c2y, ex - c2x);
        const L = 7;
        const W = 3.6;
        const bx = ex - L * Math.cos(ang);
        const by = ey - L * Math.sin(ang);
        const px = Math.cos(ang + Math.PI / 2);
        const py = Math.sin(ang + Math.PI / 2);
        const head = `${ex},${ey} ${bx + px * W},${by + py * W} ${bx - px * W},${by - py * W}`;
        next.push({ d, head });
      }
      setPaths(next);
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(wrap);
    const t = setTimeout(compute, 200);
    window.addEventListener("resize", compute);
    return () => {
      ro.disconnect();
      clearTimeout(t);
      window.removeEventListener("resize", compute);
    };
  }, []);

  const chipClass =
    "border-accent-blue/35 bg-accent-blue/[0.07] text-brand-blue rounded-md border px-3 py-1.5 text-xs font-medium whitespace-nowrap shadow-sm";
  const markClass =
    "text-ink decoration-accent-blue/60 bg-transparent font-medium underline decoration-1 underline-offset-[3px] not-italic";

  return (
    <div className="rounded-2xl bg-black/[0.02] p-5">
      <p className="text-ink flex items-center gap-2 text-sm font-semibold">
        <span className="text-accent-blue">ⓘ</span> Details to include in your voice note
      </p>

      <div ref={wrapRef} className="relative mt-5">
        <svg className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible">
          {paths.map((p, i) => (
            <g key={i}>
              <path
                d={p.d}
                fill="none"
                stroke={GUIDE_ARROW}
                strokeWidth={1.25}
                strokeOpacity={0.9}
                strokeLinecap="round"
              />
              <polygon points={p.head} fill={GUIDE_ARROW} fillOpacity={0.9} />
            </g>
          ))}
        </svg>

        {/* top chips */}
        <div className="relative z-30 mb-3 flex items-end justify-between gap-3 px-4 sm:px-10">
          {GUIDE_FIELDS.filter((f) => f.row === "top").map((f) => (
            <span key={f.key} ref={reg(`chip:${f.key}`)} className={chipClass}>
              {f.chip}
            </span>
          ))}
        </div>

        {/* example */}
        <div className="border-brand-orange/30 bg-brand-orange/[0.06] relative flex w-full gap-2.5 rounded-2xl border p-4 sm:p-5">
          <Lightbulb className="text-brand-orange mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-ink text-sm font-semibold">Example voice note:</p>
            <p className="text-ink-muted mt-1 text-sm italic leading-relaxed">
              &ldquo;Hi, I want to list a{" "}
              <mark ref={reg("kw:area")} className={markClass}>
                1200 sq. ft
              </mark>{" "}
              spacious{" "}
              <mark ref={reg("kw:title")} className={markClass}>
                3BHK apartment
              </mark>{" "}
              in{" "}
              <mark ref={reg("kw:location")} className={markClass}>
                Koregaon Park, Pune
              </mark>
              . The building name is{" "}
              <mark ref={reg("kw:building")} className={markClass}>
                Sunshine Apartments
              </mark>
              . I&apos;m looking for{" "}
              <mark ref={reg("kw:price")} className={markClass}>
                45 lakhs
              </mark>
              . It has amenities like{" "}
              <mark ref={reg("kw:amenities")} className={markClass}>
                gym, swimming pool, and parking
              </mark>
              .&rdquo;
            </p>
          </div>
        </div>

        {/* bottom chips (straddle the example box) */}
        <div className="relative z-30 -mt-3.5 flex items-start justify-between gap-3 px-6 sm:px-16">
          {GUIDE_FIELDS.filter((f) => f.row === "bottom").map((f) => (
            <span key={f.key} ref={reg(`chip:${f.key}`)} className={chipClass}>
              {f.chip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---- Step: Review & Confirm ---- */

function ReviewStep({
  transcript,
  fields,
  onEdit,
  onDiscard,
  onRecordAgain,
  onContinue,
}: {
  transcript: string;
  fields: CapturedField[];
  onEdit: () => void;
  onDiscard: () => void;
  onRecordAgain: () => void;
  onContinue: () => void;
}) {
  const captured = fields.filter((f) => f.captured).length;
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-green-500 text-white">
          <Check className="size-4" strokeWidth={3} />
        </span>
        <div>
          <p className="font-semibold text-green-700">Recording Submitted Successfully!</p>
          <p className="text-ink-muted text-xs">
            Your voice note has been processed and property details are ready for review.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-black/[0.08] bg-black/[0.01] p-4">
        <p className="text-ink text-sm font-semibold">Transcribed Text</p>
        <p className="text-ink-muted mt-2 text-sm italic leading-relaxed">&ldquo;{transcript}&rdquo;</p>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-ink font-bold">Captured Property Details</h3>
          <span className="bg-accent-blue/10 text-accent-blue rounded-md px-2 py-0.5 text-xs font-semibold">
            Preview
          </span>
          <span className="text-ink-muted ml-auto text-xs">{captured} of {fields.length} fields</span>
          <button
            type="button"
            onClick={onEdit}
            className="text-accent-blue inline-flex shrink-0 items-center gap-1 text-xs font-semibold"
          >
            <Pencil className="size-3" />
            Edit Details
          </button>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {fields.map((f) => (
            <div
              key={f.label}
              className={cn(
                "flex items-start justify-between gap-3 rounded-xl border p-4",
                f.captured ? "border-green-200 bg-green-50/60" : "border-black/[0.08] bg-black/[0.01]"
              )}
            >
              <div className="flex items-start gap-2.5">
                <CircleCheck className={cn("mt-0.5 size-5 shrink-0", f.captured ? "text-green-500" : "text-black/20")} />
                <div>
                  <p className="text-ink-muted text-xs">{f.label}</p>
                  <p className={cn("mt-0.5 text-sm font-semibold", f.captured ? "text-ink" : "text-ink-muted")}>
                    {f.value}
                  </p>
                </div>
              </div>
              {!f.captured && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="text-accent-blue inline-flex shrink-0 items-center gap-1 text-xs font-medium"
                >
                  <Pencil className="size-3" />
                  Edit
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-accent-blue/[0.05] px-4 py-3 text-sm">
        <span className="text-accent-blue">ⓘ</span>
        <span className="text-ink-muted">
          Please review all extracted details carefully. You can edit any field before moving to the
          next step.
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          onClick={onDiscard}
          className="h-11 rounded-lg bg-red-500 px-4 text-sm font-semibold text-white hover:bg-red-600"
        >
          <Trash2 className="size-4" />
          Discard &amp; Start Over
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={onRecordAgain}
            className="text-ink h-11 rounded-lg border-black/15 px-4 text-sm font-medium"
          >
            <Mic className="size-4" />
            Record Again
          </Button>
          <Button
            onClick={onContinue}
            className="bg-brand-blue hover:bg-brand-blue-hover h-11 rounded-lg px-5 text-sm font-semibold text-white"
          >
            Confirm &amp; Continue
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
      <p className="text-ink-muted text-center text-xs">
        Review your transcription or record again for better accuracy
      </p>
    </div>
  );
}

/* ---- Step: Boost Your Listing ---- */

function BoostStep({
  files,
  onFiles,
  onClear,
  onBack,
  onContinue,
  onCreateVideo,
  amenities,
  onAddAmenities,
}: {
  files: File[];
  onFiles: (fs: File[]) => void;
  onClear: () => void;
  onBack: () => void;
  onContinue: () => void;
  onCreateVideo: () => void;
  amenities: string[];
  onAddAmenities: () => void;
}) {
  // Create + revoke object URLs inside the effect so Strict Mode's double-mount
  // regenerates them (otherwise the cleanup revokes URLs still in use).
  const [previews, setPreviews] = useState<string[]>([]);
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);
  const photos = files.length;
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-green-500 text-white">
          <Check className="size-4" strokeWidth={3} />
        </span>
        <div>
          <p className="font-semibold text-green-700">Recording Submitted!</p>
          <p className="text-ink-muted text-xs">
            Your property listing is being processed by our AI. We&apos;ll notify you once it&apos;s
            live in hours!
          </p>
        </div>
      </div>

      <div>
        <p className="text-ink font-bold">Boost Your Listing</p>
        <p className="text-ink-muted text-sm">Add details to make your listing more effective</p>
      </div>

      <div className="rounded-xl border border-black/[0.08] p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="bg-accent-blue/10 text-accent-blue grid size-10 shrink-0 place-items-center rounded-lg">
              <Camera className="size-5" />
            </span>
            <div>
              <p className="text-ink font-semibold">Add Images / Videos</p>
              <p className="text-ink-muted text-sm">Properties with photos get 5x more views</p>
            </div>
          </div>
          <span className="text-brand-orange bg-brand-orange/10 rounded-md px-2 py-0.5 text-xs font-semibold">
            +500% views
          </span>
        </div>

        <label className="mt-4 flex cursor-pointer flex-wrap items-center justify-between gap-4 rounded-xl border-2 border-dashed border-black/15 bg-black/[0.01] px-5 py-5 transition-colors hover:border-accent-blue/40">
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const picked = Array.from(e.target.files ?? []);
              if (picked.length) onFiles(picked);
              e.target.value = "";
            }}
          />
          <div className="min-w-0">
            <p className="text-ink font-semibold">Drag and drop photos here</p>
            <p className="text-ink-muted mt-1 text-xs">
              Use clear, well-lit photos from multiple angles for best video results. JPG, PNG, WebP •
              Max 10MB each
            </p>
          </div>
          <span className="border-accent-blue/40 text-accent-blue shrink-0 rounded-lg border bg-white px-4 py-2 text-sm font-semibold">
            {photos > 0 ? "Add More Images / Videos" : "Add Images / Videos"}
          </span>
        </label>

        {photos === 0 ? (
          <div className="border-brand-orange/25 bg-brand-orange/[0.06] mt-3 flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm">
            <Sparkles className="text-brand-orange size-4 shrink-0" />
            <span className="text-ink-muted">
              Upload property photos to automatically create an AI-powered video tour.
            </span>
          </div>
        ) : (
          <>
            <div className="mt-5 flex items-center justify-between">
              <p className="text-ink text-sm font-bold">Uploaded Photos ({photos})</p>
              <button type="button" onClick={onClear} className="text-accent-blue text-sm font-medium">
                Clear All
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {previews.map((src, i) => (
                <div
                  key={i}
                  className="relative size-20 shrink-0 overflow-hidden rounded-lg ring-1 ring-black/10"
                >
                  {/* Local object URLs — plain img avoids next/image remote-pattern checks. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Photo ${i + 1}`} className="size-full object-cover" />
                </div>
              ))}
            </div>
            <p className="text-ink-muted mt-3 text-sm">
              You can create the video now or skip this step and continue with your listing.
            </p>

            <div className="border-brand-orange/25 bg-brand-orange/[0.06] relative mt-4 rounded-xl border p-4">
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  <span className="bg-brand-green absolute -top-2 -left-2 z-10 -rotate-12 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    New
                  </span>
                  <span className="grid size-12 place-items-center rounded-xl bg-white shadow-sm">
                    <Video className="text-brand-orange size-6" strokeWidth={1.75} />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-ink font-semibold">Create an AI Video from Your Uploaded Photos</p>
                      <p className="text-ink-muted mt-0.5 text-sm">
                        Transform your photos into a stunning video tour. Listings with videos get{" "}
                        <span className="text-brand-orange font-semibold">3x more engagement</span> and
                        sell <span className="text-brand-orange font-semibold">faster!</span>
                      </p>
                    </div>
                    <Button
                      onClick={onCreateVideo}
                      className="bg-brand-orange hover:bg-brand-orange-hover h-10 shrink-0 rounded-lg px-4 text-sm font-semibold text-white"
                    >
                      <Play className="size-4 fill-white" />
                      Create Video Now
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {VIDEO_STATS.map(({ icon: Icon, value, label }) => (
                      <span
                        key={label}
                        className="border-brand-orange/20 inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2"
                      >
                        <Icon className="text-brand-orange size-4 shrink-0" strokeWidth={1.75} />
                        <span className="leading-tight">
                          <span className="text-ink block text-sm font-bold">{value}</span>
                          <span className="text-ink-muted block text-xs">{label}</span>
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="rounded-xl border border-black/[0.08]">
        <div className="flex items-center justify-between gap-3 p-5">
          <div className="flex items-start gap-3">
            <span className="bg-accent-blue/10 text-accent-blue grid size-10 shrink-0 place-items-center rounded-lg">
              <Sparkles className="size-5" />
            </span>
            <div>
              <p className="text-ink font-semibold">Add Property Amenities</p>
              <p className="text-ink-muted text-sm">
                Select amenities available in your property to improve listing visibility and attract
                more buyers
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={onAddAmenities}
            className="text-ink h-10 shrink-0 rounded-lg border-black/15 px-4 text-sm font-medium"
          >
            {amenities.length > 0 ? "Add More Amenities" : "Add Amenities"}
          </Button>
        </div>
        {amenities.length > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-black/[0.06] bg-black/[0.02] px-5 py-3">
            <p className="text-ink-muted min-w-0 truncate text-sm">
              {amenities.slice(0, 5).join(", ")}
              {amenities.length > 5 && (
                <span className="text-ink-muted">...+ {amenities.length - 5} More</span>
              )}
            </p>
            <button
              type="button"
              onClick={onAddAmenities}
              className="text-accent-blue inline-flex shrink-0 items-center gap-1 text-sm font-medium"
            >
              <Pencil className="size-3.5" />
              Edit
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="text-ink h-11 rounded-lg border-black/15 px-5 text-sm font-medium"
        >
          Back
        </Button>
        <Button
          onClick={onContinue}
          className="bg-brand-blue hover:bg-brand-blue-hover h-11 rounded-lg px-5 text-sm font-semibold text-white"
        >
          Preview &amp; Submit
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

/* ---- Step: Preview ---- */

const PREVIEW_AMENITIES = ["Gym", "Swimming Pool", "Parking", "Clubhouse"];

function PreviewStep({
  form,
  files,
  activeImage,
  setActiveImage,
  onBack,
  onPost,
  submitting,
  error,
  generatedVideoUrl = null,
  generatedVideoGenId = null,
  videoGenerating = false,
  videoProgress = 0,
  videoMessage = "",
}: {
  form: Form;
  files: File[];
  activeImage: number;
  setActiveImage: (i: number) => void;
  onBack: () => void;
  onPost: () => void;
  submitting: boolean;
  error: string | null;
  generatedVideoUrl?: string | null;
  generatedVideoGenId?: string | null;
  videoGenerating?: boolean;
  videoProgress?: number;
  videoMessage?: string;
}) {
  // Show the user's uploaded photos; fall back to stock visuals if none uploaded.
  // Object URLs are created AND revoked inside the effect so React Strict Mode's
  // double-mount regenerates them (creating in useMemo + revoking in a cleanup
  // leaves <img> pointing at revoked URLs → broken images).
  const [gallery, setGallery] = useState<string[]>(PREVIEW_IMAGES);
  useEffect(() => {
    if (!files.length) {
      setGallery(PREVIEW_IMAGES);
      return;
    }
    const urls = files.map((f) => URL.createObjectURL(f));
    setGallery(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const active = Math.min(activeImage, gallery.length - 1);

  const isRent = form.availableFor === "rent";
  const title = form.property_title || "Untitled Property";
  const location = formLocation(form) || "Location not specified";
  const building = form.building_name;
  const areaNum = form.area_sqft;
  const bhk = form.bedrooms != null ? `${form.bedrooms} BHK` : "—";
  const priceDisplay = form.price || "Price on request";
  const amenityChips = form.amenities.length
    ? form.amenities.map((a) => a.replace(/\b\w/g, (c) => c.toUpperCase()))
    : PREVIEW_AMENITIES;
  return (
    <div className="space-y-5">
      {/* Video generating progress card */}
      {videoGenerating && (
        <div>
          <p className="text-ink font-bold">Generating video for</p>
          <p className="text-ink-muted mb-3 text-sm">Please wait, your video is generating</p>
          <div className="border-brand-orange/30 bg-brand-orange/[0.06] flex items-center gap-3 rounded-2xl border px-4 py-4">
            <span className="bg-brand-orange/15 text-brand-orange grid size-10 shrink-0 place-items-center rounded-lg">
              <Video className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-ink text-sm font-semibold">Creating Your Video…</p>
              <p className="text-ink-muted truncate text-xs">{title}</p>
              <div className="bg-brand-orange/20 mt-2 h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className="bg-brand-orange h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${Math.max(5, videoProgress)}%` }}
                />
              </div>
              <div className="text-brand-orange mt-1.5 flex items-center justify-between text-xs">
                <span>{videoMessage || "Analysing property details & composition…"}</span>
                <span className="font-semibold">{Math.max(5, videoProgress)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generated AI video banner */}
      {generatedVideoUrl && !videoGenerating && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-green-500 text-white">
              <Check className="size-5" strokeWidth={3} />
            </span>
            <div>
              <p className="font-semibold text-green-700">Video Generated!</p>
              <p className="text-ink-muted text-sm">Choose your favourite or regenerate a new one</p>
            </div>
          </div>
          <Button
            onClick={() => setShowVideoModal(true)}
            className="bg-brand-green hover:bg-brand-green-hover h-11 rounded-lg px-5 text-sm font-semibold text-white"
          >
            <Play className="size-4 fill-white" /> Preview &amp; Attach Video
          </Button>
        </div>
      )}

      {showVideoModal && generatedVideoUrl && (
        <GeneratedVideoModal
          videoUrl={generatedVideoUrl}
          genId={generatedVideoGenId}
          title={form.property_title || "Your Property Video"}
          sceneCount={Math.max(files.length, 8)}
          onClose={() => setShowVideoModal(false)}
        />
      )}

      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={gallery[active]} alt="Property preview" className="size-full object-cover" />
        <span className="absolute right-3 bottom-3 rounded-md bg-black/55 px-2 py-0.5 text-xs font-medium text-white">
          {active + 1}/{gallery.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {gallery.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveImage(i)}
            className={cn(
              "relative size-16 shrink-0 overflow-hidden rounded-lg ring-2 transition-all",
              i === active ? "ring-accent-blue" : "ring-transparent hover:ring-black/15"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Thumbnail ${i + 1}`} className="size-full object-cover" />
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-ink text-2xl font-bold">{title}</h2>
        <p className="text-ink text-xl font-bold">
          {priceDisplay}
          {isRent && <span className="text-ink-muted ml-0.5 text-sm font-normal">/month</span>}
        </p>
      </div>
      <div className="text-ink-muted flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="flex items-center gap-1.5">
          <MapPin className="size-4" />
          {location}
        </span>
        {building && (
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-4" />
            {building}
          </span>
        )}
      </div>
      <div className="text-ink-muted flex items-center gap-2 text-sm">
        {areaNum != null && (
          <span className="flex items-center gap-1.5 rounded-lg border border-black/[0.08] px-3 py-2">
            <Maximize2 className="size-4" />
            {areaNum} sq.ft.
          </span>
        )}
        <span className="flex items-center gap-1.5 rounded-lg border border-black/[0.08] px-3 py-2">
          <BedDouble className="size-4" />
          {bhk}
        </span>
      </div>

      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-ink-muted text-sm">Amenities:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {amenityChips.map((a) => (
            <span
              key={a}
              className="bg-accent-blue/[0.08] text-accent-blue rounded-full px-3 py-1 text-xs font-medium"
            >
              {a}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium text-green-600">
          <span className="size-2 rounded-full bg-green-500" />
          7 of 7 fields completed
        </span>
        <span className="font-semibold text-green-600">100%</span>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={submitting}
          className="text-ink h-11 rounded-lg border-black/15 px-5 text-sm font-medium"
        >
          Back
        </Button>
        <Button
          onClick={onPost}
          disabled={submitting}
          className="bg-brand-blue hover:bg-brand-blue-hover h-11 rounded-lg px-5 text-sm font-semibold text-white"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Posting…
            </>
          ) : (
            <>
              Post Listing
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
