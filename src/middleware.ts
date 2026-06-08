import { NextResponse, type NextRequest } from "next/server";

// Server-side route protection. Reads the session cookie set on login.
const PUBLIC_PATHS = ["/login"];

// Frontend-only mock mode (NEXT_PUBLIC_MOCK=1) — skip auth entirely so designers
// can reach every route without a backend.
const MOCK =
  process.env.NEXT_PUBLIC_MOCK === "1" || process.env.NEXT_PUBLIC_MOCK === "true";

export function middleware(req: NextRequest) {
  if (MOCK) return NextResponse.next();

  const { pathname } = req.nextUrl;
  const token = req.cookies.get("rtai_token")?.value;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  // Unauthenticated → bounce to login (remember where they were going).
  if (!token && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  // Already authenticated → keep them out of /login.
  if (token && pathname === "/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?|mp4)).*)",
  ],
};
