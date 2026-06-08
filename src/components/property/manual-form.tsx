"use client";

import { createElement, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bath,
  BedDouble,
  Bike,
  Building2,
  Camera,
  Car,
  Check,
  ChevronDown,
  CircleCheck,
  Download,
  Droplet,
  Dumbbell,
  Eye,
  FileText,
  Gamepad2,
  House,
  Images,
  Leaf,
  Loader2,
  MapPin,
  Maximize2,
  Minus,
  PawPrint,
  Pencil,
  Play,
  Plug,
  Plus,
  RotateCw,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  ThumbsUp,
  Trees,
  TrendingUp,
  Upload,
  Users,
  Video,
  Volume2,
  Waves,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api, ApiError, type PlaceDetails } from "@/lib/api";
import { CreateVideoModal } from "./create-video-modal";
import { GeneratedVideoModal } from "./generated-video-modal";
import { AddressAutocomplete } from "./address-autocomplete";
import { GoogleMapPicker } from "./google-map-picker";

interface Category {
  label: string;
  question: string;
  cols: 1 | 2 | 3;
  options: string[];
}

interface TypeConfig {
  listerLabel: string | null;
  titleLabel: string;
  titlePlaceholder: string;
  descLabel: string;
  typeLabel: string;
  steps: { title: string; desc: string }[];
  categories: Category[];
}

const SPACE_STEP = { title: "Space Details", desc: "Configuration, condition, and specifications" };
const LOCATION_STEP = { title: "Location Details", desc: "Complete address and locality details" };
const UPLOAD_STEP = { title: "Upload Images", desc: "Add images to make your listing stand out" };
const AMENITIES_STEP = {
  title: "Amenities & Facilities",
  desc: "Showcase the features and conveniences your property offers",
};

const TYPE_CONFIG: Record<string, TypeConfig> = {
  Commercial: {
    listerLabel: "Listing Property As",
    titleLabel: "Title",
    titlePlaceholder: "eg: Fully Furnished Office with Modern Amenities",
    descLabel: "Description",
    typeLabel: "Project Type",
    steps: [
      { title: "Property Overview", desc: "Key information about the property" },
      SPACE_STEP,
      LOCATION_STEP,
      UPLOAD_STEP,
      AMENITIES_STEP,
    ],
    categories: [
      {
        label: "Retail Spaces",
        question: "Specify the kind of retail space you're listing",
        cols: 3,
        options: ["Shop / Showroom", "Mall / High-Street Unit", "Restaurant / Cafe Space", "Other"],
      },
      {
        label: "Office Spaces",
        question: "Specify the kind of office space available for lease or sale",
        cols: 3,
        options: ["Private Office", "Business Center", "Managed Office (non-coworking)", "Other"],
      },
      {
        label: "Coworking Spaces",
        question: "Share details about your coworking setup",
        cols: 1,
        options: ["Managed/Coworking", "Other"],
      },
      {
        label: "Industrial",
        question: "Specify the type of industrial space you're listing",
        cols: 3,
        options: ["Warehouse", "Factory / Manufacturing", "Cold Storage", "Other"],
      },
      {
        label: "Institutional",
        question: "Specify the type of institutional space you're listing",
        cols: 3,
        options: ["School / College", "Hospital / Clinic", "Religious / Community", "Other"],
      },
    ],
  },
  Residential: {
    listerLabel: "Who's listing this property?",
    titleLabel: "Catchy title for your property",
    titlePlaceholder: "eg: Spacious Homes with Premium Comforts",
    descLabel: "Describe your property highlights",
    typeLabel: "Choose the type of property",
    steps: [
      { title: "Property Overview", desc: "Key information about the property" },
      SPACE_STEP,
      LOCATION_STEP,
      UPLOAD_STEP,
      AMENITIES_STEP,
    ],
    categories: [
      {
        label: "Apartments / Flats",
        question: "Tell us what kind of apartment you're listing?",
        cols: 3,
        options: ["Studio", "1RK", "1BHK", "2BHK", "3BHK", "4BHK", "4+BHK", "Other"],
      },
      {
        label: "Independent Houses / Villas",
        question: "What type of home are you listing?",
        cols: 3,
        options: ["House", "Villa", "Farmhouse", "Other"],
      },
      {
        label: "Plots / Land for Residential Use",
        question: "Select the type of residential plot",
        cols: 1,
        options: ["Residential Plot", "Other"],
      },
    ],
  },
  Land: {
    listerLabel: null,
    titleLabel: "Title",
    titlePlaceholder: "eg: Commercial Plot Near IT Park",
    descLabel: "Description",
    typeLabel: "Project Type",
    steps: [
      { title: "Property Overview", desc: "Start with a clear title and purpose for your land" },
      { title: "Land Specific Details", desc: "Add plot dimensions and utilities" },
      { title: "Location Details", desc: "Specify state, city, and exact plot address" },
      UPLOAD_STEP,
      AMENITIES_STEP,
    ],
    categories: [
      {
        label: "Agricultural Land",
        question: "Specify the type of agricultural land you're listing.",
        cols: 3,
        options: [
          "Farmland / Agricultural Plot",
          "Irrigated Land",
          "Non-Irrigated Land",
          "Farmhouse Plot",
          "Other",
        ],
      },
      {
        label: "Residential Land",
        question: "Select the type of residential land or plot you're listing",
        cols: 2,
        options: [
          "Individual Plot",
          "Township / Mixed-Use (Residential + Commercial)",
          "Gated Community Plot",
          "Other",
        ],
      },
      {
        label: "Commercial / Industrial Land",
        question: "Choose the type of commercial or industrial land you're listing.",
        cols: 3,
        options: [
          "Retail / Shop Plot",
          "Office / Business Plot",
          "Warehouse / Logistics",
          "Industrial Plot",
          "Hospitality (Hotel/Resort) Plot",
          "Other",
        ],
      },
      {
        label: "Institutional / Others",
        question: "Select the type of institutional or special-use property you're listing.",
        cols: 3,
        options: ["School / College", "Hospital / Healthcare", "Religious / Community Use", "Other"],
      },
    ],
  },
};

const TYPES = ["Commercial", "Residential", "Land"];
const LISTERS = ["Channel Partner / Broker", "Owner", "Builder"];
const AVAILABILITY = ["Sale", "Rent"];
const AREA_TYPES = ["Chargeable Area", "Carpet Area"];
const STATUSES = ["Vacant", "Occupied"];
const UNIT_CONDITIONS = ["Bare Shell", "Warm Shell", "Semi Furnished", "Fully Furnished"];
const SPOTLIGHT_BY_STEP = [0, 10, 50, 75, 99];

/* ---- Manual form -> backend mapping ---- */

interface ManualFields {
  title: string;
  description: string;
  area: string;
  price: string;
  locality: string;
  city: string;
  state: string;
  building: string;
  wing: string;
  unit: string;
  floor: string;
  totalFloors: string;
  micromarket: string;
  year: string;
  landmark: string;
  pincode: string;
  fullAddress: string;
  latitude: string;
  longitude: string;
}

const EMPTY_MANUAL: ManualFields = {
  title: "",
  description: "",
  area: "",
  price: "",
  locality: "",
  city: "",
  state: "",
  building: "",
  wing: "",
  unit: "",
  floor: "",
  totalFloors: "",
  micromarket: "",
  year: "",
  landmark: "",
  pincode: "",
  fullAddress: "",
  latitude: "",
  longitude: "",
};

const CATEGORY_ENUM: Record<string, string> = {
  "Apartments / Flats": "apartment_flats",
  "Independent Houses / Villas": "independent_house",
  "Plots / Land for Residential Use": "apartment_flats",
  "Retail Spaces": "retail_space",
  "Office Spaces": "office_spaces",
  "Coworking Spaces": "office_spaces",
  Industrial: "industrial",
  Institutional: "office_spaces",
};

