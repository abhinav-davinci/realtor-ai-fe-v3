/**
 * Frontend-only mock layer — lets designers run every module without a backend.
 *
 * Enabled by NEXT_PUBLIC_MOCK=1 (see .env.local). When ON:
 *   - auth is bypassed (middleware + AuthGate) and a fake session is seeded
 *   - all client (api.ts) and server (server-api.ts) READS return sample data
 *   - mutations (create/update/etc.) resolve to benign success responses
 *
 * When OFF (flag unset), every export below is inert and the app talks to the
 * real backend exactly as before. This is dev/design tooling only.
 */
import type {
  ListingItem,
  ListingMedia,
  ListListingsResponse,
  VideoStatusResponse,
  UnifiedStats,
  CloseInStats,
  ShowUpStats,
  NotificationItem,
} from "@/lib/api";

export const MOCK_ENABLED =
  process.env.NEXT_PUBLIC_MOCK === "1" || process.env.NEXT_PUBLIC_MOCK === "true";

/** Fake session used everywhere a token/org is needed while mocking. */
export const MOCK_SESSION = {
  token: "mock-token",
  orgId: "mock-org",
  orgName: "Skyline Realty",
  role: "admin",
};

/* ------------------------------- media pools ------------------------------ */

const PROPERTY_IMAGES = [
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
];

const SAMPLE_VIDEO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";

const img = (url: string): ListingMedia => ({
  s3_key: url,
  original_filename: "photo.jpg",
  content_type: "image/jpeg",
  uploaded_at: "2026-05-01T10:00:00Z",
  preview_url: url,
});

const video = (url: string): ListingMedia => ({
  s3_key: url,
  original_filename: "tour.mp4",
  content_type: "video/mp4",
  uploaded_at: "2026-05-10T10:00:00Z",
  preview_url: url,
});

/* -------------------------------- listings -------------------------------- */

function mkListing(o: Partial<ListingItem> & { id: string }): ListingItem {
  return {
    property_title: null,
    description: null,
    property_type: "Apartment",
    category: "Residential",
    price: null,
    rent_rate: null,
    sale_rate: null,
    area_sqft: null,
    chargeable_area: null,
    bedrooms: null,
    bathrooms: null,
    city: "Pune",
    state: "Maharashtra",
    locality: null,
    building_name: null,
    property_available_for: null,
    listing_status: "active",
    images: [],
    videos: [],
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-20T10:00:00Z",
    ...o,
  };
}

interface Raw {
  title: string;
  locality: string;
  bhk: number;
  bath: number;
  area: number;
  kind: "Rent" | "Sale";
  price: string;
  img: number;
  hasVideo?: boolean;
  status?: ListingItem["listing_status"];
}

const RAW: Raw[] = [
  { title: "Premium 3BHK in Raheja Vistas", locality: "NIBM", bhk: 3, bath: 3, area: 1450, kind: "Rent", price: "45,000", img: 0, hasVideo: true },
  { title: "Skyline Residence — 4BHK with City Views", locality: "Baner", bhk: 4, bath: 4, area: 2350, kind: "Sale", price: "2.4 Cr", img: 1, hasVideo: true },
  { title: "Green Acres 3BHK Garden Apartment", locality: "Wakad", bhk: 3, bath: 2, area: 1320, kind: "Rent", price: "38,000", img: 2 },
  { title: "Sunrise Heights 2BHK Starter Home", locality: "Hinjewadi", bhk: 2, bath: 2, area: 980, kind: "Rent", price: "28,000", img: 3 },
  { title: "Luxury 4BHK Villa with Private Garden", locality: "Koregaon Park", bhk: 4, bath: 5, area: 3600, kind: "Sale", price: "5.5 Cr", img: 4, hasVideo: true },
  { title: "Palm Grove 3BHK Premium Flat", locality: "Kharadi", bhk: 3, bath: 3, area: 1580, kind: "Sale", price: "1.95 Cr", img: 5 },
  { title: "Lake View 2BHK with Balcony", locality: "Viman Nagar", bhk: 2, bath: 2, area: 1100, kind: "Rent", price: "32,000", img: 6, hasVideo: true },
  { title: "Orchid Square 3BHK Modern Home", locality: "Magarpatta", bhk: 3, bath: 3, area: 1490, kind: "Sale", price: "1.65 Cr", img: 7 },
  { title: "Compact 1BHK Studio Apartment", locality: "Hadapsar", bhk: 1, bath: 1, area: 560, kind: "Rent", price: "18,000", img: 0, status: "draft" },
  { title: "Boat Club Penthouse — 5BHK Sky Home", locality: "Boat Club Road", bhk: 5, bath: 6, area: 5200, kind: "Sale", price: "8.2 Cr", img: 1, hasVideo: true },
  { title: "Maple Woods 3BHK Furnished Flat", locality: "Aundh", bhk: 3, bath: 3, area: 1610, kind: "Rent", price: "52,000", img: 2 },
  { title: "Riverside 2BHK Value Home", locality: "Mundhwa", bhk: 2, bath: 2, area: 1040, kind: "Sale", price: "95 Lakh", img: 3, status: "sold" },
];

