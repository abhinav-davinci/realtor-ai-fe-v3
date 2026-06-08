# Design Guidelines

This repo is the source of truth for frontend design. The Lead UX Designer builds flows and screens here. Developers pick up components and completed designs from this repo and ship them to production.

Follow these rules on every screen, component, and string. They are not optional.

## 1. Voice and copy

Write like a helpful person talking to a busy realtor, not like marketing.

- Keep it short and plain. Say the thing in the fewest clear words.
- **No em-dashes (`—`) or en-dashes (`–`) used as connectors.** Use a period, comma, colon, or parentheses instead.
- Ban AI-slop words: seamless, elevate, unleash, effortless, robust, leverage, delve, supercharge, "in seconds", "game changer", "take it to the next level", "your best X".
- No hype and no rule-of-three padding. One real benefit beats three vague ones.
- Match the existing case convention for consistency (rule 2). This app uses Title Case for nav labels, page and section titles, and buttons ("Connect Account", "My Properties"). Use sentence case for body text, helper text, descriptions, and any conversational or chat copy.
- Buttons are a verb plus an object, one to three words. "Build Agent", "Add Project", "Save Draft".
- Avoid emoji in product UI. Use one only where a real teammate would, and rarely.
- Use Indian formatting for money and numbers: `₹1,25,000`, `₹2.4 Cr`, `1,450 sq.ft`.
- Write for the user, about their goal. Not about the product or the AI.

Good: "Books, confirms, and reminds for site visits so fewer people skip."
Avoid: "Seamlessly elevate your scheduling workflow — never miss a visit again!"

## 2. Design system first

- Use existing design tokens only. Colors (`cream`, `ink`, `ink-muted`, `accent-blue`, `brand-blue`, `brand-green`, `brand-orange`, `surface`), spacing, radius, and shadows live in `src/app/globals.css`. No raw hex in components.
- Reuse what exists before making something new. Check `src/components/ui` and existing patterns (cards, pills, stepper, modals, the radial gauge) first.
- Match the spacing, type scale, and density of current screens. New work should look like it always belonged.
- Design every state: default, hover, focus, active, loading, empty, error, disabled.
- Accessibility is part of the design: real labels, visible focus rings, hit areas of at least 40px, and readable contrast.

## 3. UX principles

- Make the next step obvious. One primary action per screen.
- Show the few things that matter first. Put advanced options behind a toggle (progressive disclosure).
- Fill in smart defaults and let users skip what they can.
- Prefer familiar patterns over clever ones. The user should not have to learn our invention.
- Give feedback for every action. Never leave the user guessing whether something worked.
- Be forgiving. Confirm destructive actions and allow a way back where possible.

## 4. Frontend is the source of truth, do not disturb the backend

This repo has real backend connected APIs. Design work must never break that flow.

- Treat `src/lib/api.ts` and `src/lib/server-api.ts` as contract code. Do not change request paths, params, methods, or response handling for visual work. The typed `api.*` client mirrors the backend contract.
- Keep design-only data behind the `NEXT_PUBLIC_MOCK` flag (mock layer in `src/lib/mock-data.ts`). With the flag off, the real backend flow is untouched.
- For a new flow that the backend does not serve yet, keep it client-side (localStorage, like `src/lib/agents.ts` and `src/lib/bulk-upload.ts`) and clearly note what a developer needs to wire up.
- If a design needs new data, describe the shape it expects. Do not invent or change API calls to make a visual work.

## 5. Motion and animation

Before building any microanimation, transition, or interaction, **use the `emil-design-eng` skill** (installed in Claude Code). It encodes Emil Kowalski's rules, protocols, and best practices for motion, and following it is what makes animation feel professional and crisp instead of arbitrary.

- Always load and follow that skill when adding or changing any animation, transition, hover or press state, enter or exit, drag, or scroll-linked effect. Do not hand-roll motion from memory.
- Animate only what helps the user understand a change (what moved, where it came from, where it went). Motion has a purpose or it is removed.
- Keep it fast and calm. Short durations, natural easing, no bounce unless the skill calls for it. Respect `prefers-reduced-motion`.
- Reuse the motion tokens and keyframes already in `globals.css` (`shimmer`, `float`, `twinkle`, `fade-in-up`, `agent-breathe`, `agent-wave`, and so on) before inventing new ones, so timing and feel stay consistent.

## Definition of done for a screen

Before a screen is considered ready:

1. Copy follows rule 1. No em-dashes, no slop.
2. Only design-system tokens and existing components or patterns are used.
3. Every state is handled (loading, empty, error included).
4. Keyboard and focus work, labels are present, contrast is fine.
5. Responsive from mobile to desktop.
6. Any motion was built with the `emil-design-eng` skill and respects reduced motion.
7. No backend contract was changed. Any new data is mocked behind the flag or stored client-side, with a note for developers.