function num(s: string): number | null {
  const n = parseFloat(String(s).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? null : n;
}

/** Parse "45 lakhs" / "1.2 Cr" / "25000" → number. */
function parseAmount(s: string): number | null {
  if (!s) return null;
  const low = s.toLowerCase();
  const n = parseFloat(low.replace(/[^0-9.]/g, ""));
  if (isNaN(n)) return null;
  if (low.includes("cr")) return n * 1e7;
  if (low.includes("lakh") || low.includes("lac")) return n * 1e5;
  return n;
}

/** Bedrooms from the selected BHK spec for the open category. */
function bedroomsFromSpecs(openCat: string | null, specs: Record<string, boolean>): number | null {
  if (!openCat) return null;
  const selected = Object.keys(specs)
    .filter((k) => specs[k] && k.startsWith(openCat + "|"))
    .map((k) => k.split("|")[1]);
  for (const s of selected) {
    const m = s.match(/(\d+)\s*BHK/i) || s.match(/(\d+)\s*RK/i);
    if (m) return Number(m[1]);
    if (/studio/i.test(s)) return 0;
  }
  return null;
}

const FURNISHING: Record<string, string> = {
  "Fully Furnished": "furnished",
  "Semi Furnished": "semi_furnished",
  "Bare Shell": "unfurnished",
  "Warm Shell": "unfurnished",
};

/** Map selected amenity labels → backend boolean keys. */
function amenityBooleans(labels: string[]): Record<string, boolean> {
  const am = labels.map((l) => l.toLowerCase());
  const has = (k: string) => am.some((a) => a.includes(k));
  return {
    gym: has("gym"),
    swimming_pool: has("pool") || has("swim"),
    club_house: has("club"),
    garden: has("garden"),
    lift: has("lift"),
    security: has("security"),
    power_backup: has("power"),
    cctv: has("cctv"),
    balcony: has("balcony"),
    spa: has("spa"),
    play_ground: has("play"),
  };
}

function scoreStyle(v: number) {
  const color =
    v < 25
      ? { ring: "stroke-red-500", track: "stroke-red-100", text: "text-red-500" }
      : v < 70
        ? { ring: "stroke-amber-500", track: "stroke-amber-100", text: "text-amber-500" }
        : { ring: "stroke-green-500", track: "stroke-green-100", text: "text-green-600" };
  const label =
    v < 50 ? "Needs Improvement" : v < 70 ? "Good" : v < 95 ? "Great Going" : "Well Done!";
  return { ...color, label };
}

function Stepper({ steps, current }: { steps: { title: string; desc: string }[]; current: number }) {
  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white p-5">
      <ol>
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          const last = i === steps.length - 1;
          return (
            <li
              key={step.title}
              className={cn(
                "relative flex gap-3 pb-6 transition-opacity last:pb-0",
                i > current && "opacity-50"
              )}
            >
              {!last && (
                <span
                  className={cn(
                    "absolute top-7 left-3 h-[calc(100%-1.5rem)] w-px",
                    done ? "bg-brand-green" : "bg-black/10"
                  )}
                />
              )}
              <span
                className={cn(
                  "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full",
                  done
                    ? "bg-brand-green"
                    : active
                      ? "border-2 border-accent-blue bg-white"
                      : "border-2 border-black/20 bg-white"
                )}
              >
                {done ? (
                  <Check className="size-3.5 text-white" strokeWidth={3} />
                ) : (
                  <span
                    className={cn("size-2.5 rounded-full", active ? "bg-accent-blue" : "bg-transparent")}
                  />
                )}
              </span>
              <div className="pt-px">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    active ? "text-accent-blue" : "text-ink-muted"
                  )}
                >
                  {step.title}
                </p>
                <p className="text-ink-muted mt-0.5 text-xs leading-snug">{step.desc}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function SpotlightScore({ value }: { value: number }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const GAP = 0.1; // open-gauge gap, so even a full score shows a space at the top
  const arc = (1 - GAP) * circ;
  const rotation = -90 + GAP * 180; // center the gap at the top
  const progress = (value / 100) * arc;
  const s = scoreStyle(value);
  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white p-5">
      <p className="text-ink text-base font-bold">Spotlight Score</p>
      <p className="text-ink-muted mt-1 text-xs leading-snug">
        Complete property details to improve visibility and ranking
      </p>
      <div className="mt-4 flex flex-col items-center">
        <div className="relative grid size-20 place-items-center">
          <svg className="size-20" viewBox="0 0 64 64">
            <g transform={`rotate(${rotation} 32 32)`}>
              <circle
                cx="32"
                cy="32"
                r={r}
                fill="none"
                strokeWidth="4"
                strokeLinecap="round"
                className={s.track}
                strokeDasharray={`${arc} ${circ}`}
              />
              <circle
                cx="32"
                cy="32"
                r={r}
                fill="none"
                strokeWidth="4"
                strokeLinecap="round"
                className={s.ring}
                strokeDasharray={`${progress} ${circ}`}
              />
            </g>
          </svg>
          <span className="text-ink absolute text-lg font-bold">{value}%</span>
        </div>
        <p className={cn("mt-3 flex items-center gap-1.5 text-sm font-medium", s.text)}>
          <TrendingUp className="size-4" />
          {s.label}
        </p>
      </div>
    </div>
  );
}

function Pill({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
        selected
          ? "border-accent-blue bg-accent-blue/[0.08] text-ink"
          : "text-ink-muted hover:border-black/25 border-black/15"
      )}
    >
      {selected && (
        <span className="bg-accent-blue grid size-4 place-items-center rounded-full">
          <Check className="size-3 text-white" strokeWidth={3} />
        </span>
      )}
      {label}
    </button>
  );
}

function Radio({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className="flex items-center gap-2 text-sm"
    >
      <span
        className={cn(
          "grid size-4 shrink-0 place-items-center rounded-full border-2",
          selected ? "border-accent-blue" : "border-black/30"
        )}
      >
        {selected && <span className="bg-accent-blue size-2 rounded-full" />}
      </span>
      <span className="text-ink">{label}</span>
    </button>
  );
}

function AiButton({ onClick, loading }: { onClick?: () => void; loading?: boolean } = {}) {
  if (loading) {
    return (
      <span className="grid size-8 shrink-0 place-items-center">
        <Loader2 className="text-accent-blue size-5 animate-spin" />
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label="Generate with AI"
      className="grid size-8 shrink-0 place-items-center rounded-lg transition-opacity hover:opacity-80 disabled:cursor-default"
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-6">
        <defs>
          <linearGradient id="ai-frame-grad" x1="9" y1="6" x2="9" y2="19" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2f6bed" />
            <stop offset="1" stopColor="#f5a623" />
          </linearGradient>
        </defs>
        <rect
          x="3"
          y="6.5"
          width="12.5"
          height="12.5"
          rx="3.5"
          stroke="url(#ai-frame-grad)"
          strokeWidth="2"
        />
        <path
          d="M19.2 2c.4 2.1 1.3 3 3.4 3.4-2.1.4-3 1.3-3.4 3.4-.4-2.1-1.3-3-3.4-3.4 2.1-.4 3-1.3 3.4-3.4Z"
          fill="#2f6bed"
        />
      </svg>
    </button>
  );
}

function Field({
  label,
  required = true,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-ink mb-3 block text-sm font-semibold">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function LabelInput({
  label,
  required = false,
  placeholder,
  defaultValue,
  hint,
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  hint?: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  // Controlled when onChange is provided; otherwise falls back to uncontrolled.
  const controlled = onChange !== undefined;
  return (
    <div>
      <label className="text-ink mb-2 flex items-center gap-2 text-sm font-semibold">
        {label}
        {required && <span className="text-red-500">*</span>}
        {hint && <span className="text-ink-muted text-xs font-normal">{hint}</span>}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        {...(controlled ? { value: value ?? "" } : { defaultValue })}
        onChange={controlled ? (e) => onChange!(e.target.value) : undefined}
        className="text-ink placeholder:text-ink-muted/60 focus:border-accent-blue/50 h-11 w-full rounded-lg border border-black/15 bg-white px-3.5 text-sm outline-none"
      />
    </div>
  );
}

function CategoryToggle({
  label,
  open,
  onClick,
}: {
  label: string;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg border px-4 py-2.5 text-left text-sm font-medium transition-colors",
        open
          ? "border-accent-blue bg-accent-blue/[0.08] text-ink"
          : "text-ink-muted hover:border-black/25 border-black/15"
      )}
    >
      <span className="flex items-center gap-2">
        {open && (
          <span className="bg-accent-blue grid size-4 shrink-0 place-items-center rounded-full">
            <Check className="size-3 text-white" strokeWidth={3} />
          </span>
        )}
        {label}
      </span>
      <ChevronDown className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")} />
    </button>
  );
}

function SpecCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className="flex items-center gap-2.5 text-left"
    >
      <span
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded border transition-colors",
          checked ? "border-accent-blue bg-accent-blue text-white" : "border-black/25 bg-white"
        )}
      >
        {checked && <Check className="size-3.5" strokeWidth={3} />}
      </span>
      <span className="text-ink-muted text-sm">{label}</span>
    </button>
  );
}

function specGridCols(cols: 1 | 2 | 3) {
  if (cols === 1) return "grid-cols-1";
  if (cols === 2) return "grid-cols-1 sm:grid-cols-2";
  return "grid-cols-2 sm:grid-cols-3";
}

interface AmenityItem {
  label: string;
  counter?: boolean;
}
interface AmenityGroup {
  group: string;
  items: AmenityItem[];
}

const toggleItems = (labels: string[]): AmenityItem[] => labels.map((label) => ({ label }));

const BUILDING_GROUPS: AmenityGroup[] = [
  {
    group: "Green & Comfort",
    items: toggleItems([
      "Green Building / Sustainability",
      "Natural Lighting",
      "Community Garden",
      "Pet Friendly",
      "Garden",
      "Playground",
    ]),
  },
  {
    group: "Leisure & Wellness",
    items: toggleItems([
      "Swimming Pools",
      "Spa",
      "Gym",
      "Billiards Table",
      "Kids Play Area",
      "Clubhouse",
      "Snooze Room",
      "Games Room",
      "Social Area / Rooftop Garden",
    ]),
  },
  { group: "Safety & Security", items: toggleItems(["Security Systems", "CCTV Surveillance"]) },
  { group: "Convenience", items: toggleItems(["Drinking Water"]) },
  { group: "Location Advantage", items: toggleItems(["Prime Location"]) },
];

const UNIT_GROUPS: AmenityGroup[] = [
  {
    group: "Interior & Comfort",
    items: [
      ...toggleItems(["Window Coverings", "Balcony", "Natural Lighting", "Bathtubs", "Smart Home"]),
      { label: "No. of Washrooms", counter: true },
    ],
  },
  {
    group: "Parking & Transport",
    items: [
      { label: "Car Parking", counter: true },
      { label: "Bike Parking", counter: true },
      { label: "EV Charger", counter: true },
    ],
  },
];

