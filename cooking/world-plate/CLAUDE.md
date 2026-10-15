@AGENTS.md

# World Plate — project guide for Claude

## Project overview
World Plate is an animation-rich recipe site showcasing famous dishes from around the world
(Japanese, Korean, Nepali, Italian, Indian, Mexican, Thai, French, Chinese, Middle Eastern),
each with a full, accurate recipe. Visitors browse, search and filter recipes, open a recipe with a
servings scaler, ingredient checklist and a step-by-step Cook Mode, save favorites and rate dishes.
Favorites and ratings are kept in the visitor's browser (localStorage) — the site is a static export with no
server, opened with VS Code Live Server.

## Skills — check before every task
Before starting any task, list the installed skills (`~/.claude/skills`, `../../.claude/skills`
relative to this repo's parent `Programming/`, and plugin skills) and read the SKILL.md of any skill
that matches the task. If a skill conflicts with the brief, ask the user before choosing.

Skills used on this project:
| Skill | What it is for here |
|---|---|
| `frontend-design` | Design plan pass (tokens, type, layout), copywriting voice |
| `impeccable` (+ `reference/craft-floor.md`) | Quality floor, one batched visual QA pass (desktop + mobile) |
| `animate`, `emil-design-eng`, `review-animations` | Curves, durations, springs, interruption, reduced-motion and hover gating |
| `transitions-dev` | Motion tokens; recipes for checkbox, like/heart pop, number pop-in |
| `vercel-react-best-practices` | RSC by default, no barrel imports, minimal client JS, dynamic imports |
| `web-design-guidelines`, `design:accessibility-review` | UI + WCAG 2.1 AA audits |
| `mobile-native` | 375px layout, `dvh`, tap highlight, hover gating on touch |
| `senior-backend` (references) | Schema/index design, backend security practices |
| `senior-security`, `claude-security` | Final security review |
| `engineering:testing-strategy`, `playwright-cli` | Vitest unit tests, Playwright E2E |
| `engineering:code-review` | Self-review before calling work done |

Decisions made with the user where skills conflicted with the brief:
- Body font: skill wins → **Instrument Sans** instead of Inter (Fraunces stays for display, standing in for the "Davinci" serif of the Structured reference).
- Motion density: brief wins → every section reveals on scroll, every card lifts on hover.
- Navbar: minimal flat bar (monogram + text links) per the Structured style; keeps a few nav links since the app needs them.
- Icons: Lucide (shadcn default), 1.5 stroke.

Note on the senior-* skills (senior-security, senior-backend, senior-frontend): their scripts and reference
docs are unfilled templates. The final security review used the built-in `security-review` skill instead.

## Technical decisions (keep these unless there's a reason to revisit)
- **Card → hero morph uses React `<ViewTransition>`** (shared `name`, `share="morph"`), not Motion `layoutId`:
  the App Router unmounts the old page before Motion can snapshot it. `layoutId` is used for in-page shared
  elements (nav pill, filter pills, carousel dots). View-transition names must be unique per page — see the
  `morph` prop on `RecipeCard`.
- **Motion is loaded lazily**: always use `m.*` components, never `motion.*` — `<LazyMotion strict>` in
  `components/motion/motion-provider.tsx` throws on `motion.*`. Features (`domMax`) load asynchronously.
- **Reduced motion without hydration mismatches**: `MotionConfig reducedMotion="user"` drops transform
  animations, but only for shorthand keys (`y`, `x`, `scale`), not `transform` strings — so server-rendered
  entrances use `y`/`scale`. Never branch `initial`/`style` on `useReducedMotion()` in components that render
  on the server (the server can't know the preference → hydration mismatch). Branching is fine in components
  that mount after interaction (menus, Cook Mode, toasts).
- **Above-the-fold entrances are pure CSS** (`.rise`, `.word` in globals.css, stagger via `--i`), so they play
  before hydration and don't delay LCP. Motion `<Reveal>` is for below-the-fold scroll reveals only.
- **Tailwind needs the Turbopack loader** in `next.config.ts` (`turbopack.rules["*.css"]`); without it no CSS is
  generated. `tw-animate-css` was removed (its `style` export condition doesn't resolve with this loader).
- **Images**: the custom loader (`lib/image-loader.ts`) lets Unsplash's CDN resize. Above-the-fold heroes use
  `loading="eager"` + `fetchPriority="high"` (Next 16 deprecated `priority`); allowed qualities are listed in
  `images.qualities`.
- **Fonts**: Fraunces with the `opsz` axis only (SOFT doubled the file size) and `preload: false`; Instrument
  Sans is preloaded.
- **Hex colours** live only in `app/globals.css`. Two unavoidable exceptions: `viewport.themeColor` in
  `app/layout.tsx` and `app/opengraph-image.tsx` (neither can read CSS variables).
- Registry gotcha: a Watermelon item rewrote `cn` imports to `from "cn"` and installed an unrelated npm package
  named `cn`. After any install, check that `cn` is imported from `@/lib/utils`.
- On Windows (OneDrive path), Node/Playwright scripts need Windows-style paths (`C:/...`), not Git Bash `/c/...`.
- **Static export for Live Server** (`output: "export"`, `trailingSlash: true`): `npm run build` writes `out/` and
  `scripts/copy-site.mjs` copies it to `../site`; `../index.html` (in `cooking/`) redirects there, so the site opens
  with VS Code Live Server — no Node server or port. `basePath` defaults to `/Programming/cooking/site` (Live Server
  root = the `GitHub` folder); override with `BASE_PATH`. `npm run dev` still serves at `/`.
  The copy script also flattens Next 16's nested segment-prefetch files (`__next.x/y/__PAGE__.txt` →
  `__next.x.y.__PAGE__.txt`) — without that, client navigations 404 and fall back to full page loads.
- **No runtime server**: SQLite/Drizzle is read only at build time. Favorites and ratings live in localStorage
  (`lib/local-store.ts`); /recipes filters in the browser (`lib/recipe-filter.ts`, mirrors `searchRecipes`).
  There is no newsletter, no server actions, no API routes, no session cookie and no response headers (CSP etc.).

## Tech stack
- Next.js 16 (App Router, Turbopack) + TypeScript (strict) + React 19
- Tailwind CSS v4 + shadcn/ui + Watermelon UI registry components
- Motion (`motion/react`) for all animation; Lenis for smooth scroll
- SQLite via `@libsql/client` + Drizzle ORM (switch to Postgres/Supabase/Turso by swapping the driver)
- Zod (server-side validation), Vitest (unit), Playwright (E2E)

## Commands
| Command | What it does |
|---|---|
| `npm run dev` | Dev server on http://localhost:3000 (runs `db:setup` first) |
| `npm run build` | Static export → `out/`, copied to `../site` for Live Server |
| `npm run lint` | ESLint |
| `npm run typecheck` | `next typegen && tsc --noEmit` |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright E2E: static build at `/` with `db/e2e.db`, served by `scripts/serve-static.mjs` on 3200 |
| `npm run db:generate` | Generate a Drizzle migration from `db/schema.ts` |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` |
| `npm run db:seed` | Idempotent seed from `data/recipes.seed.ts` |
| `npm run db:setup` | migrate + seed (runs automatically before dev/build) |
| `npm audit --omit=dev` | Production dependency audit: no high/critical allowed (dev-tooling advisories are tracked in README) |

## Folder structure
```
app/                     routes (Server Components by default)
  recipes/[slug]/        recipe detail
  cuisine/[name]/        cuisine page
  favorites/             saved recipes
components/ui/           shadcn primitives
components/watermelon/   Watermelon registry components (adapted, see README)
components/sections/     page sections (hero, carousel, grids, footer…)
components/motion/       motion primitives (Reveal, WordReveal, CountUp, Magnetic, Lenis + Motion providers, PageTransition)
components/recipe/       recipe-detail client widgets
db/                      schema.ts, client.ts, migrations/, queries/, seed.ts
data/                    recipes.seed.ts (source of truth for seed content), cuisines
lib/                     pure helpers (scaling, session, rate limit, validation)
tests/unit, tests/e2e    Vitest and Playwright
```

## Watermelon UI rules
- Install with `npx shadcn@latest add https://registry.watermelon.sh/r/<name>.json`.
- Prefer the `-base` variant (`<name>-base.json`) so components use our theme tokens.
- Never invent a component name — confirm it exists in `https://registry.watermelon.sh/r/registry.json` first.
- If nothing fits, build a custom component matching Watermelon's style (spring motion, rounded, token colors).
- Use Watermelon for components; use design skills for layout, typography, color and accessibility.
- Adapting installed source is expected; record every adaptation in the README table.

## Design rules ("Structured" gallery style — adopted 2026-10-15, replaces the cream/saffron look)
- Putty gallery wall (`#c4c3b6`) + black ink, bone cards (`#e7e5e4`), chalk footer. **No saturated colour, no shadows, no gradients.**
- Sections hard-cut between putty and a contrasting **`.room`** (ink on the light site, putty on the dark site). `.room` re-points the theme tokens, so content inside just uses `bg-background`/`text-foreground`/`bg-primary`.
- Theme tokens only. **No hex colors in components** — hex lives only in `app/globals.css` (+ the two exceptions above).
- Type: Fraunces = display serif (weights 400/500, tight negative tracking, `text-display` 94px titles, leading 0.84); Instrument Sans = utility grotesk. Only weights 400 and 500.
- Small uppercase museum labels via the `label-caps` utility (corner labels, metadata). Sentence case for headings and buttons.
- Shapes: cards/images 9px (`rounded-lg`), links/chips 2px, buttons are compact pills (`rounded-full px-[17px] py-[9px] text-sm`, black fill). Circular crops for feature imagery; `.hex` / `.hex-outline` for indicators and separators; `.notched` for the floating dish card.
- Header: monogram + small text links, flat bar with a hairline after scroll. The oversized "World Plate" wordmark is cropped at the viewport edge in the hero and footer.

## Animation rules
- Springs or strong ease-out (`--ease-out: cubic-bezier(0.23,1,0.32,1)`); UI micro-interactions ≤ 300ms.
- Motion is modelled on launchdarkly.com (recorded from the live site): `--ease-ld` = cubic-bezier(.22,.61,.36,1) for
  entrances (700ms; widgets rise 120px + fade, staggered, then drift via `.widget` / `.widget-float`), `--ease-morph` =
  cubic-bezier(.32,.72,0,1) for 350ms shape morphs (`.morph-shape`: stepper circle → filled square, marquee cards),
  `.line-reveal` / `.grow-bar` for charts, `.btn-swap` for the filled → outlined pill hover (300ms ease). Headlines
  rise in (`.rise`, hero lines staggered; wordmark `.letter`s). Page changes: old page lifts away, new page rises
  120px (`wp-page-out` / `wp-page-in`). Scroll-spy steppers use `useActiveIndex`.
- Everything moves: header chips `.drop-in`; links `.link-u` / `.link-u-group` (underline draws in); `.btn-swap` press +
  arrow nudge; mobile menu unrolls (clip-path) with staggered links. Scroll-driven CSS (`animation-timeline`, with
  graceful fallback): `.sd-img` photo settle, `.sd-rise`, `.rule-draw` hairlines, `.sd-hero-out`, `.sd-wordmark`,
  `.scroll-progress`. Image hover zooms use the `scale` property so they compose with `.sd-img`'s `transform`.
- Animate only `transform` and `opacity` (`clip-path` allowed for reveals; blur only on short hero entrances).
- `prefers-reduced-motion`: no parallax, floating, Ken Burns or layout morphs — simple opacity fades only.
- No animation hides or delays content for more than ~1s. Scroll reveals run once.
- Hover motion gated behind `(hover: hover) and (pointer: fine)`.
- Never `scale(0)`, never `ease-in`, never `transition: all`.

## Database rules
- Schema in `db/schema.ts`; every change goes through `npm run db:generate` → committed migration in `db/migrations/`.
- Seed is idempotent (upserts keyed by slug / natural keys). Content source: `data/recipes.seed.ts`.
- Typed query functions live in `db/queries/`. No string-built SQL — Drizzle query builder or `sql` tagged templates only.
- Favorites/ratings reference `session_id` (anonymous cookie). Keep `session_id` as the owner column so a `user_id` can be added later.

## Security rules
- Validate all external input (query strings, localStorage) and drop invalid values rather than throwing.
- Secrets only in `.env.local`; `.env.example` is committed; never hard-code keys.
- No response headers on a static host; if this is ever deployed behind a server again, restore CSP and the other security headers.
- No `dangerouslySetInnerHTML` with user content (JSON-LD uses escaped, static recipe data only).
- `npm audit` must show no high/critical issues.

## Code conventions
- Server Components by default; `"use client"` only for interactivity/animation leaves.
- Import directly from files — no barrel `index.ts` re-exports.
- Strict TypeScript; no `any`. Derive types from Drizzle/Zod schemas.
- Pure logic (scaling, formatting) in `lib/` with unit tests.
- Await `params`/`searchParams`/`cookies()` (Next 16 async request APIs). Use `proxy.ts`, not `middleware.ts`.

## Definition of done
- [ ] Relevant skills checked and followed
- [ ] `npm run lint`, `npm run typecheck`, `npm test` pass
- [ ] `npm run build` succeeds; `npm run test:e2e` passes
- [ ] Works on mobile (375px, no horizontal scroll) and desktop, light and dark mode
- [ ] Reduced motion tested
- [ ] `npm audit --omit=dev` shows no high/critical issues
- [ ] README and CLAUDE.md updated