export const MOCK_LISTINGS: ListingItem[] = RAW.map((r, i) =>
  mkListing({
    id: `listing-${i + 1}`,
    property_title: r.title,
    description:
      `A well-appointed ${r.bhk}BHK ${r.kind === "Rent" ? "rental" : "property"} in ${r.locality}, Pune — ` +
      `${r.area} sq.ft of thoughtfully designed living space with modern amenities, ample natural light, and excellent connectivity.`,
    bedrooms: r.bhk,
    bathrooms: r.bath,
    area_sqft: r.area,
    chargeable_area: r.area,
    locality: r.locality,
    building_name: r.title.split("—")[0].trim(),
    property_available_for: r.kind,
    price: r.price,
    rent_rate: r.kind === "Rent" ? 1 : null,
    sale_rate: r.kind === "Sale" ? 1 : null,
    listing_status: r.status ?? "active",
    images: [img(PROPERTY_IMAGES[r.img]), img(PROPERTY_IMAGES[(r.img + 4) % PROPERTY_IMAGES.length])],
    videos: r.hasVideo ? [video(SAMPLE_VIDEO)] : [],
    created_at: `2026-0${(i % 5) + 1}-1${i % 9}T09:30:00Z`,
    updated_at: "2026-05-28T14:00:00Z",
  })
);

function listingsResponse(): ListListingsResponse {
  return { success: true, items: MOCK_LISTINGS, total: MOCK_LISTINGS.length, page: 1, limit: 100 };
}

/* ----------------------------- video generations -------------------------- */

const genImages = (idxs: number[]) =>
  idxs.map((n) => ({
    s3_key: PROPERTY_IMAGES[n],
    original_filename: "frame.jpg",
    content_type: "image/jpeg",
    uploaded_at: "2026-05-12T10:00:00Z",
  }));

export const MOCK_VIDEOS: VideoStatusResponse[] = [
  { id: "gen-1", name: "Raheja Vistas Walkthrough", status: "completed", progress: 100, video_url: SAMPLE_VIDEO, error_message: null, images: genImages([0, 4]), created_at: "2026-05-28T11:00:00Z", updated_at: "2026-05-28T11:08:00Z" },
  { id: "gen-2", name: "Skyline Residence Tour", status: "completed", progress: 100, video_url: SAMPLE_VIDEO, error_message: null, images: genImages([1, 5]), created_at: "2026-05-26T16:20:00Z", updated_at: "2026-05-26T16:31:00Z" },
  { id: "gen-3", name: "Green Acres Promo Reel", status: "processing", progress: 62, video_url: null, error_message: null, images: genImages([2, 6]), created_at: "2026-06-06T03:50:00Z", updated_at: "2026-06-06T03:55:00Z" },
  { id: "gen-4", name: "Lake View Highlight", status: "completed", progress: 100, video_url: SAMPLE_VIDEO, error_message: null, images: genImages([6, 3]), created_at: "2026-05-21T09:00:00Z", updated_at: "2026-05-21T09:10:00Z" },
  { id: "gen-5", name: "Penthouse Showcase", status: "pending", progress: 8, video_url: null, error_message: null, images: genImages([1]), created_at: "2026-06-06T04:10:00Z", updated_at: "2026-06-06T04:10:00Z" },
  { id: "gen-6", name: "Wakad Flat Teaser", status: "failed", progress: 0, video_url: null, error_message: "Render timed out — please retry.", images: genImages([2]), created_at: "2026-05-19T18:00:00Z", updated_at: "2026-05-19T18:04:00Z" },
];