const ALL_BUILDING = BUILDING_GROUPS.flatMap((g) => g.items.map((i) => i.label));
const ALL_UNIT = UNIT_GROUPS.flatMap((g) => g.items.map((i) => i.label));

const AMENITY_ICONS: Record<string, LucideIcon> = {
  "Green Building / Sustainability": Leaf,
  "Natural Lighting": Sun,
  "Community Garden": Trees,
  "Pet Friendly": PawPrint,
  Garden: Trees,
  Playground: Users,
  "Swimming Pools": Waves,
  Spa: Sparkles,
  Gym: Dumbbell,
  "Billiards Table": Target,
  "Kids Play Area": Users,
  Clubhouse: Building2,
  "Snooze Room": BedDouble,
  "Games Room": Gamepad2,
  "Social Area / Rooftop Garden": Building2,
  "Security Systems": ShieldCheck,
  "CCTV Surveillance": Camera,
  "Drinking Water": Droplet,
  "Prime Location": MapPin,
  "Window Coverings": Building2,
  Balcony: Building2,
  Bathtubs: Bath,
  "Smart Home": House,
  "No. of Washrooms": Bath,
  "Car Parking": Car,
  "Bike Parking": Bike,
  "EV Charger": Plug,
};
const iconFor = (label: string) => AMENITY_ICONS[label] ?? Sparkles;

function AmenityChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
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
      {createElement(iconFor(label), {
        className: "text-ink-muted size-4 shrink-0",
        strokeWidth: 1.75,
      })}
      {label}
      {selected && (
        <span className="bg-accent-blue grid size-4 shrink-0 place-items-center rounded-full">
          <Check className="size-3 text-white" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

function CounterChip({
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
      {createElement(iconFor(label), {
        className: "text-ink-muted size-4 shrink-0",
        strokeWidth: 1.75,
      })}
      {label}
      {active && (
        <span className="bg-accent-blue grid size-4 shrink-0 place-items-center rounded-full">
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

function AmenityColumn({
  title,
  groups,
  sel,
  setSel,
  counts,
  setCounts,
  collapsibleAfter,
}: {
  title: string;
  groups: AmenityGroup[];
  sel: Record<string, boolean>;
  setSel: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  counts: Record<string, number>;
  setCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  collapsibleAfter?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const collapsible = collapsibleAfter != null && groups.length > collapsibleAfter;
  const visibleGroups = collapsible && !expanded ? groups.slice(0, collapsibleAfter) : groups;
  const toggleLabels = groups.flatMap((g) => g.items.filter((i) => !i.counter).map((i) => i.label));
  const counterLabels = groups.flatMap((g) => g.items.filter((i) => i.counter).map((i) => i.label));
  const toggle = (l: string) => setSel((s) => ({ ...s, [l]: !s[l] }));
  const setCount = (l: string, n: number) => setCounts((c) => ({ ...c, [l]: Math.max(0, n) }));
  const added = [
    ...toggleLabels.filter((l) => sel[l]),
    ...counterLabels.filter((l) => (counts[l] ?? 0) > 0),
  ];

  return (
    <div className="rounded-xl border border-black/[0.07] p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-ink text-lg font-bold">{title}</h3>
        <button
          type="button"
          onClick={() => setSel(Object.fromEntries(toggleLabels.map((l) => [l, true])))}
          className="text-ink-muted rounded-lg border border-black/15 px-3 py-1.5 text-xs font-medium"
        >
          Select All
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-ink text-sm font-medium">Added {added.length} Amenities</p>
        {added.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setSel({});
              setCounts({});
            }}
            className="text-accent-blue text-sm font-medium"
          >
            Clear All
          </button>
        )}
      </div>
      {added.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {added.map((l) => (
            <span
              key={l}
              className="border-accent-blue/30 bg-accent-blue/[0.06] text-ink inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
            >
              {l}
              {counterLabels.includes(l) && <span className="font-semibold">{counts[l]}</span>}
              <button
                type="button"
                onClick={() => (counterLabels.includes(l) ? setCount(l, 0) : toggle(l))}
                aria-label={`Remove ${l}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 space-y-5">
        {visibleGroups.map((g) => (
          <div key={g.group}>
            <p className="text-ink text-sm font-semibold">{g.group}</p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {g.items.map((item) =>
                item.counter ? (
                  <CounterChip
                    key={item.label}
                    label={item.label}
                    count={counts[item.label] ?? 0}
                    onChange={(n) => setCount(item.label, n)}
                  />
                ) : (
                  <AmenityChip
                    key={item.label}
                    label={item.label}
                    selected={!!sel[item.label]}
                    onClick={() => toggle(item.label)}
                  />
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {collapsible && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-accent-blue mt-4 inline-flex items-center gap-1 text-sm font-medium"
        >
          {expanded ? "View Less" : "View More"}
          <ChevronDown
            className={cn("size-4 transition-transform", expanded && "rotate-180")}
          />
        </button>
      )}
    </div>
  );
}

function SummaryField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-ink-muted text-sm">{label}</p>
      <div className="text-ink mt-1 text-sm font-medium">{children}</div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-black/[0.08] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="bg-accent-blue/10 text-accent-blue grid size-9 shrink-0 place-items-center rounded-lg">
            <Icon className="size-5" strokeWidth={1.75} />
          </span>
          <div>
            <h3 className="text-ink font-bold">{title}</h3>
            <p className="text-ink-muted text-sm">{desc}</p>
          </div>
        </div>
        <button type="button" className="text-accent-blue flex shrink-0 items-center gap-1 text-sm font-medium">
          <Pencil className="size-3.5" />
          Edit
        </button>
      </div>
      <div className="mt-4 border-t border-black/[0.06] pt-4">{children}</div>
    </div>
  );
}

const FASTER_TIPS = [
  "Provide accurate property details (address, size, and type) for faster visibility",
  "Highlight your must-have amenities to attract the right buyers",
  "Keep your contact information updated so interested parties can reach you immediately",
  "Include high-quality photos to make your listing more appealing",
];

function ListFasterCard() {
  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white p-5">
      <div className="bg-accent-blue/5 relative mb-4 grid h-28 place-items-center overflow-hidden rounded-xl">
        <div className="flex items-end gap-1">
          <House className="text-accent-blue/30 size-10" strokeWidth={1.5} />
          <Building2 className="text-accent-blue/50 size-14" strokeWidth={1.5} />
        </div>
        <FileText
          className="text-accent-blue/40 absolute bottom-3 left-5 size-7 -rotate-6"
          strokeWidth={1.5}
        />
        <Sparkles className="text-brand-orange/60 absolute top-4 left-6 size-4" />
        <span className="bg-brand-green absolute top-3 right-5 grid size-6 place-items-center rounded-full text-white shadow-sm">
          <Check className="size-3.5" strokeWidth={3} />
        </span>
      </div>
      <p className="text-ink font-bold">List Your Property Faster!</p>
      <ul className="mt-3 space-y-3">
        {FASTER_TIPS.map((t) => (
          <li key={t} className="text-ink-muted flex gap-2 text-sm leading-snug">
            <CircleCheck className="text-accent-blue mt-0.5 size-4 shrink-0" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

const VIDEO_STATUS_STEPS = [
  "Selecting best photos...",
  "Analysing property details & composition...",
  "Rendering your video...",
  "Finalising & polishing...",
];
const statusForProgress = (p: number) =>
  p < 30
    ? VIDEO_STATUS_STEPS[0]
    : p < 60
      ? VIDEO_STATUS_STEPS[1]
      : p < 90
        ? VIDEO_STATUS_STEPS[2]
        : VIDEO_STATUS_STEPS[3];

function VideoGenerationCard({
  progress,
  ready,
  title,
  onPreview,
}: {
  progress: number;
  ready: boolean;
  title: string;
  onPreview: () => void;
}) {
  if (ready) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            {CARD_CONFETTI.map((c, i) => (
              <span
                key={i}
                className="pointer-events-none absolute top-1/2 left-1/2"
                style={
                  {
                    width: c.w,
                    height: c.h,
                    backgroundColor: c.color,
                    borderRadius: c.round ? "9999px" : "1px",
                    animation: "confetti-pop 1100ms cubic-bezier(0.15, 0.6, 0.4, 1) forwards",
                    animationDelay: `${c.delay}ms`,
                    "--tx": `${c.tx}px`,
                    "--peak-y": `${c.peakY}px`,
                    "--fall-y": `${c.fallY}px`,
                    "--r": `${c.r}deg`,
                  } as React.CSSProperties
                }
              />
            ))}
            <span
              className="grid size-6 shrink-0 place-items-center rounded-full bg-green-500 text-white"
              style={{ animation: "tick-pop 500ms cubic-bezier(0.2, 0.8, 0.2, 1.4) both" }}
            >
              <Check className="size-4" strokeWidth={3} />
            </span>
          </div>
          <div>
            <p className="font-bold text-green-700">Video Generated!</p>
            <p className="text-ink-muted text-xs">Video ready to preview</p>
          </div>
        </div>
        <Button
          onClick={onPreview}
          className="mt-3 h-9 w-full rounded-lg bg-green-600 text-sm font-semibold text-white hover:bg-green-700"
        >
          <Play className="size-4" />
          Preview &amp; Attach Video
        </Button>
      </div>
    );
  }

  return (
    <div className="border-brand-orange/25 bg-brand-orange/[0.05] rounded-2xl border p-4">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white shadow-sm">
          <Video className="text-brand-orange size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="text-ink truncate text-sm font-semibold">Creating Your Video...</p>
          <p className="text-ink-muted truncate text-xs">{title}</p>
        </div>
      </div>
      <div className="bg-brand-orange/20 mt-3 h-1.5 w-full overflow-hidden rounded-full">
        <div
          className="bg-brand-orange h-full rounded-full transition-[width] duration-200 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-brand-orange mt-1.5 flex items-center justify-between gap-2 text-[11px] font-medium">
        <span className="truncate">{statusForProgress(progress)}</span>
        <span className="shrink-0 font-semibold">{progress}%</span>
      </div>
    </div>
  );
}

const VIDEO_FRAMES = [
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
];
const VIDEO_SCENES = Array.from({ length: 8 }, (_, i) => VIDEO_FRAMES[i % VIDEO_FRAMES.length]);

const VIDEO_STATS: { icon: LucideIcon; value: string; label: string }[] = [
  { icon: TrendingUp, value: "+300%", label: "Engagement" },
  { icon: Eye, value: "Top", label: "Rankings" },
  { icon: Sparkles, value: "Premium", label: "Stand Out" },
];

function VideoPreviewModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-black/[0.06] px-6 pt-5 pb-4">
          <div>
            <h2 className="text-ink text-xl font-bold">
              Your Property Video is Ready to Shine ✨
            </h2>
            <p className="text-ink-muted mt-1 text-sm">
              Preview your AI-generated video. Regenerate, download instantly or attach to listing.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-ink-muted grid size-8 shrink-0 place-items-center rounded-full bg-black/[0.05] transition-colors hover:bg-black/10"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <span className="bg-brand-green grid size-7 shrink-0 place-items-center rounded-full text-white">
              <Check className="size-4" strokeWidth={3} />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-green-700">Your Video is Ready</p>
              <p className="text-ink-muted truncate text-xs">
                <span className="text-ink font-medium">Spacious 3BHK Apartment</span> Generated
                successfully on Apr 2, 2026 • 11:30 AM
              </p>
            </div>
          </div>

          {/* Player */}
          <div className="relative mt-4 aspect-video overflow-hidden rounded-xl bg-black">
            <Image
              src={VIDEO_FRAMES[0]}
              alt="AI-generated property video preview"
              fill
              sizes="(max-width: 768px) 100vw, 720px"
              className="object-cover opacity-90"
            />
            <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#6d3bf5] shadow-sm">
              <Sparkles className="size-3.5" />
              AI Generated
            </span>
            <button
              type="button"
              className="text-ink absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-sm"
            >
              <span className="bg-brand-orange size-2 rounded-full" />
              Add Voice
            </button>
            <button
              type="button"
              aria-label="Play video"
              className="absolute top-1/2 left-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/25 text-white backdrop-blur-sm transition-colors hover:bg-white/35"
            >
              <Play className="size-5 fill-white" />
            </button>
            <div className="absolute inset-x-0 bottom-0 px-4 pb-3">
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/30">
                <div className="bg-accent-blue h-full w-[55%] rounded-full" />
              </div>
              <div className="mt-2 flex items-center gap-3 text-white">
                <Play className="size-4 fill-white" />
                <span className="text-xs tabular-nums">0:25 / 00:45</span>
                <span className="ml-auto flex items-center gap-3">
                  <Volume2 className="size-4" />
                  <Maximize2 className="size-4" />
                </span>
              </div>
            </div>
          </div>

          {/* Scenes */}
          <div className="mt-5">
            <p className="text-ink text-sm font-bold">Video Scenes ({VIDEO_SCENES.length})</p>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {VIDEO_SCENES.map((src, i) => (
                <div
                  key={i}
                  className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-lg ring-1 ring-black/10"
                >
                  <Image src={src} alt={`Scene ${i + 1}`} fill sizes="96px" className="object-cover" />
                  <span className="absolute top-1.5 left-1.5 rounded bg-black/55 px-1.5 text-[10px] font-semibold text-white">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {i === 0 && (
                    <span className="absolute inset-0 grid place-items-center bg-black/20">
                      <Play className="size-4 fill-white text-white" />
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-black/[0.06] px-6 py-4">
          <Button
            variant="outline"
            className="text-ink h-11 rounded-lg border-black/15 px-4 text-sm font-medium"
          >
            <RotateCw className="size-4" />
            Regenerate New Video
          </Button>
          <Button
            variant="outline"
            className="text-ink h-11 rounded-lg border-black/15 px-4 text-sm font-medium"
          >
            <Download className="size-4" />
            Download
          </Button>
          <Button
            onClick={onClose}
            className="bg-brand-blue hover:bg-brand-blue-hover h-11 rounded-lg px-5 text-sm font-semibold text-white"
          >
            Attach to Listing
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

const CONFETTI_COLORS = ["#1c9e57", "#2f6bed", "#ef8e2b", "#e23b58", "#f0d59a", "#6d3bf5", "#16b8c4"];
const CARD_CONFETTI = Array.from({ length: 16 }, (_, i) => {
  const rad = ((-158 + (i / 15) * 136) * Math.PI) / 180;
  const dist = 24 + (i % 4) * 9;
  const peakY = Math.round(Math.sin(rad) * dist);
  const shape = i % 3;
  return {
    tx: Math.round(Math.cos(rad) * dist),
    peakY,
    fallY: peakY + 44 + (i % 4) * 8,
    r: (i % 2 ? 1 : -1) * (160 + (i % 3) * 70),
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: (i % 4) * 25,
    w: shape === 1 ? 3 : 5,
    h: shape === 1 ? 7 : 5,
    round: shape === 0,
  };
});
const CONFETTI = Array.from({ length: 34 }, (_, i) => {
  const t = i / 33;
  const angleDeg = -162 + t * 144 + ((i % 3) - 1) * 5; // fan pointing upward, left → right
  const rad = (angleDeg * Math.PI) / 180;
  const dist = 66 + (i % 6) * 15;
  const peakY = Math.round(Math.sin(rad) * dist); // negative = rises above the tick
  const shape = i % 3; // 0 dot, 1 streamer, 2 square
  return {
    tx: Math.round(Math.cos(rad) * dist),
    peakY,
    fallY: peakY + 130 + (i % 5) * 16, // gravity pulls each piece back down
    r: (i % 2 ? 1 : -1) * (220 + (i % 4) * 80),
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: (i % 5) * 30,
    w: shape === 1 ? 4 : 6 + (i % 3) * 2,
    h: shape === 1 ? 10 : 6 + (i % 3) * 2,
    round: shape === 0,
  };
});

function SuccessModal() {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
      <div className="relative flex w-full max-w-md flex-col items-center rounded-2xl bg-white px-4 sm:px-6 lg:px-8 py-10 text-center shadow-2xl">
        <div className="relative grid size-20 place-items-center">
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
                  animation: "confetti-pop 1300ms cubic-bezier(0.15, 0.6, 0.4, 1) forwards",
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
        <h2 className="text-ink mt-5 text-2xl font-bold">Property Added Successfully</h2>
        <p className="text-ink-muted mt-2 text-sm">
          Your property has been listed and is ready for content creation
        </p>
      </div>
    </div>
  );
}

function ReviewAmenityColumn({
  title,
  groups,
  counts,
}: {
  title: string;
  groups: AmenityGroup[];
  counts: Record<string, number>;
}) {
  return (
    <div className="rounded-xl border border-black/[0.07] p-5">
      <h3 className="text-ink text-lg font-bold">{title}</h3>
      <div className="mt-4 space-y-4">
        {groups.map((g) => (
          <div key={g.group}>
            <p className="text-ink text-sm font-semibold">{g.group}</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {g.items.map((item) => (
                <span
                  key={item.label}
                  className="text-ink inline-flex items-center gap-2 rounded-lg border border-black/15 px-3 py-2 text-sm"
                >
                  {createElement(iconFor(item.label), {
                    className: "text-ink-muted size-4 shrink-0",
                    strokeWidth: 1.75,
                  })}
                  {item.label}
                  {item.counter && (counts[item.label] ?? 0) > 0 && (
                    <span className="text-ink font-semibold">{counts[item.label]}</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ManualForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  // Edit mode: /add-property/manual?edit=<listingId> loads an existing listing.
  const editId = useSearchParams().get("edit");
  // Becomes true after a Continue attempt with unfilled required (*) fields;
  // drives red highlighting until the step is valid. Reset on step change.
  const [showErrors, setShowErrors] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showCreateVideo, setShowCreateVideo] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [type, setType] = useState("Residential");
  const cfg = TYPE_CONFIG[type];

  // Property Overview
  const [lister, setLister] = useState<string | null>(null);
  const [availableFor, setAvailableFor] = useState<string | null>(null);
  const [openCat, setOpenCat] = useState<string | null>(cfg.categories[0].label);
  const [specs, setSpecs] = useState<Record<string, boolean>>({});

  // Space Details
  const [areaType, setAreaType] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [availDate, setAvailDate] = useState("Immediately");
  const [unitCondition, setUnitCondition] = useState<string | null>(null);
  const [openToCp, setOpenToCp] = useState("No");

  // Location Details
  const [locStage, setLocStage] = useState<"locality" | "building" | "full">("locality");
  const [showMap, setShowMap] = useState(false);

  // Upload Images
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // AI video generation (runs in the left rail from the Upload step onward)
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [generatedVideoGenId, setGeneratedVideoGenId] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const videoStartedRef = useRef(false);

  async function runVideoGeneration() {
    if (videoStartedRef.current || imageFiles.length === 0) return;
    videoStartedRef.current = true;
    setVideoGenerating(true);
    setVideoProgress(0);
    setGeneratedVideoUrl(null);
    try {
      const gen = await api.video.create(f.title || "Property Video");
      setGeneratedVideoGenId(gen.generation_id);
      for (const file of imageFiles) await api.video.uploadImage(gen.generation_id, file);
      await api.video.trigger(gen.generation_id);
      while (true) {
        await new Promise((r) => setTimeout(r, 2500));
        const st = await api.video.status(gen.generation_id);
        setVideoProgress(st.progress ?? 0);
        if (st.status === "completed") {
          if (st.video_url) setGeneratedVideoUrl(st.video_url);
          break;
        }
        if (st.status === "failed") break;
      }
    } catch {
      /* keep the card in a non-blocking state */
    } finally {
      setVideoGenerating(false);
    }
  }

  // Editable text fields (controlled)
  const [f, setF] = useState<ManualFields>({
    ...EMPTY_MANUAL,
    locality: "Hinjewadi",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411045",
  });
  const setField = (k: keyof ManualFields, v: string) => setF((s) => ({ ...s, [k]: v }));

  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  // Auto-fill the address fields from a Google Places selection.
  function applyPlace(d: PlaceDetails, target: "building" | "full" = "building") {
    setF((s) => ({
      ...s,
      locality: d.locality || d.city || s.locality,
      city: d.city || s.city,
      state: d.state || s.state,
      pincode: d.pincode || s.pincode,
      fullAddress: d.formatted_address || s.fullAddress,
      latitude: d.latitude != null ? String(d.latitude) : s.latitude,
      longitude: d.longitude != null ? String(d.longitude) : s.longitude,
      // When the selection names a building/establishment, prefill it.
      building: target === "full" && d.name ? d.name : s.building,
    }));
    setLocStage(target);
  }

  // Use the browser's geolocation, then reverse-geocode via Google to auto-fill.
  function useCurrentLocation() {
    setLocError(null);
    if (!("geolocation" in navigator)) {
      setLocError("Location is not supported on this device.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const d = await api.places.reverse(pos.coords.latitude, pos.coords.longitude);
          applyPlace(d);
        } catch {
          setLocError("Couldn't fetch your location. Please search instead.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocError("Location permission denied. Please search instead.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // Edit mode: load the existing listing and pre-fill the form.
  useEffect(() => {
    if (!editId) return;
    let off = false;
    api.listings
      .get(editId)
      .then((g) => {
        if (off) return;
        const s = (v: unknown) => (v == null ? "" : String(v));
        setF((prev) => ({
          ...prev,
          title: s(g.property_title),
          description: s(g.description),
          area: s(g.chargeable_area ?? g.area_sqft),
          price: s(g.price ?? g.rent_value ?? g.sale_value ?? g.rent_rate ?? g.sale_rate),
          locality: s(g.locality),
          city: s(g.city),
          state: s(g.state),
          building: s(g.building_name),
          wing: s(g.wing_or_tower),
          unit: s(g.flat_or_unit_no),
          floor: s(g.property_on_floor),
          totalFloors: s(g.total_floors),
          micromarket: s(g.micromarket),
          year: s(g.year_of_construction),
          landmark: s(g.landmark),
          pincode: s(g.pincode),
          fullAddress: s(g.address),
          latitude: s(g.latitude),
          longitude: s(g.longitude),
        }));
        const pt = s(g.property_type).toLowerCase();
        setType(pt.includes("land") ? "Land" : pt.includes("commercial") ? "Commercial" : "Residential");
        const avail = s(g.property_available_for).toLowerCase();
        if (avail) setAvailableFor(avail.includes("rent") ? "Rent" : "Sale");
        // The location step already has its fields — jump to the full view.
        if (g.city || g.locality) setLocStage("full");
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [editId]);

  const imagePreviews = useMemo(() => imageFiles.map((file) => URL.createObjectURL(file)), [imageFiles]);
  useEffect(() => () => imagePreviews.forEach((u) => URL.revokeObjectURL(u)), [imagePreviews]);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Amenities
  const [bSel, setBSel] = useState<Record<string, boolean>>({
    Spa: true,
    "Kids Play Area": true,
    "Social Area / Rooftop Garden": true,
  });
  const [bCounts, setBCounts] = useState<Record<string, number>>({});
  const [uSel, setUSel] = useState<Record<string, boolean>>({
    "Natural Lighting": true,
    Balcony: true,
  });
  const [uCounts, setUCounts] = useState<Record<string, number>>({
    "Car Parking": 2,
    "Bike Parking": 2,
  });
  const [story, setStory] = useState(
    "Experience elegant living in a prime location that connects you to everything you love. This thoughtfully designed home features modern architecture and premium finishes. Enjoy breathtaking views, exclusive amenities, and unmatched comfort. It's more than a residence — it's a statement of your lifestyle."
  );

  function selectType(t: string) {
    setType(t);
    setOpenCat(TYPE_CONFIG[t].categories[0].label);
  }

  // Build the backend listing payload + a synthesized transcript from the
  // current form state. Shared by submit, edit, and draft autosave.
  function buildData(status: "active" | "draft" = "active"): {
    data: Record<string, unknown>;
    transcript: string;
  } {
    const selectedAmenities = [
      ...ALL_BUILDING.filter((l) => bSel[l]),
      ...ALL_UNIT.filter((l) => uSel[l]),
    ];
    const availLower = (availableFor || "sale").toLowerCase();
    const isRent = availLower.includes("rent");
    const amount = parseAmount(f.price);
    const data: Record<string, unknown> = {
      property_title: f.title || `${openCat ?? "Property"} in ${f.locality || f.city || "—"}`,
      description: f.description || story,
      property_type: type === "Land" ? "land" : type.toLowerCase(),
      category: (openCat && CATEGORY_ENUM[openCat]) || "apartment_flats",
      listing_as: (lister || "owner").toLowerCase().includes("broker")
        ? "broker"
        : (lister || "owner").toLowerCase().includes("builder")
          ? "builder"
          : "owner",
      bedrooms: bedroomsFromSpecs(openCat, specs),
      chargeable_area: num(f.area),
      area_sqft: num(f.area),
      property_available_for: isRent ? "rent" : "sale",
      // mandatory backend fields (fall back to sensible defaults)
      property_on_floor: num(f.floor) ?? 1,
      total_floors: num(f.totalFloors) ?? 1,
      year_of_construction: f.year || "2020",
      unit_type_preference: areaType === "Carpet Area" ? "sq-ft" : "sq-ft",
      city: f.city || null,
      state: f.state || null,
      locality: f.locality || null,
      building_name: f.building || null,
      wing_or_tower: f.wing || null,
      flat_or_unit_no: f.unit || null,
      micromarket: f.micromarket || null,
      landmark: f.landmark || null,
      pincode: f.pincode || null,
      address: f.fullAddress || null,
      latitude: f.latitude ? Number(f.latitude) : null,
      longitude: f.longitude ? Number(f.longitude) : null,
      listing_status: status,
      unique_story: story,
      ...(unitCondition && FURNISHING[unitCondition]
        ? { furnishing_type: FURNISHING[unitCondition] }
        : {}),
      ...amenityBooleans(selectedAmenities),
    };
    if (isRent) data.rent_rate = amount;
    else data.sale_rate = amount;
    if (f.price) data.price = f.price;
    const transcript =
      f.description || story || `${data.property_title} in ${f.locality || f.city || ""}`.trim();
    return { data, transcript };
  }

  // AI description generation from the fields entered so far.
  const [genDesc, setGenDesc] = useState(false);
  async function generateDescription() {
    setGenDesc(true);
    try {
      const { data } = buildData();
      const res = await api.listings.generateDescription(data);
      if (res.description) setField("description", res.description);
    } catch {
      /* ignore — leave the field as-is */
    } finally {
      setGenDesc(false);
    }
  }

  // Autosave a resumable draft as the user advances steps (shows in My Content →
  // Draft). Best-effort; never blocks the form.
  const draftIdRef = useRef<string | null>(null);
  async function autosaveDraft() {
    if (editId || !f.title.trim()) return;
    try {
      const { data, transcript } = buildData("draft");
      if (draftIdRef.current) {
        await api.listings.update(draftIdRef.current, data);
      } else {
        const res = await api.listings.saveDraft(data, transcript);
        if (res.listing_id) draftIdRef.current = res.listing_id;
      }
    } catch {
      /* silent — drafts are a convenience, not a blocker */
    }
  }

  async function listProperty() {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const { data, transcript } = buildData("active");

      // Edit mode: update the existing listing and return to its detail page.
      if (editId) {
        await api.listings.update(editId, data);
        router.push(`/property?id=${editId}`);
        return;
      }
      // A draft was already created during the flow — finalize it instead of duplicating.
      if (draftIdRef.current && imageFiles.length === 0) {
        await api.listings.update(draftIdRef.current, { ...data, listing_status: "active" });
        setShowSuccess(true);
        window.setTimeout(() => router.push("/"), 2000);
        return;
      }

      if (imageFiles.length > 0) {
        await api.listings.submitWithMedia(data, { images: imageFiles }, { transcript });
      } else {
        await api.listings.submit(data, transcript);
      }
      setShowSuccess(true);
      window.setTimeout(() => router.push("/"), 2000);
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : "Failed to list the property. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const heading =
    step === 0
      ? "Property Overview"
      : step === 1 || step === 2
        ? `Add ${cfg.steps[step].title}`
        : step === 4
          ? "Select Amenities"
          : step === 5
            ? "Review Your Property Listing"
            : cfg.steps[step].title;
  const subtitle =
    step === 3
      ? "Buyers fall in love with what they see first. Photos make your listing stand out and attract serious interest."
      : step === 4
        ? ""
        : step === 5
          ? "Check every detail before publishing. You can jump back to any step to refine the information."
          : "Please provide following information for your property";
  const spotlight = step === 2 ? (locStage === "full" ? 50 : 30) : SPOTLIGHT_BY_STEP[Math.min(step, 4)];
  const continueLabel =
    step >= 5 ? (editId ? "Save Changes" : "Let's List Property!") : step === 4 ? "Review Listing" : "Continue";

  // Required (*) fields per step — the user must fill these before continuing.
  const missing = useMemo(() => {
    const m: string[] = [];
    if (step === 0) {
      if (cfg.listerLabel && !lister) m.push(cfg.listerLabel);
      if (!f.title.trim()) m.push(cfg.titleLabel);
      const oc = cfg.categories.find((c) => c.label === openCat);
      if (oc && oc.options.length > 0 && !oc.options.some((opt) => specs[`${oc.label}|${opt}`])) {
        m.push("Category Specification");
      }
      if (!availableFor) m.push("Available For");
    } else if (step === 1) {
      if (!f.area.trim()) m.push("Chargeable Area");
      if (!f.price.trim()) m.push(availableFor === "Rent" ? "Expected Rent" : "Expected Price");
      if (!areaType) m.push("Property Area Type");
      if (!status) m.push("Current Status");
    } else if (step === 2) {
      // Must finish picking a location, then fill the required (*) address fields.
      if (locStage !== "full") {
        m.push("Property Location");
      } else {
        if (!f.locality.trim()) m.push("Locality");
        if (!f.city.trim()) m.push("City");
        if (!f.state.trim()) m.push("State");
        if (!f.building.trim()) m.push("Building/Project Name");
        if (!f.pincode.trim()) m.push("Pincode");
      }
    }
    return m;
  }, [
    step,
    cfg,
    lister,
    f.title,
    f.area,
    f.price,
    f.locality,
    f.city,
    f.state,
    f.building,
    f.pincode,
    availableFor,
    areaType,
    status,
    openCat,
    specs,
    locStage,
  ]);

  // True when a required field is empty AND the user has tried to continue.
  const err = (empty: boolean) => showErrors && empty;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {showVideo && <VideoPreviewModal onClose={() => setShowVideo(false)} />}
      {showVideoModal && generatedVideoUrl && (
        <GeneratedVideoModal
          videoUrl={generatedVideoUrl}
          genId={generatedVideoGenId}
          title={f.title || "Your Property Video"}
          sceneCount={Math.max(imageFiles.length, 8)}
          onClose={() => setShowVideoModal(false)}
        />
      )}
      {showCreateVideo && (
        <CreateVideoModal
          images={imageFiles}
          onClose={() => setShowCreateVideo(false)}
          onGenerate={runVideoGeneration}
          title={f.title || undefined}
          location={[f.locality, f.city, f.state].filter(Boolean).join(", ") || undefined}
          building={f.building || undefined}
        />
      )}
      {showSuccess && <SuccessModal />}
      {showMap && (
        <GoogleMapPicker
          initialQuery={f.building || f.locality || f.city}
          onClose={() => setShowMap(false)}
          onUse={(d) => {
            applyPlace(d, "full");
            setShowMap(false);
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
          <h1 className="text-ink text-2xl font-bold">{editId ? "Edit Property" : "List Your Property"}</h1>
          <p className="text-ink-muted text-sm">
            Share details of your property and get your property listed in our network
          </p>
        </div>
      </div>

      {/* Body: left rail + form */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-y-auto px-4 pb-8 sm:px-6 lg:grid-cols-[300px_1fr] lg:gap-6 lg:overflow-visible lg:px-8">
        <div className="order-2 space-y-5 lg:order-1">
          {step === 5 ? <ListFasterCard /> : <Stepper steps={cfg.steps} current={step} />}
          {(videoGenerating || generatedVideoUrl) && (
            <VideoGenerationCard
              progress={Math.max(5, videoProgress)}
              ready={!!generatedVideoUrl && !videoGenerating}
              title={f.title || "Your Property Video"}
              onPreview={() => setShowVideoModal(true)}
            />
          )}
          <SpotlightScore value={spotlight} />
        </div>

        <div className="order-1 rounded-2xl border border-black/[0.07] bg-white p-4 sm:p-6 lg:order-2 lg:min-h-0 lg:overflow-y-auto lg:p-7">
          <h2 className="text-ink text-xl font-bold">{heading}</h2>
          {subtitle && <p className="text-ink-muted mt-1 text-sm">{subtitle}</p>}

          <div className="mt-7 space-y-7">
            {step === 0 && (
              <>
                {cfg.listerLabel && (
                  <Field label={cfg.listerLabel}>
                    <div className="flex flex-wrap gap-3">
                      {LISTERS.map((l) => (
                        <Pill key={l} label={l} selected={lister === l} onClick={() => setLister(l)} />
                      ))}
                    </div>
                    {err(!lister) && <p className="mt-2 text-xs text-red-500">Please select an option</p>}
                  </Field>
                )}

                <Field label={cfg.titleLabel}>
                  <div className={cn("flex items-center gap-3 rounded-xl border bg-white px-4 py-3 focus-within:border-accent-blue/50", err(!f.title.trim()) ? "border-red-500" : "border-black/15")}>
                    <input
                      type="text"
                      placeholder={cfg.titlePlaceholder}
                      value={f.title}
                      onChange={(e) => setField("title", e.target.value)}
                      className="text-ink placeholder:text-ink-muted/70 min-w-0 flex-1 bg-transparent text-sm outline-none"
                    />
                    <AiButton />
                  </div>
                </Field>

                <Field label={cfg.descLabel}>
                  <div className="flex items-start gap-3 rounded-xl border border-black/15 bg-white px-4 py-3 focus-within:border-accent-blue/50">
                    <textarea
                      rows={3}
                      placeholder="Add description for property"
                      value={f.description}
                      onChange={(e) => setField("description", e.target.value)}
                      className="text-ink placeholder:text-ink-muted/70 min-w-0 flex-1 resize-none bg-transparent text-sm outline-none"
                    />
                    <AiButton onClick={generateDescription} loading={genDesc} />
                  </div>
                </Field>

                <Field label={cfg.typeLabel}>
                  <div className="flex flex-wrap gap-3">
                    {TYPES.map((t) => (
                      <Pill key={t} label={t} selected={type === t} onClick={() => selectType(t)} />
                    ))}
                  </div>
                </Field>

                <Field label="Select Category & Specifications">
                  <div
                    className={cn(
                      "grid grid-cols-1 gap-3",
                      cfg.categories.length >= 5
                        ? "sm:grid-cols-3 lg:grid-cols-5"
                        : cfg.categories.length === 4
                          ? "sm:grid-cols-2 lg:grid-cols-4"
                          : "sm:grid-cols-3"
                    )}
                  >
                    {cfg.categories.map((c) => (
                      <CategoryToggle
                        key={c.label}
                        label={c.label}
                        open={openCat === c.label}
                        onClick={() => setOpenCat(openCat === c.label ? null : c.label)}
                      />
                    ))}
                  </div>
                  {cfg.categories
                    .filter((c) => c.label === openCat)
                    .map((c) => (
                      <div key={c.label} className="mt-3 rounded-xl border border-black/[0.08] p-5">
                        <p className="text-ink text-sm font-medium">{c.question}</p>
                        <div className={cn("mt-4 grid gap-x-4 gap-y-4", specGridCols(c.cols))}>
                          {c.options.map((opt) => {
                            const key = c.label + "|" + opt;
                            return (
                              <SpecCheckbox
                                key={key}
                                label={opt}
                                checked={!!specs[key]}
                                onChange={() => setSpecs((s) => ({ ...s, [key]: !s[key] }))}
                              />
                            );
                          })}
                        </div>
                        {err(c.options.length > 0 && !c.options.some((opt) => specs[`${c.label}|${opt}`])) && (
                          <p className="mt-3 text-xs text-red-500">Please select at least one option</p>
                        )}
                      </div>
                    ))}
                </Field>

                <Field label="Your property is available for">
                  <div className="flex flex-wrap gap-3">
                    {AVAILABILITY.map((a) => (
                      <Pill
                        key={a}
                        label={a}
                        selected={availableFor === a}
                        onClick={() => setAvailableFor(a)}
                      />
                    ))}
                  </div>
                  {err(!availableFor) && <p className="mt-2 text-xs text-red-500">Please select an option</p>}
                </Field>
              </>
            )}

            {step === 1 && (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <Field label="Chargeable Area (sq. ft)" required>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g., 1200"
                      value={f.area}
                      onChange={(e) => setField("area", e.target.value)}
                      className={cn("text-ink placeholder:text-ink-muted/60 focus:border-accent-blue/50 h-11 w-full rounded-lg border bg-white px-3.5 text-sm outline-none", err(!f.area.trim()) ? "border-red-500" : "border-black/15")}
                    />
                  </Field>
                  <Field label={availableFor === "Rent" ? "Expected Rent (₹/month)" : "Expected Price (₹)"} required>
                    <input
                      type="text"
                      placeholder={availableFor === "Rent" ? "e.g., 25000" : "e.g., 90 Lakhs or 1.2 Cr"}
                      value={f.price}
                      onChange={(e) => setField("price", e.target.value)}
                      className={cn("text-ink placeholder:text-ink-muted/60 focus:border-accent-blue/50 h-11 w-full rounded-lg border bg-white px-3.5 text-sm outline-none", err(!f.price.trim()) ? "border-red-500" : "border-black/15")}
                    />
                  </Field>
                </div>

                <Field label="Property Area Type">
                  <div className="flex flex-wrap gap-3">
                    {AREA_TYPES.map((a) => (
                      <Pill key={a} label={a} selected={areaType === a} onClick={() => setAreaType(a)} />
                    ))}
                  </div>
                  {err(!areaType) && <p className="mt-2 text-xs text-red-500">Please select an option</p>}
                </Field>

                <Field label="Current Status">
                  <div className="flex flex-wrap gap-3">
                    {STATUSES.map((s) => (
                      <Pill key={s} label={s} selected={status === s} onClick={() => setStatus(s)} />
                    ))}
                  </div>
                  {err(!status) && <p className="mt-2 text-xs text-red-500">Please select an option</p>}
                </Field>

                <Field label="Proposed Availability Date" required={false}>
                  <div className="flex flex-wrap gap-6">
                    {["Immediately", "Select Date"].map((d) => (
                      <Radio
                        key={d}
                        label={d}
                        selected={availDate === d}
                        onClick={() => setAvailDate(d)}
                      />
                    ))}
                  </div>
                </Field>

                <Field label="Unit Condition" required={false}>
                  <div className="flex flex-wrap gap-3">
                    {UNIT_CONDITIONS.map((u) => (
                      <Pill
                        key={u}
                        label={u}
                        selected={unitCondition === u}
                        onClick={() => setUnitCondition(u)}
                      />
                    ))}
                  </div>
                </Field>

                <Field label="Open to Channel Partner" required={false}>
                  <div className="flex flex-wrap gap-6">
                    {["Yes", "No"].map((o) => (
                      <Radio key={o} label={o} selected={openToCp === o} onClick={() => setOpenToCp(o)} />
                    ))}
                  </div>
                </Field>
              </>
            )}

            {step === 2 && locStage === "locality" && (
              <div className="max-w-2xl space-y-2">
                <label className="text-ink block text-sm font-semibold">
                  Locality <span className="text-red-500">*</span>
                </label>
                <AddressAutocomplete
                  placeholder="Enter locality"
                  hideIcon
                  onSelect={applyPlace}
                  trailing={
                    <button
                      type="button"
                      onClick={useCurrentLocation}
                      disabled={locating}
                      className="text-accent-blue flex shrink-0 items-center gap-1.5 text-sm font-medium disabled:opacity-60"
                    >
                      {locating ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Target className="size-4" />
                      )}
                      Select current location
                    </button>
                  }
                />
                {locError && <p className="text-xs text-red-500">{locError}</p>}
              </div>
            )}

            {step === 2 && locStage === "building" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <LabelInput label="Locality" required value={f.locality} onChange={(v) => setField("locality", v)} />
                  <LabelInput label="City" required value={f.city} onChange={(v) => setField("city", v)} />
                  <LabelInput label="State" required value={f.state} onChange={(v) => setField("state", v)} />
                </div>
                <div>
                  <LabelInput label="Building/Project Name" required placeholder="Enter building name" value={f.building} onChange={(v) => setField("building", v)} />
                  <p className="text-ink-muted mt-2 flex items-center gap-1.5 text-sm">
                    <MapPin className="text-accent-blue size-4" />
                    Can&apos;t find your building?
                    <button
                      type="button"
                      onClick={() => setShowMap(true)}
                      className="text-accent-blue font-medium"
                    >
                      Fetch from Google Maps
                    </button>
                  </p>
                </div>
              </div>
            )}

            {step === 2 && locStage === "full" && (
              <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-3">
                <div className="sm:col-span-3">
                  <label className="text-ink mb-2 block text-sm font-semibold">
                    Search address (Google)
                    <span className="text-ink-muted ml-2 text-xs font-normal">
                      pick a result to auto-fill the fields below
                    </span>
                  </label>
                  <AddressAutocomplete onSelect={applyPlace} />
                </div>
                <LabelInput label="Locality" required value={f.locality} onChange={(v) => setField("locality", v)} />
                <LabelInput label="City" required value={f.city} onChange={(v) => setField("city", v)} />
                <LabelInput label="State" required value={f.state} onChange={(v) => setField("state", v)} />
                <div className="sm:col-span-2">
                  <LabelInput
                    label="Building/Project Name"
                    required
                    placeholder="Enter building name"
                    value={f.building}
                    onChange={(v) => setField("building", v)}
                  />
                </div>
                <LabelInput label="Wing/Tower" placeholder="Enter tower name" value={f.wing} onChange={(v) => setField("wing", v)} />
                <LabelInput label="Flat / Unit No." placeholder="Enter unit no." value={f.unit} onChange={(v) => setField("unit", v)} />
                <LabelInput label="Floor No." placeholder="Enter floor No." value={f.floor} onChange={(v) => setField("floor", v)} />
                <LabelInput label="Total Floors in Building" placeholder="Enter total floors" value={f.totalFloors} onChange={(v) => setField("totalFloors", v)} />
                <LabelInput label="Micromarket / Sublocality" placeholder="Enter micromarket / sublocality" value={f.micromarket} onChange={(v) => setField("micromarket", v)} />
                <LabelInput label="Year of Construction" placeholder="Enter year of construction" value={f.year} onChange={(v) => setField("year", v)} />
                <LabelInput label="Landmark" placeholder="Enter landmark" value={f.landmark} onChange={(v) => setField("landmark", v)} />
                <LabelInput label="Pincode" required value={f.pincode} onChange={(v) => setField("pincode", v)} />
                <LabelInput label="Latitude" placeholder="e.g., 18.5204" value={f.latitude} onChange={(v) => setField("latitude", v)} />
                <LabelInput label="Longitude" placeholder="e.g., 73.8567" value={f.longitude} onChange={(v) => setField("longitude", v)} />
                <div className="sm:col-span-3">
                  <label className="text-ink mb-2 block text-sm font-semibold">Full Address</label>
                  <textarea
                    rows={2}
                    value={f.fullAddress}
                    placeholder="Complete address (auto-filled from Google, or edit manually)"
                    onChange={(e) => setField("fullAddress", e.target.value)}
                    className="text-ink placeholder:text-ink-muted/60 focus:border-accent-blue/50 w-full resize-none rounded-lg border border-black/15 bg-white p-3 text-sm outline-none"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-black/15 bg-black/[0.01] px-6 py-12 text-center transition-colors hover:border-accent-blue/40">
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const picked = Array.from(e.target.files ?? []);
                      if (picked.length) setImageFiles((prev) => [...prev, ...picked]);
                      e.target.value = "";
                    }}
                  />
                  <span className="bg-accent-blue/10 text-accent-blue grid size-14 place-items-center rounded-2xl">
                    <Images className="size-7" />
                  </span>
                  <p className="text-ink mt-4 font-semibold">
                    Drag &amp; drop images here, or click to browse
                  </p>
                  <span className="border-accent-blue/40 text-accent-blue mt-4 rounded-lg border bg-white px-5 py-2 text-sm font-semibold">
                    {imageFiles.length > 0 ? "Upload More Images" : "Upload Images"}
                  </span>
                  <p className="text-ink-muted mt-4 text-xs">
                    Upload images to get better visibility for your property · Max 10MB each
                  </p>
                </label>

                {imageFiles.length > 0 && (
                  <>
                    <div className="flex flex-wrap gap-3">
                      {imagePreviews.map((src, i) => (
                        <span key={i} className="relative size-20 overflow-hidden rounded-lg ring-1 ring-black/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt={`Upload ${i + 1}`} className="size-full object-cover" />
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-black/[0.08] px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="text-ink truncate text-sm font-medium">
                          {imageFiles.length} {imageFiles.length === 1 ? "image" : "images"} selected
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <button
                          type="button"
                          aria-label="Remove uploaded images"
                          onClick={() => setImageFiles([])}
                          className="text-ink-muted hover:text-ink transition-colors"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </div>

                    <div className="border-brand-orange/25 bg-brand-orange/[0.06] relative rounded-xl border p-4">
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
                              <p className="text-ink font-semibold">
                                Create an AI Video from Your Uploaded Photos
                              </p>
                              <p className="text-ink-muted mt-0.5 text-sm">
                                Transform your photos into a stunning video tour. Listings with
                                videos get{" "}
                                <span className="text-brand-orange font-semibold">
                                  3x more engagement
                                </span>{" "}
                                and sell <span className="text-brand-orange font-semibold">faster!</span>
                              </p>
                            </div>
                            <Button
                              onClick={() => setShowCreateVideo(true)}
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
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="border-brand-orange/25 bg-brand-orange/[0.06] text-ink rounded-lg border px-4 py-3 text-sm">
                  We&apos;ve preselected the known amenities of this building. You can add more
                  amenities for both the building and the unit.
                </div>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <AmenityColumn
                    title="Building amenities"
                    groups={BUILDING_GROUPS}
                    sel={bSel}
                    setSel={setBSel}
                    counts={bCounts}
                    setCounts={setBCounts}
                    collapsibleAfter={2}
                  />
                  <AmenityColumn
                    title="Unit amenities"
                    groups={UNIT_GROUPS}
                    sel={uSel}
                    setSel={setUSel}
                    counts={uCounts}
                    setCounts={setUCounts}
                  />
                </div>
                <div>
                  <label className="text-ink mb-2 block text-sm font-semibold">
                    What your Property&apos;s Unique Story?
                  </label>
                  <textarea
                    rows={4}
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                    className="text-ink placeholder:text-ink-muted/60 focus:border-accent-blue/50 w-full rounded-xl border border-black/15 bg-white p-3.5 text-sm outline-none"
                  />
                  <p className="text-ink-muted mt-1 text-xs">Minimum 30 characters are required</p>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-5">
                <div className="border-brand-orange/25 bg-brand-orange/[0.06] flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm">
                  <ThumbsUp className="text-brand-orange size-4 shrink-0" />
                  <span className="text-ink flex-1">
                    Your listing is 99% complete. Add more visuals or highlight amenities to boost
                    visibility.
                  </span>
                  <button type="button" aria-label="Dismiss">
                    <X className="text-ink-muted size-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                  <span className="flex items-center gap-2 font-medium text-green-700">
                    <CircleCheck className="size-5" />
                    Video Attached Successfully!
                  </span>
                  <Button
                    onClick={() => setShowVideo(true)}
                    className="h-9 rounded-lg bg-green-600 px-4 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    <Play className="size-4" />
                    Preview
                  </Button>
                </div>

                <SummaryCard
                  icon={Building2}
                  title="Property Overview"
                  desc="Basic information about your property"
                >
                  <h4 className="text-ink text-lg font-bold">
                    Spacious 3BHK Apartment with Premium Amenities
                  </h4>
                  <p className="text-ink-muted mt-1 text-sm">
                    Beautiful residential property located in prime location with modern amenities
                    and excellent connectivity. Perfect for families looking for comfortable living
                    space.
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
                    <SummaryField label="Listing as">{lister ?? "Owner"}</SummaryField>
                    <SummaryField label="Project type">
                      <span className="bg-brand-orange/10 text-brand-orange rounded px-2 py-0.5">
                        {type}
                      </span>
                    </SummaryField>
                    <SummaryField label="Category">{openCat ?? "Apartments / Flats"}</SummaryField>
                    <SummaryField label="Specification">2 BHK</SummaryField>
                    <SummaryField label="Available for">
                      <span className="rounded bg-green-100 px-2 py-0.5 text-green-700">
                        {availableFor ?? "Sale"}
                      </span>
                    </SummaryField>
                    <SummaryField label="Expected Price For Sale">
                      <span className="text-base font-bold">₹1,25,00,000</span>{" "}
                      <span className="text-ink-muted text-xs font-normal">Negotiable</span>
                    </SummaryField>
                  </div>
                </SummaryCard>

                <SummaryCard
                  icon={FileText}
                  title="Property Space Details"
                  desc="Here's a summary of your property's area type, furnishing, and leasing preferences"
                >
                  <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
                    <SummaryField label="Property Area Type">{areaType ?? "Chargeable Area"}</SummaryField>
                    <SummaryField label="Available Area">12000 sq.ft</SummaryField>
                    <SummaryField label="Unit condition">{unitCondition ?? "Fully Furnished"}</SummaryField>
                    <SummaryField label="Current Status">{status ?? "Vacant"}</SummaryField>
                    <SummaryField label="Open to channel partner">{openToCp}</SummaryField>
                    <SummaryField label="Availability">{availDate}</SummaryField>
                  </div>
                </SummaryCard>

                <SummaryCard
                  icon={MapPin}
                  title="Location Details"
                  desc="Here's a summary of your property's location and building information"
                >
                  <SummaryField label="Property">
                    <span className="font-semibold">Godrej Evergreen</span> — near Megapolis Circle,
                    Phase 3, Hinjawadi Rajiv Gandhi Infotech Park, Hinjawadi, Pimpri-Chinchwad, Pune,
                    Maharashtra 411057
                  </SummaryField>
                  <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
                    <SummaryField label="Wing">Godrej Evergreen A</SummaryField>
                    <SummaryField label="Flat No.">1203</SummaryField>
                    <SummaryField label="Property on Floor">12</SummaryField>
                    <SummaryField label="Total Floors">15</SummaryField>
                    <SummaryField label="Micromarket / Sublocality">West Pune</SummaryField>
                    <SummaryField label="Year of Construction">2021</SummaryField>
                    <SummaryField label="Landmark">Metro Stations, IT Parks</SummaryField>
                    <SummaryField label="State">Maharashtra</SummaryField>
                    <SummaryField label="City">Pune</SummaryField>
                    <SummaryField label="Locality">Shivajinagar</SummaryField>
                    <SummaryField label="Pincode">411045</SummaryField>
                    <SummaryField label="Latitude">18.5599</SummaryField>
                    <SummaryField label="Longitude">73.7769</SummaryField>
                  </div>
                </SummaryCard>

                <SummaryCard
                  icon={Upload}
                  title="Upload Images"
                  desc="Photos, videos, and Documents"
                >
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-black/[0.08] px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex shrink-0 -space-x-3">
                        {VIDEO_FRAMES.slice(0, 3).map((src, i) => (
                          <span
                            key={i}
                            className="relative size-10 overflow-hidden rounded-lg ring-2 ring-white"
                          >
                            <Image src={src} alt="" fill sizes="40px" className="object-cover" />
                          </span>
                        ))}
                        <span className="relative grid size-10 place-items-center rounded-lg bg-black/70 text-xs font-semibold text-white ring-2 ring-white">
                          +2
                        </span>
                      </div>
                      <span className="text-ink text-sm font-medium">5 images uploaded</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <button
                        type="button"
                        className="text-accent-blue inline-flex items-center gap-1 text-sm font-medium"
                      >
                        <Eye className="size-4" />
                        View
                      </button>
                      <span className="text-ink-muted text-sm">150 MB</span>
                    </div>
                  </div>
                </SummaryCard>

                <SummaryCard
                  icon={Sparkles}
                  title="Amenities & Facilities"
                  desc="Available features and conveniences"
                >
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <ReviewAmenityColumn
                      title="Building amenities"
                      groups={BUILDING_GROUPS}
                      counts={bCounts}
                    />
                    <ReviewAmenityColumn
                      title="Unit amenities"
                      groups={UNIT_GROUPS}
                      counts={uCounts}
                    />
                  </div>
                  <div className="mt-5">
                    <p className="text-ink-muted text-sm">Property Unique Story</p>
                    <p className="text-ink mt-1.5 text-sm leading-relaxed">{story}</p>
                  </div>
                </SummaryCard>

                <div className="border-brand-orange/25 bg-brand-orange/[0.06] flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm">
                  <ThumbsUp className="text-brand-orange size-4 shrink-0" />
                  <span className="text-ink flex-1">
                    Almost done! Submit now to list your property and reach potential buyers.
                  </span>
                  <button type="button" aria-label="Dismiss">
                    <X className="text-ink-muted size-4" />
                  </button>
                </div>

                <label className="flex items-center gap-2 pt-1 text-sm">
                  <input type="checkbox" defaultChecked className="size-4 accent-[#2f6bed]" />
                  <span className="text-ink">Also list this property on TryThat.ai &amp; Alon</span>
                </label>
              </div>
            )}

            {/* Footer */}
            {submitError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{submitError}</p>
            )}
            {showErrors && missing.length > 0 && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                Please fill the required field{missing.length > 1 ? "s" : ""}: {missing.join(", ")}
              </p>
            )}
            <div className="flex items-center justify-between pt-2">
              {step > 0 ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowErrors(false);
                    setStep((s) => s - 1);
                  }}
                  disabled={submitting}
                  className="text-ink h-11 rounded-lg border-black/15 px-5 text-sm font-medium"
                >
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
              ) : (
                <span />
              )}
              <Button
                disabled={submitting}
                onClick={() => {
                  if (step >= 5) {
                    listProperty();
                    return;
                  }
                  // Block advancing until the step's required (*) fields are filled.
                  if (missing.length > 0) {
                    setShowErrors(true);
                    return;
                  }
                  setShowErrors(false);
                  void autosaveDraft();
                  // Leaving the Upload step → kick off AI video generation in the rail.
                  if (step === 3 && imageFiles.length > 0) void runVideoGeneration();
                  setStep((s) => Math.min(s + 1, 5));
                }}
                className={cn(
                  "h-11 rounded-lg px-4 sm:px-6 lg:px-8 text-sm font-semibold",
                  missing.length > 0
                    ? "bg-[#34528c]/60 text-white"
                    : "bg-[#34528c] text-white hover:bg-[#34528c]/90"
                )}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Listing…
                  </>
                ) : (
                  continueLabel
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
