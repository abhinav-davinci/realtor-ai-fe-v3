"use client";

import { createElement, useEffect, useState } from "react";
import {
  Check,
  CircleAlert,
  Link2,
  Loader2,
  Rocket,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { FacebookGlyph, InstagramGlyph, YoutubeGlyph, WhatsappGlyph, SparkleIcon } from "./brand-glyphs";

interface PlatformInfo {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
  permissions: string;
  oauth: boolean; // backend supports OAuth connect
}
const PLATFORMS: PlatformInfo[] = [
  {
    key: "facebook",
    label: "Facebook",
    icon: FacebookGlyph,
    desc: "Connect your Facebook account to manage Pages, publish posts, and track engagement.",
    permissions: "Pages Show List, Pages Read Engagement, Pages Manage Posts, Pages Manage Metadata",
    oauth: true,
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: InstagramGlyph,
    desc: "Publish reels to your Instagram Business account linked via Facebook. Uses the same Meta login.",
    permissions: "Instagram Basic, Instagram Content Publish",
    oauth: true,
  },
  {
    key: "youtube",
    label: "YouTube",
    icon: YoutubeGlyph,
    desc: "Upload videos and Shorts to your YouTube channel directly from the dashboard.",
    permissions: "Youtube Upload, Youtube Readonly",
    oauth: false,
  },
];

const STEPS = [
  { t: "Select Platform", d: "Choose Facebook, Instagram, YouTube, or WhatsApp above." },
  { t: "Authorize Access", d: "You'll be redirected to the platform's login page to grant permissions." },
  { t: "Select Pages", d: "Choose which Pages or channels to connect for publishing." },
  { t: "Start Posting", d: "Publish reels, posts, and videos from your dashboard." },
];

function toMap(channels?: Array<{ platform: string; connected?: boolean }>): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const ch of channels ?? []) map[ch.platform.toLowerCase()] = ch.connected !== false;
  return map;
}

