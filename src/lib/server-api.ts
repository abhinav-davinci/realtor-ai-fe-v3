import { cookies } from "next/headers";
import {
  API_BASE,
  TOKEN_COOKIE,
  ORG_COOKIE,
  type ListListingsResponse,
  type VideoStatusResponse,
  type UnifiedStats,
  type CloseInStats,
  type ShowUpStats,
} from "@/lib/api";
import { MOCK_ENABLED, MOCK_SESSION, resolveMock } from "@/lib/mock-data";

/** Read the session (token + org) from the request cookies on the server. */
export async function getServerSession(): Promise<{ token: string | null; orgId: string | null }> {
  if (MOCK_ENABLED) return { token: MOCK_SESSION.token, orgId: MOCK_SESSION.orgId };
  const c = await cookies();
  return {
    token: c.get(TOKEN_COOKIE)?.value ?? null,
    orgId: c.get(ORG_COOKIE)?.value ?? null,
  };
}

/** Authenticated server-side fetch to the backend. Returns null on any failure
 *  so a page can fall back to client-side fetching without crashing SSR. */
export async function serverFetch<T>(path: string): Promise<T | null> {
  if (MOCK_ENABLED) return resolveMock(path) as T;
  const { token } = await getServerSession();
  if (!token) return null;
  try {
    const res = await fetch(API_BASE + path, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      // Fail fast so a slow/unreachable backend never blocks the page render
      // (otherwise client navigation appears to hang until a manual refresh).
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Server-side listings fetch for the My Properties page. */
export async function serverListings(): Promise<ListListingsResponse | null> {
  const { orgId } = await getServerSession();
  if (!orgId) return null;
  return serverFetch<ListListingsResponse>(`/api/v1/orgs/${orgId}/listings?page=1&limit=100`);
}

/** Server-side video generations (normalized to a list). */
export async function serverVideos(limit = 50): Promise<VideoStatusResponse[]> {
  const { orgId } = await getServerSession();
  if (!orgId) return [];
  const res = await serverFetch<{ generations?: VideoStatusResponse[]; items?: VideoStatusResponse[] }>(
    `/api/v1/orgs/${orgId}/video/generations?limit=${limit}`
  );
  return res?.generations ?? res?.items ?? [];
}

/** Server-side connected channels list. */
export async function serverChannels(): Promise<Array<{ platform: string; [k: string]: unknown }>> {
  const { orgId } = await getServerSession();
  if (!orgId) return [];
  const res = await serverFetch<{ channels?: Array<{ platform: string; [k: string]: unknown }> }>(
    `/api/v1/orgs/${orgId}/channels`
  );
  return res?.channels ?? [];
}

/** Server-side dashboard KPIs for the Analytics page (default range). */
export async function serverDashboard(period = "7d"): Promise<{
  u: UnifiedStats | null;
  c: CloseInStats | null;
  s: ShowUpStats | null;
}> {
  const { orgId } = await getServerSession();
  if (!orgId) return { u: null, c: null, s: null };
  const [u, c, s] = await Promise.all([
    serverFetch<UnifiedStats>(`/api/v1/orgs/${orgId}/dashboard/stats?period=${period}`),
    serverFetch<CloseInStats>(`/api/v1/orgs/${orgId}/dashboard/close-in?period=${period}`),
    serverFetch<ShowUpStats>(`/api/v1/orgs/${orgId}/dashboard/show-up?period=${period}`),
  ]);
  return { u, c, s };
}
