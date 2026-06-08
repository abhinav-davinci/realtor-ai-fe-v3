"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

/**
 * Client-side safety net. The real guard is now server-side middleware
 * (middleware.ts), so this renders children during SSR (no blocking spinner)
 * and only redirects on the client if the session is definitively gone.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace("/login");
  }, [loading, isAuthenticated, router]);

  return <>{children}</>;
}
