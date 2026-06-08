# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Next.js version

This repo runs **Next.js 16.2.6 with React 19.2** (App Router). APIs and conventions differ from older Next.js — read the relevant guide in `node_modules/next/dist/docs/` before writing framework code, and heed deprecation notices. See `AGENTS.md`.

## Design rules (follow strictly — see DESIGN_GUIDELINES.md)

This repo is the design source of truth maintained by a Lead UX Designer; developers ship the designs from here. On every screen, component, and string:

1. **Copy:** plain, short, human. **No em-dashes (`—`) or en-dash connectors** (use a period, comma, colon, or parentheses). No AI-slop words (seamless, elevate, effortless, robust, leverage, "in seconds", "your best X"), no hype, no rule-of-three padding. Match existing case: Title Case for nav/titles/buttons, sentence case for body and helper text. Buttons are verb + object ("Build Agent"). Avoid emoji in product UI. Indian number/₹ formatting.
2. **Design system first:** use only tokens from `globals.css` (no raw hex) and reuse existing `components/ui` + patterns. Match existing spacing/type/density. Design every state (default, hover, focus, active, loading, empty, error, disabled) and keep it accessible.
3. **UX:** one obvious primary action per screen; progressive disclosure (advanced behind a toggle); smart defaults; familiar patterns; feedback for every action; confirm destructive actions.
4. **Protect the backend:** `src/lib/api.ts` and `src/lib/server-api.ts` are contract code (never change request paths/params/response handling for design work). Keep design-only data behind `NEXT_PUBLIC_MOCK` or client-side (localStorage); flag off = real backend untouched. If a design needs new data, describe the shape and leave wiring to developers.
5. **Motion:** before building any animation, transition, hover/press state, or interaction, **use the `emil-design-eng` skill** (it has the rules and best practices for crisp, professional motion). Do not hand-roll animation from memory. Reuse the keyframes already in `globals.css`, keep motion purposeful and fast, and respect `prefers-reduced-motion`.

## Commands

```bash
npm run dev     # dev server at http://localhost:3000
npm run build   # production build (Node/SSR — not static export)
npm run start   # serve the production build
npm run lint    # eslint (flat config, eslint-config-next core-web-vitals + typescript)
```

There is **no test suite** and no test runner configured.

The frontend talks to a separate FastAPI backend. Set its URL via `NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:8001`). Without a running backend, server-rendered pages degrade gracefully (see `serverFetch`) and client calls error.

## Architecture

This is **TryThat.ai**, a "Content Studio" for realtors: list properties, generate marketing videos from property images, attach voiceover, and publish to social platforms (Facebook/Instagram).

### Stack
- Next.js App Router, **server-rendered** (the comment in `next.config.ts` notes it was migrated off static `output: "export"` so it can use middleware, cookies, and server-side fetches).
- **Tailwind v4** configured entirely in CSS (`src/app/globals.css`) — no `tailwind.config`. Brand design tokens (e.g. `bg-cream`, `text-ink`, `bg-brand-orange`, `bg-rail`) are defined in `@theme` blocks there. Use these tokens rather than raw hex.
- **shadcn** components (`src/components/ui/`), style `base-nova`, built on **`@base-ui/react`** primitives (not Radix). `cn()` from `@/lib/utils` merges classes.
- Path alias `@/*` → `src/*`.
- Icons: `lucide-react`. Spreadsheet parsing: `xlsx` (bulk upload).

### Auth — dual session storage (the central pattern)
The session is a bearer token + `org_id`, stored in **two places** that must stay in sync:
- **localStorage** (`rtai.token`, `rtai.org_id`, `rtai.org_name`, `rtai.role`) — read by the **client** API layer.
- **cookies** (`rtai_token`, `rtai_org`) — read by **middleware** and **server components** for SSR.

`setSession()`/`clearSession()` in `src/lib/api.ts` write both. `src/lib/auth.tsx` is the `AuthProvider`/`useAuth` client context that hydrates from localStorage on mount.

Route protection is layered:
- `src/middleware.ts` is the real guard — redirects unauthenticated requests to `/login` (and authenticated ones away from it) based on the cookie.
- `src/components/auth/auth-gate.tsx` is a client-side safety net only; it renders children during SSR and redirects on the client if the session is gone.

A 401 on an authed client request auto-clears the session and bounces to `/login?expired=1` (`handleUnauthorized` in `api.ts`).

