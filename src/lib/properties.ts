export type ListingType = "rent" | "sale";

/** Video generation lifecycle for a property's marketing content. */
export type VideoStatus = "idle" | "processing" | "ready";

export interface Property {
  id: string;
  title: string;
  location: string;
  /** Display amount without the ₹ symbol, e.g. "1.25 Lakh" or "1.2 Cr". */
  price: string;
  /** When true, render the "/month" suffix (rentals). */
  perMonth: boolean;
  listingType: ListingType;
  bhk: string;
  area: string;
  image: string;
  status: VideoStatus;
  /** 0–100, present only while status === "processing". */
  progress?: number;
  /** Generated marketing video, if one exists. */
  videoUrl?: string;
}

const TITLES = [
  "Premium 3BHK in Raheja Vistas, NIBM",
  "Premium 4BHK Residence with Skyline Views and Premium Amenities",
  "Contemporary 3BHK Flat with Premium Lifestyle Amenities",
  "Luxurious 3BHK Apartment with Modern Amenities",
  "Spacious 2BHK Home in Green Acres, Wakad",
  "Elegant 4BHK Villa with Private Garden and Pool",
];

const IMAGES = [
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
];

const STATUS_CYCLE: VideoStatus[] = [
  "idle",
  "ready",
  "processing",
  "processing",
  "idle",
  "idle",
];

/** Set to 25 to populate the grid demo; 0 shows the empty "Add your first property" state. */
const SEED_COUNT = 0;

/** 25 properties → 13 For Rent / 12 For Sale to match the Figma tab counts. */
export const properties: Property[] = Array.from({ length: SEED_COUNT }, (_, i) => {
  const isSale = i % 2 === 1;
  const status = STATUS_CYCLE[i % STATUS_CYCLE.length];
  return {
    id: `prop-${i + 1}`,
    title: TITLES[i % TITLES.length],
    location: "Hinjewadi, Pune",
    price: isSale ? "1.2 Cr" : "1.25 Lakh",
    perMonth: !isSale,
    listingType: isSale ? "sale" : "rent",
    bhk: "3 BHK",
    area: "1450 sq.ft",
    image: IMAGES[i % IMAGES.length],
    status,
    progress: status === "processing" ? 45 : undefined,
  } satisfies Property;
});

export const propertyCounts = {
  all: properties.length,
  sale: properties.filter((p) => p.listingType === "sale").length,
  rent: properties.filter((p) => p.listingType === "rent").length,
};
