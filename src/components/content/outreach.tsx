"use client";

/**
 * Outreach by Platform: the section shell. Picks a connected channel
 * (WhatsApp / Facebook / Instagram), shows its connection status, and routes
 * the tab bar to the inbox or one of the secondary panels. Frontend-only over
 * the mock data in src/lib/outreach.ts; no backend contract is touched.
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Link2, MoreHorizontal, Settings2, Unplug, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PLATFORMS,
  TAB_LABELS,
  platformByKey,
  threadsFor,
  type PlatformKey,
  type TabKey,
  type WaTemplate,
} from "@/lib/outreach";
import { ConfirmDialog, EASE_OUT, PlatformGlyph, StatusPill } from "./outreach-shared";
import { OutreachInbox } from "./outreach-inbox";
import { InstagramStudio } from "./outreach-instagram";
import {
  BroadcastsPanel,
  ContactsPanel,
  FlowsPanel,
  TemplatesPanel,
} from "./outreach-panels";

export function Outreach() {
  const [platformKey, setPlatformKey] = useState<PlatformKey>("whatsapp");
  const [tab, setTab] = useState<TabKey>("inbox");
  // A panel can request a focused, full-height editor (e.g. the template
  // composer): the page header, connection strip, and tabs hide to give the
  // editor the whole content area, and the panel's own header handles "back".
  const [focus, setFocus] = useState(false);
  // "Use Template" hands a template to the Broadcasts tab, which opens the
  // broadcast wizard pre-filled with it.
  const [broadcastTemplate, setBroadcastTemplate] = useState<WaTemplate | null>(null);
  // Disconnect lives in the connection strip's menu (not a prominent button), and
  // a disconnected platform falls back to the connect empty state. Tracked per
  // platform so every channel behaves the same.
  const [disconnected, setDisconnected] = useState<Set<PlatformKey>>(() => new Set());

  const platform = platformByKey(platformKey);
  const connected = platform.connected && !disconnected.has(platformKey);
  const threads = threadsFor(platformKey);
  const unread = threads.reduce((n, t) => n + t.unread, 0);

  function disconnect(key: PlatformKey) {
    setDisconnected((s) => new Set(s).add(key));
  }
  function reconnect(key: PlatformKey) {
    setDisconnected((s) => {
      const next = new Set(s);
      next.delete(key);
      return next;
    });
  }

  function choosePlatform(key: PlatformKey) {
    setPlatformKey(key);
    // Land on the platform's first tab (WhatsApp/Facebook -> Inbox, Instagram -> Compose).
    setTab(platformByKey(key).tabs[0]);
    setFocus(false);
    setBroadcastTemplate(null);
  }

  function changeTab(t: TabKey) {
    setTab(t);
    setFocus(false);
    setBroadcastTemplate(null);
  }

  function useTemplate(t: WaTemplate) {
    setBroadcastTemplate(t);
    setTab("broadcasts");
    setFocus(true);
  }

  return (
    <div className="bg-white flex h-full flex-col overflow-hidden">
      {/* header + connection strip + tabs (hidden in focused editor mode) */}
      {!focus && (
        <div className="shrink-0 px-4 pt-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-ink text-2xl font-bold">Outreach by Platform</h1>
              <p className="text-ink-muted mt-1 text-sm">{platform.subtitle}</p>
            </div>
            <PlatformSelect value={platformKey} onChange={choosePlatform} disconnected={disconnected} />
          </div>

          {/* One compact connection strip for every platform (no prominent
              Disconnect button — it lives in the strip's menu). */}
          {connected && <ConnectionStrip platform={platform} onDisconnect={() => disconnect(platformKey)} />}

          {/* Instagram renders its own tabs inside the studio's left column (so the
              live preview can take the full height beside them); other platforms use
              the shared full-width tab bar here. */}
          {connected && platformKey !== "instagram" && (
            <TabBar
              tabs={platform.tabs}
              active={tab}
              onChange={changeTab}
              unread={unread}
              // re-key so the underline re-measures when the platform's tab set changes
              key={platformKey}
            />
          )}
        </div>
      )}

      {/* tab content */}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col px-4 pb-6 sm:px-6 lg:px-8",
          focus ? "pt-5" : "pt-4"
        )}
      >
        {!connected ? (
          <ConnectState platform={platform} onConnect={() => reconnect(platformKey)} />
        ) : platformKey === "instagram" ? (
          <InstagramStudio tab={tab} onNavigate={changeTab} />
        ) : tab === "inbox" ? (
          <OutreachInbox key={platformKey} threads={threads} />
        ) : tab === "templates" ? (
          <TemplatesPanel onFocus={setFocus} onUseTemplate={useTemplate} />
        ) : tab === "broadcasts" ? (
          <BroadcastsPanel
            initialTemplate={broadcastTemplate}
            onFocus={setFocus}
            onConsumeTemplate={() => setBroadcastTemplate(null)}
          />
        ) : tab === "contacts" ? (
          <ContactsPanel />
        ) : (
          <FlowsPanel onFocus={setFocus} />
        )}
      </div>
    </div>
  );
}