### API layers — keep client and server separate
- **`src/lib/api.ts`** — the typed client for the browser. Single `request()` helper (timeouts, FormData uploads, `ApiError`, query params) plus the `api.*` namespaces: `auth`, `listings`, `channels`, `whatsapp`, `dashboard`, `notifications`, `places`, `video`. Reads the token from localStorage; **only usable client-side**. Most endpoints are org-scoped: `/api/v1/orgs/{org_id}/...`, with `org_id` injected by `requireOrg()`.
- **`src/lib/server-api.ts`** — server-only fetches (`getServerSession`, `serverFetch`, `serverListings`, `serverVideos`, `serverChannels`, `serverDashboard`). Reads the token from cookies, uses a short timeout, and **returns `null`/`[]` on any failure** so SSR never crashes when the backend is slow or down.

### Page pattern
Each route's `page.tsx` is a thin **server component** that (optionally) fetches initial data with `server-api`, then renders `<AppShell>` wrapping a **client component** that receives that data as `initial*` props and takes over for interactivity (e.g. `app/page.tsx` → `serverListings()` → `<MyProperties initialListings={...}>`). Pages reading URL search params wrap the client component in `<Suspense>`.

`AppShell` (`components/layout/app-shell.tsx`) = `AuthGate` + `IconRail` (far-left nav) + `TopBar` + a secondary sidebar + `<main>`. The sidebar defaults to `ContentStudioSidebar` (its `NAV` array is the source of truth for Content Studio routes) but accepts a `sidebar` prop override — the AI Team section passes `<AiTeamSidebar />`. `IconRail`'s `PRIMARY` items carry `href`s; it derives active state from the pathname (`/ai-team*` → AI Team, everything else → Content Studio).

### Components
- `components/ui/` — shadcn primitives (don't hand-edit unless intentional).
- `components/layout/` — shell chrome (rails, the two section sidebars, top bar, mobile nav, notifications).
- `components/property/` — listing flows: the add-property wizard (`list-your-property` chooser → `manual-form` / `voice-form` / `bulk-upload-form`), property cards, details, share/video modals, address autocomplete + Google map picker.
- `components/content/` — video creation flow, my-content/my-videos, analytics, connect-platforms, platform-content.
- `components/ai-team/` — the AI Team section (see below).

### Domain notes
- **Listings** come back from the backend with a very wide schema (`ListingItem` allows arbitrary extra fields). `src/lib/map-listing.ts` (`listingToProperty`) narrows a backend listing into the UI `Property` shape (`src/lib/properties.ts`). `properties.ts` also holds demo seed data gated by `SEED_COUNT` (0 = empty state).
- **Video generation** is async with polling: create generation → upload images → trigger → poll `status` (pending/processing/completed/failed) → optionally `addAudio`. The sidebar `VideoGeneratingCard` polls the latest generation (fast 2s while active, 12s idle) and treats generations older than 20 min as stuck.
- **Instagram reels** are a 3-step publish flow: create container → poll status → publish (see `api.channels.instagram*`).
- **Bulk upload** progress is tracked client-side in localStorage via `src/lib/bulk-upload.ts` (note `bulkProcessed` *simulates* progress over ~50s).
- Images are served `unoptimized` (next.config); allowed remote hosts are `images.unsplash.com` and `**.amazonaws.com` (presigned S3 URLs for listing/video media).

### AI Team section (`/ai-team`)
A self-contained, **frontend-only** feature (no backend — fits the mock design mode) for building voice/chat AI agents tuned to Indian real estate.
- **Data & store:** `src/lib/agents.ts` holds the 5 agent templates (Lead Qualifier, Receptionist, Site-Visit Scheduler, Feedback, Payment) + a custom template, the voice catalog, option lists, a localStorage store (`tt_agents`, same pattern as `bulk-upload.ts`), and the **`readiness()`** scorer. Readiness is deliberately weighted so the *knowledge base* is ~60% of the 0–100 score — the meter teaches users that feeding the agent their projects/docs/FAQs is what makes it capable.
- **Routes:** `/ai-team` (gallery — `LaunchAgents`), `/ai-team/build/[template]` (`AgentBuilder` — single-page builder + sticky live preview), `/ai-team/agents` + `/ai-team/agents/[id]` (`AgentsList` / `AgentDetail` — manage + interactive test-chat + web-widget embed), `/ai-team/knowledge` (`KnowledgeBase` — education page).
- **Shared UI:** `components/ai-team/agent-ui.tsx` — `AgentOrb` (animated conic-gradient orb; keyframes `agent-orb-spin`/`agent-eq` in globals.css), `ReadinessMeter`, `ChannelBadge`.
- The builder pulls real projects from `MOCK_LISTINGS`, previews the voice via the browser `speechSynthesis` API, and the test-chat uses a keyword responder (`respond()` in `agent-detail.tsx`) that gets "smarter" when knowledge is attached. Same agent config drives both a voice agent and a website chat widget (toggle in the builder's Channels section).
