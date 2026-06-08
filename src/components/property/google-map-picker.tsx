"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  Search,
  Share2,
  Smartphone,
  Star,
  TriangleAlert,
  X,
} from "lucide-react";
import type { PlaceDetails } from "@/lib/api";

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

/* Load the Google Maps JS API once, lazily. */
let mapsPromise: Promise<void> | null = null;
function loadMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).google?.maps) return Promise.resolve();
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${KEY}&libraries=places`;
    s.async = true;
    s.defer = true;
    s.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = (window as any).google;
      if (g?.maps?.Map) return resolve();
      // Fall back to importLibrary if classic globals aren't ready yet.
      if (g?.maps?.importLibrary) {
        Promise.all([g.maps.importLibrary("maps"), g.maps.importLibrary("places")])
          .then(() => resolve())
          .catch(reject);
      } else {
        resolve();
      }
    };
    s.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(s);
  });
  return mapsPromise;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function comp(components: any[], ...types: string[]): string {
  for (const c of components || []) {
    if (types.some((t) => (c.types || []).includes(t))) return c.long_name || "";
  }
  return "";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDetails(p: any): PlaceDetails {
  const comps = p.address_components || [];
  const loc = p.geometry?.location;
  return {
    name: p.name || "",
    formatted_address: p.formatted_address || "",
    locality: comp(comps, "sublocality_level_1", "sublocality", "neighborhood", "route"),
    city: comp(comps, "locality", "administrative_area_level_3", "administrative_area_level_2"),
    state: comp(comps, "administrative_area_level_1"),
    pincode: comp(comps, "postal_code"),
    country: comp(comps, "country"),
    latitude: loc ? loc.lat() : null,
    longitude: loc ? loc.lng() : null,
  };
}

interface Selected {
  name: string;
  rating?: number;
  total?: number;
  address: string;
  photo?: string;
  type?: string;
  details: PlaceDetails;
}

const CHIPS = ["Restaurants", "Hotels", "Things to do", "Transit", "Parking", "Pharmacies", "ATMs"];

export function GoogleMapPicker({
  initialQuery,
  onUse,
  onClose,
}: {
  initialQuery?: string;
  onUse: (d: PlaceDetails) => void;
  onClose: () => void;
}) {
  const mapEl = useRef<HTMLDivElement>(null);
  const inputEl = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const geocoderRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sel, setSel] = useState<Selected | null>(null);

  useEffect(() => {
    let off = false;
    if (!KEY) {
      setError("Google Maps key is not configured.");
      return;
    }
    loadMaps()
      .then(() => {
        if (off || !mapEl.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const g = (window as any).google;
        const center = { lat: 18.5913, lng: 73.7389 }; // Hinjewadi, Pune
        const map = new g.maps.Map(mapEl.current, {
          center,
          zoom: 14,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: true,
        });
        mapRef.current = map;
        markerRef.current = new g.maps.Marker({ map, position: center });
        geocoderRef.current = new g.maps.Geocoder();

        const ac = new g.maps.places.Autocomplete(inputEl.current, {
          fields: [
            "address_components",
            "geometry",
            "formatted_address",
            "name",
            "rating",
            "user_ratings_total",
            "photos",
            "types",
          ],
          componentRestrictions: { country: "in" },
        });
        ac.bindTo("bounds", map);
        ac.addListener("place_changed", () => {
          const p = ac.getPlace();
          if (!p.geometry) return;
          map.panTo(p.geometry.location);
          map.setZoom(16);
          markerRef.current.setPosition(p.geometry.location);
          setSel({
            name: p.name || p.formatted_address || "Selected location",
            rating: p.rating,
            total: p.user_ratings_total,
            address: p.formatted_address || "",
            photo: p.photos?.[0]?.getUrl({ maxWidth: 480, maxHeight: 280 }),
            type: (p.types?.[0] || "").replace(/_/g, " "),
            details: toDetails(p),
          });
        });

        // Clicking anywhere on the map reverse-geocodes that point.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        map.addListener("click", (e: any) => {
          markerRef.current.setPosition(e.latLng);
          geocoderRef.current.geocode(
            { location: e.latLng },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (results: any[], status: string) => {
              if (status === "OK" && results[0]) {
                const r = results[0];
                setSel({
                  name: r.formatted_address?.split(",")[0] || "Dropped pin",
                  address: r.formatted_address || "",
                  details: toDetails(r),
                });
              }
            }
          );
        });

        setReady(true);
        if (initialQuery && inputEl.current) inputEl.current.value = initialQuery;
      })
      .catch((e) => !off && setError(e.message || "Failed to load Google Maps"));
    return () => {
      off = true;
    };
  }, [initialQuery]);

  return (
    <div className="fixed inset-x-0 bottom-0 top-16 z-50 flex flex-col bg-white sm:flex-row lg:top-20">
      {/* Left place panel */}
      <div className="flex max-h-[46%] w-full shrink-0 flex-col border-b border-black/10 sm:max-h-none sm:w-[360px] sm:border-r sm:border-b-0">
        {/* Search */}
        <div className="relative p-3">
          <Search className="text-ink-muted pointer-events-none absolute top-1/2 left-6 size-4 -translate-y-1/2" />
          <input
            ref={inputEl}
            placeholder="Search building, project or address"
            className="text-ink placeholder:text-ink-muted/60 focus:border-accent-blue/50 h-11 w-full rounded-lg border border-black/15 bg-white pr-9 pl-9 text-sm shadow-sm outline-none"
          />
          <button
            aria-label="Close map"
            onClick={onClose}
            className="text-ink-muted hover:text-ink absolute top-1/2 right-6 -translate-y-1/2"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {sel ? (
            <div>
              {sel.photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sel.photo} alt={sel.name} className="h-44 w-full object-cover" />
              )}
              <div className="p-4">
                <h2 className="text-ink text-xl font-bold">{sel.name}</h2>
                {sel.type && <p className="text-ink-muted text-sm capitalize">{sel.type}</p>}
                {sel.rating != null && (
                  <div className="mt-1 flex items-center gap-1.5 text-sm">
                    <span className="text-ink font-medium">{sel.rating}</span>
                    <span className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={
                            i < Math.round(sel.rating!) ? "size-3.5 fill-amber-400 text-amber-400" : "size-3.5 text-black/20"
                          }
                        />
                      ))}
                    </span>
                    {sel.total != null && <span className="text-ink-muted">({sel.total})</span>}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between text-center">
                  {[
                    { icon: Navigation, label: "Directions" },
                    { icon: Bookmark, label: "Save" },
                    { icon: MapPin, label: "Nearby" },
                    { icon: Smartphone, label: "Send" },
                    { icon: Share2, label: "Share" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex flex-1 flex-col items-center gap-1">
                      <span className="bg-accent-blue/10 text-accent-blue grid size-9 place-items-center rounded-full">
                        <Icon className="size-4" />
                      </span>
                      <span className="text-ink-muted text-[11px]">{label}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-3 border-t border-black/[0.07] pt-4 text-sm">
                  <p className="text-ink flex items-start gap-2.5">
                    <MapPin className="text-ink-muted mt-0.5 size-4 shrink-0" />
                    {sel.address}
                  </p>
                  {sel.details.pincode && (
                    <p className="text-ink-muted flex items-center gap-2.5">
                      <Phone className="size-4 shrink-0" />
                      Pincode {sel.details.pincode}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <span className="bg-accent-blue/10 text-accent-blue grid size-12 place-items-center rounded-full">
                <Search className="size-5" />
              </span>
              <p className="text-ink font-semibold">Find your building</p>
              <p className="text-ink-muted text-sm">
                Search above or tap anywhere on the map to drop a pin, then use that location.
              </p>
            </div>
          )}
        </div>

        {/* Use this Location */}
        <div className="border-t border-black/10 p-3">
          <button
            disabled={!sel}
            onClick={() => sel && onUse(sel.details)}
            className="bg-accent-blue flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
          >
            <MapPin className="size-4" /> Use this Location
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="relative min-w-0 flex-1">
        {/* category chips (decorative, like Google Maps) */}
        <div className="pointer-events-none absolute top-3 left-3 z-10 flex max-w-[calc(100%-1.5rem)] gap-2 overflow-hidden">
          {CHIPS.map((c) => (
            <span
              key={c}
              className="text-ink shrink-0 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-medium shadow-sm"
            >
              {c}
            </span>
          ))}
        </div>

        <div ref={mapEl} className="size-full" />

        {!ready && !error && (
          <div className="absolute inset-0 grid place-items-center bg-black/[0.03]">
            <Loader2 className="text-accent-blue size-7 animate-spin" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 grid place-items-center p-8">
            <div className="flex max-w-sm flex-col items-center gap-2 text-center">
              <TriangleAlert className="size-8 text-red-500" />
              <p className="text-ink font-semibold">Couldn&apos;t load Google Maps</p>
              <p className="text-ink-muted text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