/* -------------------------------- dashboard ------------------------------- */

const MOCK_UNIFIED: UnifiedStats = { total_leads: 248, total_properties: 12, conversion_rate: 18.5, revenue_pipeline: "₹42.6 Cr", period: "7d" };
const MOCK_CLOSE_IN: CloseInStats = { total_enquiries: 134, hot_leads: 28, qualification_rate: 42.0, site_visits: 19, period: "7d" };
const MOCK_SHOW_UP: ShowUpStats = { properties: 12, total_views: 8640, engagement_rate: 6.4, pending_follow_ups: 11, period: "7d" };

/* ------------------------------ notifications ----------------------------- */

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: "n1", type: "lead", title: "New enquiry on Raheja Vistas 3BHK", body: "Aarti Sharma requested a callback for the NIBM listing.", metadata: {}, is_read: false, created_at: "2026-06-06T03:40:00Z" },
  { id: "n2", type: "video", title: "Your video is ready", body: "Skyline Residence Tour finished rendering and is ready to publish.", metadata: {}, is_read: false, created_at: "2026-05-26T16:31:00Z" },
  { id: "n3", type: "publish", title: "Reel published to Instagram", body: "Lake View Highlight went live on @skylinerealty.", metadata: {}, is_read: false, created_at: "2026-05-25T12:05:00Z" },
  { id: "n4", type: "lead", title: "Site visit scheduled", body: "Rohan Mehta booked a visit for the Koregaon Park villa on Sat 4 PM.", metadata: {}, is_read: true, created_at: "2026-05-24T10:15:00Z" },
  { id: "n5", type: "system", title: "POC period reminder", body: "42 days left in your trial. Upgrade to keep your content live.", metadata: {}, is_read: true, created_at: "2026-05-20T08:00:00Z" },
];
const UNREAD = MOCK_NOTIFICATIONS.filter((n) => !n.is_read).length;

/* -------------------------------- channels -------------------------------- */

const MOCK_CHANNELS = [
  { platform: "facebook", connected: true, account_name: "Skyline Realty Page" },
  { platform: "instagram", connected: false },
];

/* --------------------------------- places --------------------------------- */

const MOCK_PLACES = [
  { description: "Baner, Pune, Maharashtra, India", place_id: "place-baner" },
  { description: "Kharadi, Pune, Maharashtra, India", place_id: "place-kharadi" },
  { description: "Hinjewadi Phase 1, Pune, Maharashtra, India", place_id: "place-hinjewadi" },
];
const MOCK_PLACE_DETAILS = {
  name: "Baner",
  formatted_address: "Baner, Pune, Maharashtra 411045, India",
  locality: "Baner",
  city: "Pune",
  state: "Maharashtra",
  pincode: "411045",
  country: "India",
  latitude: 18.5590,
  longitude: 73.7868,
};

/* ------------------------------ the resolver ------------------------------ */

/**
 * Map a backend path + method to mock data. Returns the response shape for the
 * matched endpoint, or a generic `{ success: true }` for anything unmatched so
 * no flow ever hits the (absent) network. Reads are modelled accurately;
 * mutations are best-effort.
 */
