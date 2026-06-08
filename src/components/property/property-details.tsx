"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BedDouble,
  Building2,
  Calendar,
  Car,
  ChevronDown,
  Dumbbell,
  Flame,
  Layers,
  Loader2,
  MapPin,
  Maximize2,
  PawPrint,
  Pencil,
  Play,
  Plug,
  ShieldCheck,
  Sparkles,
  Sprout,
  Sun,
  Tag,
  TriangleAlert,
  Waves,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api, ApiError, type ListingItem } from "@/lib/api";
import { SparkleIcon } from "@/components/content/brand-glyphs";

/** Format an INR amount into "X Lakh" / "Y Cr". */
function inr(n: number): string {
  if (n >= 1e7) return (n / 1e7).toFixed(2).replace(/\.?0+$/, "") + " Cr";
  if (n >= 1e5) return (n / 1e5).toFixed(2).replace(/\.?0+$/, "") + " Lakh";
  return n.toLocaleString("en-IN");
}

// Boolean amenity columns on the listing → label + icon. Only truthy ones show.
const AMENITIES: { key: string; label: string; icon: typeof Car }[] = [
  { key: "car_parking", label: "Car Parking", icon: Car },
  { key: "natural_lighting", label: "Natural Lighting", icon: Sun },
  { key: "play_ground", label: "Playground", icon: Sprout },
  { key: "pet_friendly", label: "Pet Friendly", icon: PawPrint },
  { key: "spa", label: "Spa", icon: Sparkles },
  { key: "swimming_pool", label: "Swimming Pool", icon: Waves },
  { key: "gym", label: "Gym", icon: Dumbbell },
  { key: "garden", label: "Garden", icon: Sprout },
  { key: "club_house", label: "Club House", icon: Building2 },
  { key: "lift", label: "Lift", icon: Layers },
  { key: "power_backup", label: "Power Backup", icon: Plug },
  { key: "security", label: "Security", icon: ShieldCheck },
  { key: "wifi_connectivity", label: "Wi-Fi", icon: Wifi },
  { key: "gas_pipeline", label: "Gas Pipeline", icon: Flame },
];