/* ---------------------------- platform selector --------------------------- */

function PlatformSelect({
  value,
  onChange,
  disconnected,
}: {
  value: PlatformKey;
  onChange: (key: PlatformKey) => void;
  /** Platforms the user has disconnected this session (status differs from the seed). */
  disconnected: Set<PlatformKey>;
}) {
  const [open, setOpen] = useState(false);
  const current = platformByKey(value);

  return (
    <div className="flex items-center gap-3">
      <span className="text-ink-muted hidden text-sm sm:inline">Select Platform</span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="text-ink hover:border-black/25 flex h-10 w-44 items-center gap-2 rounded-lg border border-black/15 bg-white px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent-blue/40"
        >
          <PlatformGlyph platform={value} className="size-5" />
          <span className="flex-1 text-left">{current.label}</span>
          <ChevronDown className={cn("text-ink-muted size-4 transition-transform duration-200", open && "rotate-180")} />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
            <div
              role="listbox"
              className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-black/[0.08] bg-white p-1 shadow-lg shadow-black/[0.08]"
              style={{ animation: `scale-in 160ms ${EASE_OUT} both`, transformOrigin: "top right" }}
            >
              {PLATFORMS.map((p) => {
                const selected = p.key === value;
                const conn = p.connected && !disconnected.has(p.key);
                return (
                  <button
                    key={p.key}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onChange(p.key);
                      setOpen(false);
                    }}
                    className="hover:bg-accent-blue/[0.06] flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left outline-none"
                  >
                    <PlatformGlyph platform={p.key} className="size-5" />
                    <span className="min-w-0 flex-1">
                      <span className="text-ink block truncate text-sm font-medium">{p.label}</span>
                      <span className={cn("block text-[11px]", conn ? "text-brand-green" : "text-ink-muted")}>
                        {conn ? "Connected" : "Not connected"}
                      </span>
                    </span>
                    {selected && <Check className="text-accent-blue size-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------------------- connection strip ---------------------------- */

/**
 * Compact, consistent identity row shown for every connected platform: glyph,
 * name, a "Connected" pill, and the balance/handle. Disconnect is tucked into a
 * quiet "⋯" menu (with a confirm) rather than a prominent header button.
 */
function ConnectionStrip({
  platform,
  onDisconnect,
}: {
  platform: ReturnType<typeof platformByKey>;
  onDisconnect: () => void;
}) {
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="mt-5 flex items-center gap-3 rounded-2xl border border-black/[0.08] bg-white px-4 py-2.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-black/[0.03]">
        <PlatformGlyph platform={platform.key} className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-ink text-[15px] font-bold">{platform.label}</p>
          <StatusPill tone="good" dot>
            Connected
          </StatusPill>
          {platform.balance && (
            <span className="text-ink-muted inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-2.5 py-0.5 text-xs font-medium">
              <Wallet className="size-3.5" />
              {platform.balance}
            </span>
          )}
        </div>
        <p className="text-ink-muted mt-0.5 text-[13px]">{platform.handle}</p>
      </div>

      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setMenu((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={menu}
          aria-label={`${platform.label} connection options`}
          className="text-ink-muted hover:text-ink hover:bg-black/[0.05] grid size-9 place-items-center rounded-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent-blue/40"
        >
          <MoreHorizontal className="size-5" />
        </button>
        {menu && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMenu(false)} aria-hidden />
            <div
              role="menu"
              className="absolute right-0 z-40 mt-1.5 w-56 overflow-hidden rounded-xl border border-black/[0.08] bg-white p-1 shadow-lg shadow-black/[0.08]"
              style={{ animation: `scale-in 150ms ${EASE_OUT} both`, transformOrigin: "top right" }}
            >
              <Link
                href="/connect-platforms"
                role="menuitem"
                onClick={() => setMenu(false)}
                className="text-ink hover:bg-accent-blue/[0.06] flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none"
              >
                <Settings2 className="text-ink-muted size-4" />
                Manage connection
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenu(false);
                  setConfirm(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-red-500 outline-none transition-colors hover:bg-red-50"
              >
                <Unplug className="size-4" />
                Disconnect {platform.label}
              </button>
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirm}
        title={`Disconnect ${platform.label}?`}
        message={`You will stop receiving ${platform.label} activity here until you reconnect.`}
        confirmLabel="Disconnect"
        onConfirm={() => {
          setConfirm(false);
          onDisconnect();
        }}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
}

/* --------------------------------- tabs ----------------------------------- */

function TabBar({
  tabs,
  active,
  onChange,
  unread,
}: {
  tabs: TabKey[];
  active: TabKey;
  onChange: (t: TabKey) => void;
  unread: number;
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [bar, setBar] = useState({ left: 0, width: 0 });

  // Measure the active tab and slide the underline to it. On first mount the
  // underline grows in under the active tab (width 0 -> full); on tab change it
  // slides across.
  useEffect(() => {
    const el = refs.current[active];
    if (el) setBar({ left: el.offsetLeft, width: el.offsetWidth });
  }, [active, tabs]);

  return (
    <div className="relative mt-5 flex gap-6 border-b border-black/[0.08]">
      {tabs.map((t) => {
        const isActive = t === active;
        return (
          <button
            key={t}
            ref={(el) => {
              refs.current[t] = el;
            }}
            type="button"
            onClick={() => onChange(t)}
            className={cn(
              "relative flex items-center gap-2 pb-3 text-sm font-medium transition-colors outline-none",
              isActive ? "text-accent-blue" : "text-ink-muted hover:text-ink"
            )}
          >
            {TAB_LABELS[t]}
            {t === "inbox" && unread > 0 && (
              <span className="grid size-[18px] place-items-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                {unread}
              </span>
            )}
          </button>
        );
      })}
      <span
        aria-hidden
        className="bg-accent-blue absolute -bottom-px h-0.5 rounded-full"
        style={{
          width: bar.width,
          transform: `translateX(${bar.left}px)`,
          transition: `transform 250ms ${EASE_OUT}, width 250ms ${EASE_OUT}`,
        }}
      />
    </div>
  );
}

/* ----------------------------- connect state ------------------------------ */

function ConnectState({
  platform,
  onConnect,
}: {
  platform: ReturnType<typeof platformByKey>;
  /** When provided (Instagram), reconnect happens in place instead of routing away. */
  onConnect?: () => void;
}) {
  const body =
    platform.key === "instagram"
      ? `Once ${platform.label} is connected, you can publish reels and photos from here.`
      : `Once ${platform.label} is connected, your conversations and contacts show up here.`;
  return (
    <div
      className="grid flex-1 place-items-center rounded-2xl border border-dashed border-black/[0.12] bg-cream/40 p-10 text-center"
      style={{ animation: `fade-in 220ms ${EASE_OUT} both` }}
    >
      <div className="max-w-sm">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-white shadow-sm ring-1 ring-black/[0.05]">
          <PlatformGlyph platform={platform.key} className="size-9" />
        </span>
        <h3 className="text-ink mt-4 text-lg font-bold">Connect {platform.label} to start</h3>
        <p className="text-ink-muted mt-1 text-sm">{body}</p>
        {onConnect ? (
          <button
            type="button"
            onClick={onConnect}
            className="bg-brand-blue hover:bg-brand-blue-hover mt-5 inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold text-white transition-colors active:scale-[0.99]"
          >
            <Link2 className="size-4" />
            Connect {platform.label}
          </button>
        ) : (
          <Link
            href="/connect-platforms"
            className="bg-brand-blue hover:bg-brand-blue-hover mt-5 inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold text-white transition-colors"
          >
            <Link2 className="size-4" />
            Connect {platform.label}
          </Link>
        )}
      </div>
    </div>
  );
}
