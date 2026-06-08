import type { ListingItem } from "@/lib/api";
import type { Property } from "@/lib/properties";

/** Placeholder shown for listings with no uploaded image (allowed host in next.config). */
export const FALLBACK_PROPERTY_IMAGE =
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80";

/** Map a backend ListingItem (very wide schema) to the UI Property shape. */
export function listingToProperty(item: ListingItem): Property {
  const avail = (item.property_available_for ?? "").toLowerCase();
  const isRent =
    avail.includes("rent") || (item.rent_rate != null && item.sale_rate == null);

  // Card location reads "Locality, City" (state omitted to match the design).
  const location =
    [item.locality, item.city].filter(Boolean).join(", ") || item.state || "—";
  const areaNum = item.chargeable_area ?? item.area_sqft ?? null;
  const priceVal = item.price ?? (isRent ? item.rent_rate : item.sale_rate);

  return {
    id: item.id,
    title: item.property_title || "Untitled property",
    location,
    price: priceVal != null && priceVal !== "" ? String(priceVal) : "—",
    perMonth: isRent,
    listingType: isRent ? "rent" : "sale",
    bhk: item.bedrooms != null ? `${item.bedrooms} BHK` : "—",
    area: areaNum != null ? `${areaNum} sq.ft` : "—",
    image: item.images?.[0]?.preview_url || FALLBACK_PROPERTY_IMAGE,
    status: (item.videos?.length ?? 0) > 0 ? "ready" : "idle",
    videoUrl: item.videos?.[0]?.preview_url ?? undefined,
  };
}