export function resolveMock(rawPath: string, method = "GET", body?: unknown): unknown {
  const path = rawPath.split("?")[0];
  // Strip the org prefix so we can match on the stable suffix.
  const rel = path.replace(/^\/api\/v1\/orgs\/[^/]+/, "");

  // ---- auth (used only if you turn the bypass off but keep mock on) ----
  if (path === "/api/v1/auth/login") {
    return { access_token: MOCK_SESSION.token, token_type: "bearer", org_id: MOCK_SESSION.orgId, org_name: MOCK_SESSION.orgName, role: MOCK_SESSION.role };
  }
  if (path === "/api/v1/auth/register") {
    return { id: MOCK_SESSION.orgId, name: MOCK_SESSION.orgName, slug: "skyline-realty", email: "design@skyline.test", website_url: null, allowed_domains: [], status: "active", created_at: "2026-01-01T00:00:00Z" };
  }

  // ---- places (global, no org) ----
  if (path === "/api/v1/places/autocomplete") return { predictions: MOCK_PLACES };
  if (path === "/api/v1/places/details" || path === "/api/v1/places/reverse") return MOCK_PLACE_DETAILS;

  if (method === "GET") {
    if (rel === "/listings") return listingsResponse();
    const lm = rel.match(/^\/listings\/([^/]+)$/);
    if (lm) return MOCK_LISTINGS.find((l) => l.id === lm[1]) ?? MOCK_LISTINGS[0];

    if (rel === "/channels") return { channels: MOCK_CHANNELS };
    if (rel === "/channels/facebook/pages") return { pages: [{ id: "page-1", name: "Skyline Realty Page" }] };
    if (rel === "/channels/instagram/accounts") return { accounts: [{ id: "ig-1", ig_user_id: "ig-1", username: "skylinerealty" }] };

    if (rel === "/dashboard/stats") return MOCK_UNIFIED;
    if (rel === "/dashboard/close-in") return MOCK_CLOSE_IN;
    if (rel === "/dashboard/show-up") return MOCK_SHOW_UP;

    if (rel === "/notifications") return { notifications: MOCK_NOTIFICATIONS, unread_count: UNREAD };
    if (rel === "/notifications/unread-count") return { unread_count: UNREAD };

    if (rel === "/video/generations") return { generations: MOCK_VIDEOS };
    const vm = rel.match(/^\/video\/generations\/([^/]+)$/);
    if (vm) return MOCK_VIDEOS.find((v) => v.id === vm[1]) ?? MOCK_VIDEOS[0];
  }

  // ---- mutations: plausible success so create/edit flows don't crash ----
  if (rel === "/video/generations" && method === "POST") {
    return { generation_id: "gen-new", name: (body as { name?: string })?.name ?? "Untitled video", status: "pending" };
  }
  if (/^\/video\/generations\/[^/]+\/images$/.test(rel)) {
    return { generation_id: "gen-new", image_index: 0, s3_key: "mock", preview_url: PROPERTY_IMAGES[0], filename: "image.jpg" };
  }
  if (/^\/video\/generations\/[^/]+\/trigger$/.test(rel)) {
    return { generation_id: "gen-new", status: "processing", message: "Generation started." };
  }
  if (/^\/video\/generations\/[^/]+\/audio$/.test(rel)) {
    return { approved: true, reason: "", transcript: "Welcome to this beautiful home in Pune.", mentioned_competitors: [], video_url: SAMPLE_VIDEO, hls_url: null, local_hls_url: null };
  }
  if (rel === "/listings/parse") return { success: true, extracted: {}, missing: [], mapped_fields: {} };
  if (rel === "/listings/transcribe") return { success: true, transcript: "Three BHK in Baner, fifteen hundred square feet, asking two point four crore." };
  if (rel === "/listings/generate-description") return { success: true, description: "Step into refined living with this thoughtfully designed home — generous proportions, abundant natural light, and premium finishes throughout." };
  if (rel === "/listings/submit" || rel === "/listings/submit-with-media" || rel === "/listings/save-draft") {
    return { success: true, message: "Saved (mock).", listing_id: "listing-new" };
  }

  // Unknown endpoint while mocking — benign success keeps the UI happy.
  return { success: true };
}