export function ConnectPlatforms({
  initialChannels,
}: {
  initialChannels?: Array<{ platform: string; connected?: boolean }>;
}) {
  const [connected, setConnected] = useState<Record<string, boolean>>(() => toMap(initialChannels));
  const [loading, setLoading] = useState(!initialChannels);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  // Real connected-page/account counts per platform (from the backend).
  const [pageCounts, setPageCounts] = useState<Record<string, number>>({});

  // WhatsApp setup form
  const [waName, setWaName] = useState("");
  const [waPhone, setWaPhone] = useState("");
  const [waConsent, setWaConsent] = useState(false);
  const [waMsg, setWaMsg] = useState<string | null>(null);
  const [waBusy, setWaBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.channels.list();
      const map = toMap(res.channels);
      setConnected(map);
      void loadCounts(map);
    } catch {
      /* unconnected org returns empty */
    } finally {
      setLoading(false);
    }
  }

  // Fetch the real connected page/account counts for connected platforms.
  async function loadCounts(map: Record<string, boolean>) {
    const counts: Record<string, number> = {};
    try {
      if (map["facebook"]) {
        const r = await api.channels.facebookPages();
        counts.facebook = r.pages?.length ?? 0;
      }
    } catch {
      /* ignore */
    }
    try {
      if (map["instagram"]) {
        const r = await api.channels.instagramAccounts();
        counts.instagram = r.accounts?.length ?? 0;
      }
    } catch {
      /* ignore */
    }
    setPageCounts(counts);
  }
  useEffect(() => {
    if (initialChannels) {
      void loadCounts(toMap(initialChannels)); // server provided channels; still fetch counts
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialChannels]);

  async function connect(p: PlatformInfo) {
    setErr(null);
    if (!p.oauth) {
      setErr(`${p.label} connection isn't available yet on this environment.`);
      return;
    }
    setBusy(p.key);
    try {
      const { auth_url } = await api.channels.authUrl(p.key as "facebook" | "instagram");
      window.location.href = auth_url;
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : `Couldn't start ${p.label} connection.`);
      setBusy(null);
    }
  }

  async function disconnect(key: string) {
    setBusy(key);
    setErr(null);
    try {
      await api.channels.disconnect(key);
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Disconnect failed.");
    } finally {
      setBusy(null);
    }
  }

  async function requestWhatsApp() {
    setWaMsg(null);
    if (!waName.trim() || !waPhone.trim() || !waConsent) return;
    setWaBusy(true);
    try {
      await api.whatsapp.requestSetup(waName.trim(), waPhone.trim());
      setWaMsg("Request submitted! Our team will set up your WhatsApp Business and email you (usually 1–2 business days).");
      setWaName("");
      setWaPhone("");
      setWaConsent(false);
    } catch (e) {
      setWaMsg(e instanceof ApiError ? e.message : "Couldn't submit the request.");
    } finally {
      setWaBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10">
      <div className="shrink-0">
        <h1 className="text-ink text-2xl font-bold">Connect Social Media Platforms</h1>
        <p className="text-ink-muted text-sm">
          Connect your social media accounts to publish and schedule content across multiple platforms.
        </p>
      </div>

      {/* Banner */}
      <div
        className="relative mt-6 flex shrink-0 flex-col items-start justify-between gap-4 overflow-hidden rounded-xl bg-gradient-to-r from-[#3C5B95] via-[#314E80] to-[#293F69] px-6 py-5 text-white after:pointer-events-none after:absolute after:inset-0 after:-translate-x-full after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent after:content-[''] motion-safe:after:animate-shimmer sm:flex-row sm:items-center"
        style={{ animation: "fade-in-up 400ms ease-out both" }}
      >
        {/* Decorative texture: diagonal facet + concentric rings */}
        <span className="pointer-events-none absolute inset-y-0 -left-12 w-2/5 -skew-x-12 bg-white/[0.05]" />
        <span className="pointer-events-none absolute -top-16 right-24 size-48 rounded-full border border-white/10" />
        <span className="pointer-events-none absolute -bottom-24 right-10 size-56 rounded-full border border-white/[0.07]" />
        <div className="relative flex items-center gap-4">
          <span className="relative grid size-14 shrink-0 place-items-center">
            <Rocket className="size-11 motion-safe:animate-float" strokeWidth={1.5} />
            {/* sparkle accents around the rocket (same glyph as Create Video button) */}
            <SparkleIcon className="absolute -top-0.5 -left-1 size-3.5 text-white/80" />
            <SparkleIcon className="absolute bottom-0 left-0.5 size-2 text-white/60" />
          </span>
          <div>
            <p className="text-lg font-bold">More Connections, More Reach!</p>
            <p className="text-sm text-white/80">
              Connect multiple platforms to expand your audience, increase engagement, and publish content faster.
            </p>
          </div>
        </div>
        <Button className="relative h-10 shrink-0 rounded-lg bg-[#46699F] px-4 text-sm font-semibold text-white ring-1 ring-white/15 hover:bg-[#3E5E92]">
          <SparkleIcon className="size-4" />
          Watch How It Works
        </Button>
      </div>

      {err && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}

      {loading ? (
        <div className="mt-8 grid place-items-center py-16">
          <Loader2 className="text-accent-blue size-6 animate-spin" />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {PLATFORMS.map((p) => {
            const isConn = connected[p.key];
            return (
              <PlatformCard
                key={p.key}
                p={p}
                connected={!!isConn}
                pageCount={pageCounts[p.key]}
                busy={busy === p.key}
                onConnect={() => connect(p)}
                onDisconnect={() => disconnect(p.key)}
              />
            );
          })}

          {/* WhatsApp card */}
          <div className="rounded-2xl border border-black/[0.07] bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <WhatsappGlyph className="mt-0.5 size-7" />
                <div>
                  <p className="text-ink font-bold">WhatsApp</p>
                  <p className="text-ink-muted text-sm">
                    Connect WhatsApp Business via Gupshup to send templates, run broadcast campaigns, and manage conversations.
                  </p>
                </div>
              </div>
              <StatusBadge connected={!!connected["whatsapp"]} />
            </div>

            <p className="text-ink-muted mt-3 text-sm">
              Tell us your WhatsApp Business number and our team will handle the rest — Gupshup provisioning, verification,
              everything. You&apos;ll get an email when it&apos;s ready (typically 1–2 business days).
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-ink mb-1.5 block text-sm font-medium">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={waName}
                  onChange={(e) => setWaName(e.target.value)}
                  placeholder="Enter business name"
                  className="text-ink placeholder:text-ink-muted/60 focus:border-accent-blue/50 h-11 w-full rounded-lg border border-black/15 bg-white px-3.5 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-ink mb-1.5 block text-sm font-medium">
                  WhatsApp Business Number <span className="text-red-500">*</span>
                </label>
                <div className="focus-within:border-accent-blue/50 flex h-11 items-center gap-2 rounded-lg border border-black/15 bg-white px-3">
                  <span className="text-ink-muted shrink-0 text-sm">🇮🇳 +91</span>
                  <input
                    value={waPhone}
                    onChange={(e) => setWaPhone(e.target.value)}
                    inputMode="numeric"
                    placeholder="Enter your mobile number"
                    className="text-ink placeholder:text-ink-muted/60 min-w-0 flex-1 bg-transparent text-sm outline-none"
                  />
                </div>
              </div>
            </div>

            <label className="text-ink-muted mt-3 flex items-start gap-2 text-xs">
              <input
                type="checkbox"
                checked={waConsent}
                onChange={(e) => setWaConsent(e.target.checked)}
                className="mt-0.5 size-4 accent-[#2f6bed]"
              />
              I confirm this is a registered business WhatsApp number and I have consent from recipients before messaging
              them, in line with WhatsApp Business policy.
            </label>

            {waMsg && (
              <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{waMsg}</p>
            )}

            <div className="mt-4 flex justify-end">
              <Button
                onClick={requestWhatsApp}
                disabled={!waName.trim() || !waPhone.trim() || !waConsent || waBusy}
                className={cn(
                  "h-10 rounded-lg px-4 text-sm font-semibold",
                  waName.trim() && waPhone.trim() && waConsent && !waBusy
                    ? "bg-brand-green hover:bg-brand-green-hover text-white"
                    : "text-ink-muted bg-black/[0.06]"
                )}
              >
                {waBusy ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
                Request WhatsApp Setup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="mt-8 rounded-2xl bg-black/[0.02] p-6">
        <p className="text-ink font-bold">How it works ( 4 simple steps )</p>
        <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.t} className="relative">
              {/* connector line to the next step (desktop) */}
              {i < STEPS.length - 1 && (
                <span className="bg-accent-blue/20 absolute top-3.5 left-3.5 hidden h-px w-full -translate-y-1/2 lg:block" />
              )}
              <span
                className={cn(
                  "relative z-10 grid size-7 place-items-center rounded-full text-xs font-bold",
                  i === 0 ? "bg-accent-blue text-white" : "bg-accent-blue/15 text-accent-blue"
                )}
              >
                {i + 1}
              </span>
              <p className="text-ink mt-3 text-sm font-semibold">{s.t}</p>
              <p className="text-ink-muted mt-1 text-xs leading-snug">{s.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tokens note */}
      <div className="border-brand-orange/25 bg-brand-orange/[0.06] mt-5 flex items-start gap-3 rounded-2xl border p-4">
        <ShieldCheck className="text-brand-orange mt-0.5 size-5 shrink-0" />
        <p className="text-ink-muted text-sm">
          <span className="text-ink font-semibold">About access tokens. </span>
          Facebook and Instagram tokens are long-lived but may expire after 60 days or if you change your password. If a
          token expires, simply reconnect the platform to refresh it. YouTube tokens auto-refresh as long as you don&apos;t
          revoke access from your Google account settings.
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ connected }: { connected: boolean }) {
  return connected ? (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-600">
      <Check className="size-3" strokeWidth={3} /> Connected
    </span>
  ) : (
    <span className="text-brand-orange bg-brand-orange/10 inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium">
      <CircleAlert className="size-3" /> Not Connected
    </span>
  );
}

function PlatformCard({
  p,
  connected,
  pageCount,
  busy,
  onConnect,
  onDisconnect,
}: {
  p: PlatformInfo;
  connected: boolean;
  pageCount?: number;
  busy: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-black/[0.07] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {createElement(p.icon, { className: "mt-0.5 size-7" })}
          <div>
            <p className="text-ink font-bold">{p.label}</p>
            <p className="text-ink-muted text-sm">{p.desc}</p>
          </div>
        </div>
        <StatusBadge connected={connected} />
      </div>

      {connected && (
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-black/[0.02] p-4 text-sm">
          <div>
            <p className="text-ink-muted text-xs">Page Connected</p>
            <p className="text-ink mt-0.5 font-semibold">{pageCount ?? 1}</p>
          </div>
          <div>
            <p className="text-ink-muted text-xs">Posts Published</p>
            <p className="text-ink mt-0.5 font-semibold">25</p>
          </div>
          <div>
            <p className="text-ink-muted text-xs">Last Sync</p>
            <p className="text-ink mt-0.5 font-semibold">2h ago</p>
          </div>
        </div>
      )}

      <div className="bg-accent-blue/[0.06] mt-3 flex items-start gap-2 rounded-lg px-3 py-2">
        <ShieldCheck className="text-accent-blue mt-0.5 size-4 shrink-0" />
        <p className="text-ink-muted text-xs">
          <span className="text-ink font-medium">Permissions: </span>
          {p.permissions}
        </p>
      </div>

      <div className="mt-auto flex justify-end gap-3 pt-4">
        {connected ? (
          <Button
            variant="outline"
            onClick={onDisconnect}
            disabled={busy}
            className="text-ink h-10 rounded-lg border-black/15 px-4 text-sm font-medium"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Settings className="size-4" />}
            Manage Connection
          </Button>
        ) : (
          <Button
            onClick={onConnect}
            disabled={busy}
            className="bg-brand-blue hover:bg-brand-blue-hover h-10 rounded-lg px-4 text-sm font-semibold text-white"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
            Connect Account
          </Button>
        )}
      </div>
    </div>
  );
}
