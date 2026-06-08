"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

type Mode = "login" | "register";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export default function LoginPage() {
  const router = useRouter();
  const { login, register, isAuthenticated, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  // Show a notice when redirected here by an expired session (?expired=1).
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("expired")) {
      setExpired(true);
    }
  }, []);

  // Already signed in → go home.
  useEffect(() => {
    if (!authLoading && isAuthenticated) router.replace("/");
  }, [authLoading, isAuthenticated, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register({
          name: name.trim(),
          slug: slugify(name) || `org-${Date.now()}`,
          email: email.trim(),
          password,
        });
      }
      router.replace("/");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Something went wrong";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-cream grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-black/[0.07] bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <span className="bg-brand-blue grid size-12 place-items-center rounded-xl text-white">
            <Building2 className="size-6" />
          </span>
          <h1 className="text-ink mt-4 text-xl font-bold">
            {mode === "login" ? "Welcome back" : "Create your organization"}
          </h1>
          <p className="text-ink-muted mt-1 text-sm">
            {mode === "login"
              ? "Sign in to your Realtor AI workspace"
              : "Register a new org to get started"}
          </p>
        </div>

        {expired && mode === "login" && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-center text-sm text-amber-700">
            Your session expired. Please sign in again.
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {mode === "register" && (
            <Field label="Organization name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Acme Realty"
                className="text-ink placeholder:text-ink-muted/60 focus:border-accent-blue/50 h-11 w-full rounded-lg border border-black/15 bg-white px-3.5 text-sm outline-none"
              />
            </Field>
          )}
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@company.com"
              className="text-ink placeholder:text-ink-muted/60 focus:border-accent-blue/50 h-11 w-full rounded-lg border border-black/15 bg-white px-3.5 text-sm outline-none"
            />
          </Field>
          <Field label="Password">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder={mode === "register" ? "At least 8 characters" : "••••••••"}
                className="text-ink placeholder:text-ink-muted/60 focus:border-accent-blue/50 h-11 w-full rounded-lg border border-black/15 bg-white pr-11 pl-3.5 text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="text-ink-muted hover:text-ink absolute top-1/2 right-3 -translate-y-1/2"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="bg-brand-blue hover:bg-brand-blue-hover h-11 w-full rounded-lg text-sm font-semibold text-white"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {mode === "login" ? "Sign in" : "Create & continue"}
          </Button>
        </form>

        <p className="text-ink-muted mt-5 text-center text-sm">
          {mode === "login" ? "No organization yet?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError(null);
            }}
            className="text-accent-blue font-medium"
          >
            {mode === "login" ? "Register" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-ink mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
