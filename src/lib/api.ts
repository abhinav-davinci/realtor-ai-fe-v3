/**
 * Typed client for the Realtor AI backend (FastAPI).
 *
 * All paths and shapes mirror the backend contracts:
 *  - Auth:     /api/v1/auth/*
 *  - Listings: /api/v1/orgs/{org_id}/listings/*   (require_org_match)
 *  - Video:    /api/v1/orgs/{org_id}/video/*       (require_org_match)
 *
 * The bearer token + org_id are read from localStorage (see auth.tsx).
 */

import { MOCK_ENABLED, MOCK_SESSION, resolveMock } from "@/lib/mock-data";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8001";

/* ----------------------------- token storage ----------------------------- */

const TOKEN_KEY = "rtai.token";
const ORG_ID_KEY = "rtai.org_id";

export function getToken(): string | null {
  if (MOCK_ENABLED) return MOCK_SESSION.token;
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getOrgId(): string | null {
  if (MOCK_ENABLED) return MOCK_SESSION.orgId;
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ORG_ID_KEY);
}

// Cookie names the server (middleware + server components) reads for SSR.
export const TOKEN_COOKIE = "rtai_token";
export const ORG_COOKIE = "rtai_org";

function setCookie(name: string, value: string, days = 1) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}
function deleteCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function setSession(token: string, orgId: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(ORG_ID_KEY, orgId);
  // Mirror into cookies so middleware + server components can authenticate.
  setCookie(TOKEN_COOKIE, token);
  setCookie(ORG_COOKIE, orgId);
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(ORG_ID_KEY);
  deleteCookie(TOKEN_COOKIE);
  deleteCookie(ORG_COOKIE);
}

/* -------------------------------- errors --------------------------------- */

export class ApiError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

/* ------------------------------ core request ------------------------------ */

interface RequestOpts {
  method?: string;
  /** JSON body — serialized automatically. Mutually exclusive with `form`. */
  body?: unknown;
  /** FormData body for multipart endpoints (uploads). */
  form?: FormData;
  /** Query params. */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Attach the bearer token. Defaults to true. */
  auth?: boolean;
  signal?: AbortSignal;
  /** Override the request timeout in ms. Defaults: 120s for uploads, 30s otherwise. */
  timeoutMs?: number;
}

/** Merge an optional caller signal with our timeout signal. */
function mergeSignals(a: AbortSignal | undefined, b: AbortSignal): AbortSignal {
  if (!a) return b;
  // AbortSignal.any is supported in all modern browsers (and Node 20+).
  const anyFn = (AbortSignal as unknown as { any?: (s: AbortSignal[]) => AbortSignal }).any;
  return anyFn ? anyFn([a, b]) : b;
}

async function request<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const { method = "GET", body, form, query, auth = true, signal, timeoutMs } = opts;

  // Mock mode: resolve from sample data instead of touching the network. A small
  // delay keeps loading/skeleton states visible for design work.
  if (MOCK_ENABLED) {
    await new Promise((r) => setTimeout(r, 150));
    return resolveMock(path, method, body) as T;
  }

  const url = new URL(API_BASE + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {};
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  if (body !== undefined) headers["Content-Type"] = "application/json";

  // Never let a hung backend leave the UI spinning forever.
  const timeout = timeoutMs ?? (form ? 120_000 : 30_000);
  const timeoutSignal = AbortSignal.timeout(timeout);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method,
      headers,
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
      signal: mergeSignals(signal, timeoutSignal),
    });
  } catch (e) {
    if (signal?.aborted) throw e; // caller cancelled — propagate as-is
    if (timeoutSignal.aborted) {
      throw new ApiError(0, "Request timed out. Please try again.");
    }
    throw new ApiError(0, "Network error — please check your connection.");
  }

  // 204 / empty
  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    // Expired/invalid session on an authed request → clear it and bounce to login.
    // (Skip for auth endpoints, where 401 just means "wrong credentials".)
    if (res.status === 401 && auth) {
      handleUnauthorized();
    }
    const detail = (data as { detail?: unknown })?.detail ?? data;
    const message =
      typeof detail === "string" ? detail : `Request failed (${res.status})`;
    throw new ApiError(res.status, message, detail);
  }
  return data as T;
}