export function PropertyDetails() {
  const router = useRouter();
  const id = useSearchParams().get("id");
  const [g, setG] = useState<ListingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("No property selected.");
      setLoading(false);
      return;
    }
    let off = false;
    setLoading(true);
    api.listings
      .get(id)
      .then((res) => !off && setG(res))
      .catch((e) => !off && setError(e instanceof ApiError ? e.message : "Failed to load property"))
      .finally(() => !off && setLoading(false));
    return () => {
      off = true;
    };
  }, [id]);

  // Helpers over the wide, loosely-typed listing row.
  const str = (k: string): string => {
    const v = g?.[k];
    return v == null || v === "" ? "" : String(v);
  };
  const truthy = (k: string): boolean => {
    const v = g?.[k];
    if (typeof v === "number") return v > 0;
    return v === true || v === "1" || v === "true" || v === "Yes";
  };

  const images = useMemo(
    () => (g?.images ?? []).map((m) => m.preview_url).filter((u): u is string => !!u),
    [g]
  );
  const hasVideo = (g?.videos ?? []).length > 0;

  const isRent = (g?.property_available_for ?? "").toLowerCase().includes("rent");
  const priceVal = Number(
    g?.rent_value ?? g?.rent_rate ?? g?.sale_value ?? g?.sale_rate ?? 0
  );
  const priceLabel = priceVal > 0 ? inr(priceVal) : g?.price || "—";
  const deposit = Number(g?.deposit ?? 0);
  const config =
    g?.bedrooms != null ? `${g.bedrooms}BHK` : str("unit_type_preference") || str("category");
  const area = str("chargeable_area") || str("area_sqft") || str("carpet_area");

  if (loading) {
    return (
      <div className="grid h-full place-items-center">
        <Loader2 className="text-accent-blue size-7 animate-spin" />
      </div>
    );
  }
  if (error || !g) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-4 sm:px-6 lg:px-8 text-center">
        <TriangleAlert className="size-8 text-red-500" />
        <p className="text-ink font-semibold">Couldn&apos;t load this property</p>
        <p className="text-ink-muted text-sm">{error}</p>
        <Button
          nativeButton={false}
          render={<Link href="/" />}
          className="bg-brand-blue hover:bg-brand-blue-hover mt-1 h-10 rounded-lg px-4 text-sm font-semibold text-white"
        >
          Back to my properties
        </Button>
      </div>
    );
  }

  const amenities = AMENITIES.filter((a) => truthy(a.key));
  const description = g.description || "No description provided for this property.";

  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
      {/* Top actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => router.push("/")}
          className="text-accent-blue flex items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft className="size-4" /> Back to my properties
        </button>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <Button
            variant="outline"
            onClick={() => id && router.push(`/add-property/manual?edit=${id}`)}
            className="text-ink h-10 w-full rounded-lg border-black/15 px-4 text-sm font-medium sm:w-auto"
          >
            <Pencil className="size-4" /> Edit Property
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/create-video" />}
            className="bg-brand-blue hover:bg-brand-blue-hover h-10 w-full rounded-lg px-4 text-sm font-semibold text-white sm:w-auto"
          >
            <SparkleIcon className="size-4" /> Create Video & Content
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1.7fr_1fr]">
        {/* LEFT */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-brand-blue text-2xl font-bold">{g.property_title || "Untitled Property"}</h1>
            <span className="bg-brand-orange/10 text-brand-orange rounded-full px-3 py-1 text-xs font-semibold">
              {isRent ? "For Rent" : "For Sale"}
            </span>
          </div>
          <p className="text-ink-muted mt-1 flex items-center gap-1.5 text-sm">
            <MapPin className="size-4" />
            {[str("locality"), str("city")].filter(Boolean).join(", ") || "Location not set"}
          </p>

          {/* Price */}
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-black/[0.03] px-5 py-4">
            <p className="text-ink text-2xl font-bold">
              ₹{priceLabel}
              {isRent && <span className="text-ink-muted ml-1 text-sm font-normal">/month</span>}
            </p>
            <span className="rounded-full border border-black/15 px-3 py-1 text-xs font-medium text-ink-muted">
              Negotiable
            </span>
            {deposit > 0 && (
              <p className="text-sm">
                <span className="text-brand-orange font-medium">Deposit Amount:</span>{" "}
                <span className="text-ink font-semibold">₹{inr(deposit)}</span>
              </p>
            )}
          </div>

          {/* Description */}
          <p className="text-ink-muted mt-4 text-sm leading-relaxed">
            {expanded || description.length <= 220 ? description : description.slice(0, 220) + "…"}
          </p>
          {description.length > 220 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-accent-blue mt-1 flex items-center gap-1 text-sm font-medium"
            >
              {expanded ? "View Less" : "View More"}
              <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
            </button>
          )}

          {/* Gallery */}
          <div className="mt-5">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-black/[0.04]">
              {images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={images[active]} alt={g.property_title ?? "Property"} className="size-full object-cover" />
              ) : (
                <div className="from-accent-blue/10 to-brand-orange/10 grid size-full place-items-center bg-gradient-to-br">
                  <Building2 className="text-ink-muted size-10" />
                </div>
              )}
              {images.length > 1 && (
                <span className="absolute right-3 bottom-3 rounded-md bg-black/55 px-2 py-1 text-xs font-medium text-white">
                  {active + 1}/{images.length}
                </span>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={cn(
                      "size-16 shrink-0 overflow-hidden rounded-xl ring-2 transition",
                      i === active ? "ring-brand-blue" : "ring-transparent hover:ring-black/15"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`View ${i + 1}`} className="size-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Video banner */}
          {hasVideo && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-brand-green text-white">
                  <Play className="size-4 fill-white" />
                </span>
                <div>
                  <p className="text-brand-green font-semibold">Video Generated!</p>
                  <p className="text-ink-muted text-xs">Video ready to preview</p>
                </div>
              </div>
              <Button
                nativeButton={false}
                render={<a href={g.videos[0].preview_url ?? "#"} target="_blank" rel="noreferrer" />}
                className="bg-brand-green hover:bg-brand-green-hover h-10 rounded-lg px-4 text-sm font-semibold text-white"
              >
                <Play className="size-4 fill-white" /> Preview &amp; Attach Video
              </Button>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="space-y-5">
          {/* Overview */}
          <section className="rounded-2xl border border-black/[0.08] bg-white p-5">
            <h2 className="text-ink text-lg font-bold">Overview</h2>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
              <Fact icon={Building2} label="Property Type" value={str("property_type")} />
              <Fact icon={Tag} label="Category" value={str("category")} />
              <Fact icon={BedDouble} label="Configuration" value={config} />
              <Fact icon={Tag} label="Available For" value={str("property_available_for")} />
              <Fact icon={Maximize2} label="Chargeable Area sq.ft" value={area} />
              <Fact icon={Building2} label="Unit Status" value={str("unit_status")} />
              <Fact icon={BedDouble} label="Unit Condition" value={str("unit_condition") || str("furnishing_type")} />
              <Fact icon={Calendar} label="Proposed Availability Date" value={str("space_proposed_date") || "Immediately"} />
            </div>
          </section>

          {/* Amenities */}
          <section className="rounded-2xl border border-black/[0.08] bg-white p-5">
            <h2 className="text-ink text-lg font-bold">Amenities</h2>
            {amenities.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
                {amenities.map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <Icon className="text-accent-blue size-4 shrink-0" />
                    <span className="text-ink">{label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-ink-muted mt-3 text-sm">No amenities listed.</p>
            )}
          </section>

          {/* Address */}
          <section className="rounded-2xl border border-black/[0.08] bg-white p-5">
            <h2 className="text-ink text-lg font-bold">Address Details</h2>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <Fact label="State" value={str("state")} />
              <Fact label="City" value={str("city")} />
              <Fact label="Locality" value={str("locality")} />
            </div>
            <p className="text-ink-muted mt-4 text-xs">Address</p>
            <p className="text-ink mt-1 text-sm">
              {str("address") ||
                [str("building_name"), str("locality"), str("city"), str("state"), str("pincode")]
                  .filter(Boolean)
                  .join(", ") ||
                "Not provided"}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon?: typeof Car;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      {Icon && <Icon className="text-ink-muted mt-0.5 size-4 shrink-0" />}
      <div className="min-w-0">
        <p className="text-ink-muted text-xs">{label}</p>
        <p className="text-ink mt-0.5 text-sm font-medium break-words">{value || "—"}</p>
      </div>
    </div>
  );
}