/** Clear the dead session and redirect to /login (once). */
function handleUnauthorized() {
  if (typeof window === "undefined") return;
  clearSession();
  try {
    window.localStorage.removeItem("rtai.org_name");
    window.localStorage.removeItem("rtai.role");
  } catch {
    /* ignore */
  }
  if (window.location.pathname !== "/login") {
    window.location.assign("/login?expired=1");
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/* -------------------------------- helpers -------------------------------- */

function requireOrg(): string {
  const orgId = getOrgId();
  if (!orgId) throw new ApiError(401, "Not authenticated (no org_id)");
  return orgId;
}

/* --------------------------------- types --------------------------------- */

export interface LoginResponse {
  access_token: string;
  token_type: string;
  org_id: string;
  org_name: string;
  role: string;
}

export interface OrgResponse {
  id: string;
  name: string;
  slug: string;
  email: string;
  website_url: string | null;
  allowed_domains: string[];
  status: string;
  created_at: string;
}

export interface RegisterBody {
  name: string;
  slug: string;
  email: string;
  password: string;
  phone?: string | null;
  website_url?: string | null;
  allowed_domains?: string[];
}

export interface ListingMedia {
  s3_key: string;
  original_filename: string;
  content_type: string;
  uploaded_at: string;
  preview_url: string | null;
}

/** Subset of the (very wide) ListingItem we actually use in the UI. */
export interface ListingItem {
  id: string;
  property_title: string | null;
  description: string | null;
  property_type: string | null;
  category: string | null;
  price: string | null;
  rent_rate: number | null;
  sale_rate: number | null;
  area_sqft: number | null;
  chargeable_area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  city: string | null;
  state: string | null;
  locality: string | null;
  building_name: string | null;
  property_available_for: string | null;
  listing_status: string;
  images: ListingMedia[];
  videos: ListingMedia[];
  created_at: string;
  updated_at: string;
  // wide schema — allow extra fields without type friction
  [key: string]: unknown;
}

export interface ListListingsResponse {
  success: boolean;
  items: ListingItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ParseResponse {
  success: boolean;
  extracted: Record<string, unknown>;
  missing: string[];
  mapped_fields: Record<string, unknown>;
}

export interface SubmitResponse {
  success: boolean;
  message: string;
  listing_id: string;
}

export interface VideoStatusResponse {
  id: string;
  name: string | null;
  status: string; // pending | processing | completed | failed
  progress: number;
  video_url: string | null;
  error_message: string | null;
  images: { s3_key: string; original_filename: string; content_type: string; uploaded_at: string }[];
  created_at: string;
  updated_at: string;
}

export interface CreateGenerationResponse {
  generation_id: string;
  name: string | null;
  status: string;
}

export interface UploadImageResponse {
  generation_id: string;
  image_index: number;
  s3_key: string;
  preview_url: string;
  filename: string;
}

export interface PlaceDetails {
  name: string;
  formatted_address: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
}

export interface UnifiedStats {
  total_leads: number;
  total_properties: number;
  conversion_rate: number;
  revenue_pipeline: string;
  period: string;
}

export interface CloseInStats {
  total_enquiries: number;
  hot_leads: number;
  qualification_rate: number;
  site_visits: number;
  period: string;
}

export interface ShowUpStats {
  properties: number;
  total_views: number;
  engagement_rate: number;
  pending_follow_ups: number;
  period: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

/* ---------------------------------- API ---------------------------------- */

export interface AddAudioResponse {
  approved: boolean;
  reason: string;
  transcript: string;
  mentioned_competitors: string[];
  video_url: string | null;
  hls_url: string | null;
  local_hls_url: string | null;
}

export const api = {
  auth: {
    register: (body: RegisterBody) =>
      request<OrgResponse>("/api/v1/auth/register", { method: "POST", body, auth: false }),

    login: (email: string, password: string) =>
      request<LoginResponse>("/api/v1/auth/login", {
        method: "POST",
        body: { email, password },
        auth: false,
      }),
  },

  listings: {
    list: (params?: {
      listing_status?: "active" | "expired" | "draft" | "sold";
      search?: string;
      page?: number;
      limit?: number;
    }) =>
      request<ListListingsResponse>(`/api/v1/orgs/${requireOrg()}/listings`, {
        query: params,
      }),

    get: (listingId: string) =>
      request<ListingItem>(`/api/v1/orgs/${requireOrg()}/listings/${listingId}`),

    /** Parse a transcript into structured property fields (LLM). */
    parse: (transcript: string) =>
      request<ParseResponse>(`/api/v1/orgs/${requireOrg()}/listings/parse`, {
        method: "POST",
        body: { transcript },
      }),

    /** Transcribe an audio blob to text. */
    transcribe: (audio: Blob, language = "unknown") => {
      const form = new FormData();
      form.append("audio", audio, "recording.webm");
      form.append("language", language);
      return request<{ success: boolean; transcript: string }>(
        `/api/v1/orgs/${requireOrg()}/listings/transcribe`,
        { method: "POST", form }
      );
    },

    /** Create a listing from a transcript + structured data (JSON, no media). */
    submit: (data: Record<string, unknown>, transcript = "", publishOnTrythat = false) =>
      request<SubmitResponse>(`/api/v1/orgs/${requireOrg()}/listings/submit`, {
        method: "POST",
        body: { transcript, data, publish_on_trythat: publishOnTrythat },
      }),

    /** Generate a listing description from the property fields entered so far. */
    generateDescription: (fields: Record<string, unknown>) =>
      request<{ success: boolean; description: string }>(
        `/api/v1/orgs/${requireOrg()}/listings/generate-description`,
        { method: "POST", body: { fields }, timeoutMs: 30_000 }
      ),

    /** Persist an in-progress listing as a draft (resumable from the Draft tab). */
    saveDraft: (data: Record<string, unknown>, transcript = "") =>
      request<SubmitResponse>(`/api/v1/orgs/${requireOrg()}/listings/save-draft`, {
        method: "POST",
        body: { transcript, data },
      }),

    /** Create a listing with images/videos (multipart). */
    submitWithMedia: (
      data: Record<string, unknown>,
      files: { images?: File[]; videos?: File[] } = {},
      opts: { transcript?: string; publishOnTrythat?: boolean } = {}
    ) => {
      const form = new FormData();
      form.append("data", JSON.stringify(data));
      if (opts.transcript) form.append("transcript", opts.transcript);
      form.append("publish_on_trythat", String(opts.publishOnTrythat ?? false));
      (files.images ?? []).forEach((f) => form.append("images", f, f.name));
      (files.videos ?? []).forEach((f) => form.append("videos", f, f.name));
      return request<SubmitResponse & { published_on_trythat?: boolean }>(
        `/api/v1/orgs/${requireOrg()}/listings/submit-with-media`,
        { method: "POST", form }
      );
    },

    /** Update an existing listing's property data (edit flow). */
    update: (listingId: string, data: Record<string, unknown>, publishOnTrythat = false) =>
      request<SubmitResponse>(`/api/v1/orgs/${requireOrg()}/listings/${listingId}`, {
        method: "PUT",
        body: { data, publish_on_trythat: publishOnTrythat },
      }),

    updateStatus: (listingId: string, status: "active" | "draft" | "sold" | "expired") =>
      request<SubmitResponse>(
        `/api/v1/orgs/${requireOrg()}/listings/${listingId}/status`,
        { method: "PATCH", body: { listing_status: status } }
      ),

    remove: (listingId: string) =>
      request<{ success: boolean; message: string; listing_id: string }>(
        `/api/v1/orgs/${requireOrg()}/listings/${listingId}`,
        { method: "DELETE" }
      ),
  },

  channels: {
    list: () =>
      request<{
        channels: Array<{ platform: string; connected?: boolean; account_name?: string; [k: string]: unknown }>;
      }>(`/api/v1/orgs/${requireOrg()}/channels`),
    authUrl: (platform: "facebook" | "instagram") =>
      request<{ auth_url: string }>(`/api/v1/orgs/${requireOrg()}/channels/${platform}/auth-url`),
    disconnect: (platform: string) =>
      request<{ success?: boolean }>(`/api/v1/orgs/${requireOrg()}/channels/${platform}/disconnect`, {
        method: "DELETE",
      }),
    facebookPages: () =>
      request<{ pages?: Array<{ id: string; name?: string }> }>(
        `/api/v1/orgs/${requireOrg()}/channels/facebook/pages`
      ),
    instagramAccounts: () =>
      request<{ accounts?: Array<{ id?: string; ig_user_id?: string; username?: string }> }>(
        `/api/v1/orgs/${requireOrg()}/channels/instagram/accounts`
      ),
    facebookPostVideo: (pageId: string, video_url: string, description: string) =>
      request<{ post_id?: string; video_id?: string }>(
        `/api/v1/orgs/${requireOrg()}/channels/facebook/pages/${pageId}/video`,
        { method: "POST", body: { video_url, description } }
      ),
    facebookPostMessage: (pageId: string, message: string, image_url?: string) =>
      request<{ post_id?: string }>(
        `/api/v1/orgs/${requireOrg()}/channels/facebook/pages/${pageId}/post`,
        { method: "POST", body: { message, image_url } }
      ),
    // Instagram reels are a 3-step flow: create container → poll status → publish.
    instagramCreateReel: (igUserId: string, video_url: string, caption: string) =>
      request<{ container_id: string }>(
        `/api/v1/orgs/${requireOrg()}/channels/instagram/accounts/${igUserId}/reel`,
        { method: "POST", body: { video_url, caption } }
      ),
    instagramReelStatus: (igUserId: string, containerId: string) =>
      request<{ container_id: string; status_code: string }>(
        `/api/v1/orgs/${requireOrg()}/channels/instagram/accounts/${igUserId}/reel/${containerId}/status`
      ),
    instagramPublishReel: (igUserId: string, containerId: string) =>
      request<{ media_id?: string }>(
        `/api/v1/orgs/${requireOrg()}/channels/instagram/accounts/${igUserId}/reel/${containerId}/publish`,
        { method: "POST" }
      ),
  },

  whatsapp: {
    requestSetup: (business_name: string, phone_number: string) =>
      request<{ success: boolean }>(`/api/v1/orgs/${requireOrg()}/whatsapp/setup-request`, {
        method: "POST",
        body: { business_name, phone_number },
      }),
  },

  dashboard: {
    /** Aggregated KPIs: total leads, properties, conversion rate, revenue pipeline. */
    stats: (period = "7d") =>
      request<UnifiedStats>(`/api/v1/orgs/${requireOrg()}/dashboard/stats`, { query: { period } }),
    /** Lead funnel: enquiries, hot leads, qualification rate, site visits. */
    closeIn: (period = "7d") =>
      request<CloseInStats>(`/api/v1/orgs/${requireOrg()}/dashboard/close-in`, { query: { period } }),
    /** Property visibility: properties, total views, engagement rate, pending follow-ups. */
    showUp: (period = "7d") =>
      request<ShowUpStats>(`/api/v1/orgs/${requireOrg()}/dashboard/show-up`, { query: { period } }),
  },

  notifications: {
    list: (params?: { limit?: number; offset?: number; unread_only?: boolean }) =>
      request<{ notifications: NotificationItem[]; unread_count: number }>(
        `/api/v1/orgs/${requireOrg()}/notifications`,
        { query: params }
      ),
    unreadCount: () =>
      request<{ unread_count: number }>(`/api/v1/orgs/${requireOrg()}/notifications/unread-count`),
    markRead: (id: string) =>
      request<{ message: string }>(`/api/v1/orgs/${requireOrg()}/notifications/${id}/read`, {
        method: "PUT",
      }),
    markAllRead: () =>
      request<{ message: string }>(`/api/v1/orgs/${requireOrg()}/notifications/read-all`, {
        method: "PUT",
      }),
  },

  places: {
    autocomplete: (q: string) =>
      request<{ predictions: { description: string; place_id: string }[] }>(
        "/api/v1/places/autocomplete",
        { query: { q } }
      ),
    details: (placeId: string) =>
      request<PlaceDetails>("/api/v1/places/details", { query: { place_id: placeId } }),
    reverse: (lat: number, lng: number) =>
      request<PlaceDetails>("/api/v1/places/reverse", { query: { lat, lng } }),
  },

  video: {
    create: (name: string) =>
      request<CreateGenerationResponse>(`/api/v1/orgs/${requireOrg()}/video/generations`, {
        method: "POST",
        body: { name },
      }),

    uploadImage: (generationId: string, file: File) => {
      const form = new FormData();
      form.append("file", file, file.name);
      return request<UploadImageResponse>(
        `/api/v1/orgs/${requireOrg()}/video/generations/${generationId}/images`,
        { method: "POST", form }
      );
    },

    trigger: (generationId: string, prompt?: string) =>
      request<{ generation_id: string; status: string; message: string }>(
        `/api/v1/orgs/${requireOrg()}/video/generations/${generationId}/trigger`,
        { method: "POST", body: prompt ? { prompt } : {} }
      ),

    status: (generationId: string) =>
      request<VideoStatusResponse>(
        `/api/v1/orgs/${requireOrg()}/video/generations/${generationId}`
      ),

    delete: (generationId: string) =>
      request<{ success?: boolean }>(
        `/api/v1/orgs/${requireOrg()}/video/generations/${generationId}`,
        { method: "DELETE" }
      ),

    list: async (params?: { limit?: number; offset?: number }) => {
      // Backend returns { generations: [...] }; normalize to { items }.
      const res = await request<{ generations?: VideoStatusResponse[]; items?: VideoStatusResponse[]; total?: number }>(
        `/api/v1/orgs/${requireOrg()}/video/generations`,
        { query: params }
      );
      return { items: res.generations ?? res.items ?? [], total: res.total };
    },

    /** Attach recorded/uploaded narration audio to a generated video. */
    addAudio: (generationId: string, audioFile: File) => {
      const form = new FormData();
      form.append("audio_file", audioFile, audioFile.name || "voiceover.webm");
      return request<AddAudioResponse>(
        `/api/v1/orgs/${requireOrg()}/video/generations/${generationId}/audio`,
        { method: "POST", form, timeoutMs: 180_000 }
      );
    },
  },
};
