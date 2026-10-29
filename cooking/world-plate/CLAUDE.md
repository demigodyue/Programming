@AGENTS.md

# Sizzle Atlas — project guide for Claude

## Project overview
Sizzle Atlas is an animation-rich recipe site showcasing famous dishes from around the world
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
- Body font: ~~skill wins → Instrument Sans instead of Inter (Fraunces for display)~~ — superseded 2026-10-19 by the
  Cult Eats restyle (below): Anton display, Barlow Condensed UI labels/buttons, Inter body.
- Motion density: brief wins → every section reveals on scroll, every card lifts on hover.
- Navbar: ~~minimal flat bar (monogram + text links)~~ — superseded 2026-10-19 by Slush's pill nav (below).
- Icons: Lucide (shadcn default), 1.5 stroke.
- Motion (2026-10-19): the user asked for slush.app's exact animations, transitions and mobile behaviour. Slush's six
  candy colours are allowed **only in motion moments** (page-swing panels, button back faces, tab frame behind a
  sliding photo) — the user chose this over neutral tones. Slush's timings win over "no animation delays content
  >1s" (the home tagline rises at 1.5s; a new page's entrance waits ~1.65s for the swing). The header became Slush's
  pill nav (logo circle, flip pills, plus/minus, dark "Search" pill) because its motion needs discrete pills.
- Look (2026-10-19, latest): the user asked for the **Agence Foudre** style from Refero (styles.refero.design/style/c1534c74…)
  on every page, with the **cream canvas** (replacing the orange they had asked to keep) and **all current motion kept**.
  See "Design rules". Superseded the Cult Eats look below, which superseded "Structured".
- Look (2026-10-19, earlier): the user asked for the Cult Eats app's changes (`../a/cult-eats`, an Impossible
  Foods poster style) on Sizzle Atlas. They chose the **full Cult Eats style** (burnt-orange canvas + gold headlines, Anton
  caps, red 15px pills, burgundy cards, blob-cut photos) and to **keep Slush's motion and add Cult Eats' effects** on top
  (floating food icons + photos, mouse depth, scroll progress, tilted marquee bands, image zoom, clip-path reveal).
  Slush's candy colours are remapped into the palette (names kept); Slush's timings are unchanged.

Note on the senior-* skills (senior-security, senior-backend, senior-frontend): their scripts and reference
docs are unfilled templates. The final security review used the built-in `security-review` skill instead.

## Technical decisions (keep these unless there's a reason to revisit)
- **Page transitions are a hand-run view transition, not React `<ViewTransition>`.** `components/motion/page-swing.tsx`
  takes over internal link clicks in the capture phase (`preventDefault` makes next/link skip its own navigation),
  calls `router.push` inside `document.startViewTransition` and animates the root old/new snapshots and three panel
  groups with WAAPI keyframes sampled from Slush's GSAP timeline. Don't add React `<ViewTransition>` boundaries —
  React would start competing transitions. The update callback polls the URL with `setTimeout` (rAF doesn't fire
  while a view transition captures). `data-load` on `<html>` shifts the new page's CSS load clock (`--load-start`,
  `--load-delay`). `layoutId` is still used for in-page shared elements (filter pills).
- **Motion is loaded lazily**: always use `m.*` components, never `motion.*` — `<LazyMotion strict>` in
  `components/motion/motion-provider.tsx` throws on `motion.*`. Features (`domMax`) load asynchronously.
- **Reduced motion without hydration mismatches**: `MotionConfig reducedMotion="user"` drops transform
  animations, but only for shorthand keys (`y`, `x`, `scale`), not `transform` strings — so server-rendered
  entrances use `y`/`scale`. Never branch `initial`/`style` on `useReducedMotion()` in components that render
  on the server (the server can't know the preference → hydration mismatch). Branching is fine in components
  that mount after interaction (menus, Cook Mode, toasts).
- **Above-the-fold entrances are pure CSS** (`.hero-content`, `.load-chars`, `.load-stagger`, `.load-fade`, `.home-sub`,
  `.roll` in globals.css, stagger via `--i`), so they play before hydration. Scroll reveals are CSS animations paused
  until `ScrollMotion` adds `data-in` (`[data-reveal="slant|lines|cards|intro"]`); without JS they simply play.
- **Builds use webpack** (`next build --webpack`, `next dev --webpack`, and the Playwright webServer). Windows Smart
  App Control on the dev machine blocks Next's unsigned native compiler (@next/swc-win32-x64-msvc), so Next falls back to
  its WebAssembly compiler, which only webpack can use. Tailwind therefore runs through PostCSS (`postcss.config.mjs`,
  `@tailwindcss/postcss`), not a Turbopack loader. Don't turn Smart App Control off to get Turbopack back (it can't be
  turned on again without reinstalling Windows). `tw-animate-css` was removed earlier (export-condition issues).
- **Images**: the custom loader (`lib/image-loader.ts`) lets Unsplash's CDN resize. Above-the-fold heroes use
  `loading="eager"` + `fetchPriority="high"` (Next 16 deprecated `priority`); allowed qualities are listed in
  `images.qualities`.
- **Fonts (2026-10-29)**: Archivo (variable, wdth axis) for display, set weight 800 at wdth 112 on h1–h4 and
  .font-display (globals.css; display sizes were scaled down for the wider letters); Plus Jakarta Sans for everything else; Dela Gothic One + Noto Sans JP for
  Japanese (loaded on demand). `<em>` in display type is a colour switch. The footer has no giant wordmark any more:
  a sign-off line (.foot-signoff) and Back to top. No photo-credit line (Unsplash licence doesn’t require one).
- **Step icons**: StepIcon is an <img> of a Fluent Emoji 3D picture (public/icons/steps/*.webp, MIT); per-action
  CSS movement (.step-icon--*, wp-step-* keyframes) on [data-active].
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
- **English + Japanese (2026-10-20)**: every page carries both languages. `<T en ja>` (`components/i18n.tsx`) renders
  two `[data-l]` spans; unlayered CSS hides the one not matching `<html data-lang>` (the shown one is
  `display: contents`, so wrappers never affect layout). It works in server components and never flashes: the
  `LANG_INIT` head script in `app/layout.tsx` sets `data-lang`/`lang` before paint (localStorage `wp:lang`, else
  the browser language). Attributes CSS can't swap (aria-label, alt, title) use `useT()` from `lib/lang.ts` in
  client components, and `LImage` for alt text. `SlantText`/`ScrubWords`/`SlideBand` take a `ja` prop; Japanese copy
  marks phrase breaks with "|" (no spaces), and ScrollMotion only scrubs the shown language's words. Recipe and
  cuisine Japanese lives in `data/recipes.ja.ts` / `data/cuisines.ja.ts`, keyed by slug, with ingredients and steps
  lined up **by position** with the English seed (`tests/unit/i18n-data.test.ts` checks counts and section names).
  A new recipe needs its Japanese edition too. Japanese copy style (reviewed 2026-10-22 against Japanese sources):
  asides go in （）, never ——; Korean names follow Japanese usage (마복림 → マ・ボンリム); "Cuisines" is 各国料理, "kitchens"
  is 食文化; story facts are checked before they ship (both languages tell the same facts). Queries attach it as `.ja`. Japanese quantities: `formatQuantityJa`
  (spoons first, a counter after counted items, default 個). Fonts: Dela Gothic One under Anton and Noto Sans JP
  under Inter (`preload: false`). Don't stack two next/font instances of one family for different weights: they
  share a family name, so the browser mixes the weights.
- **Accounts (2026-10-20)**: Firebase Auth (email/password) + Firestore Lite, called from the browser
  (`lib/account/`). `store.ts` is the external store (`off | loading | out | in`); the SDK is a dynamic import,
  loaded on /account, on form submit, or when the `wp:signed-in` hint says this browser was signed in last time.
  While signed in, the localStorage favourites are the account's: merged in at sign-in (`mergeFavorites`, guest list
  first), written back 500 ms after a change (not while the sign-in merge runs), cleared at sign-out. Config is
  `NEXT_PUBLIC_FIREBASE_*` in `.env.local` (public by design); `firestore.rules` limits `users/{uid}` to its owner.
  The E2E specs set localStorage `wp-account-demo=1` to use `demo-backend.ts` (localStorage, plaintext passwords,
  test-only). The account panels use enter-only keyed animations: an `AnimatePresence mode="wait"` exit can stall
  before Motion's lazy features load, leaving the panel blank.
- **Transitions added 2026-10-22**: shared photo (page-swing names the clicked `[data-vt-photo]` and the new page's
  `[data-vt-hero]` `wp-photo`; an old recipe page's own hero is marked `data-vt-old` so names never repeat, and the
  hero's `.load-fade` is switched off so the landed photo isn't dimmed). `lib/circle-reveal.ts` (language + theme;
  it stands aside while `data-swing` is set). Every WAAPI animation on view-transition pseudo-elements is cancelled
  when its transition finishes: `fill: "both"` would otherwise re-apply its end state to the next transition's
  pseudo-elements (the old page vanished under the circle reveal). `lib/fly.ts` (ingredient chips, saved-recipe
  heart). `.card-rise` / `.hero-zoom` are CSS view timelines.
- **Header + search (2026-10-22)**: the nav is full width (logo at the left edge, menu at the right edge, not
  `container-page`), with the account circle last. `HeaderSearch` gets its dish list from `app/layout.tsx` (an async
  layout querying at build time). The box stays mounted and animates with CSS (`.nav-search[data-open]`), not
  AnimatePresence. All search text goes through `fold()` (`lib/recipe-filter.ts`: lower case, Latin accents
  dropped, kana kept). Before Motion's lazy features load, an AnimatePresence exit never runs: `useMotionReady()`
  (motion-provider.tsx) lets RecipeBrowser swap its list in place until then (otherwise filtered-out cards linger).
  RecipeBrowser also ignores late URL reports that no longer match `location.search`.
- **Country search (2026-10-26)**: both search indexes (app/recipes/page.tsx and app/layout.tsx) add the cuisine's
  name and country in both languages plus aliases from `lib/places.ts` (`placeWords`), and the recipe's origin. Only
  add aliases the data doesn't already contain as a substring. The header search also lists matching cuisines
  (`SearchPlace`, up to 2) before dishes, linking to /cuisine/<slug>.
- **Recipe kitchen (2026-10-20)**: `lib/step-info.ts` reads each English step for its action (the earliest verb
  wins → `StepIcon`) and its timings (`parseDurations`: a range's first value, 10 s–6 h). Timers live in a module
  store in `step-timer.tsx`, keyed `slug:step:index` and shared with Cook Mode. The pot (`MisePot`) is drawn full
  and lowered by `--fill`; ticked names fly in with WAAPI (`flyIntoPot`). Rows and steps reveal via
  `[data-reveal="rows"|"step"]`.

## Tech stack
- Next.js 16 (App Router, webpack builds) + TypeScript (strict) + React 19
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
  account/               sign in / create account / profile
components/ui/           shadcn primitives
components/watermelon/   Watermelon registry components (adapted, see README)
components/sections/     page sections (hero, carousel, grids, footer…)
components/motion/       Slush motion (PageSwing, ScrollMotion, SlantText, HeadingReveal, CardReveal, LetterRoll, FlipFace, ScrollMarquee, Cursor), Cult Eats MouseDepth + Lenis/Motion providers
components/recipe/       recipe-detail client widgets (kitchen, step icons, timers, Cook Mode)
components/account/      account panel, header button, favorites note, boot
components/i18n.tsx      <T>, Minutes, Difficulty (+ i18n-image.tsx LImage, lang-toggle.tsx)
db/                      schema.ts, client.ts, migrations/, queries/, seed.ts
data/                    recipes.seed.ts (source of truth for seed content), cuisines, *.ja.ts (Japanese editions)
lib/                     pure helpers (scaling, validation, step-info), lang.ts, account/ (Firebase + demo backends, store)
tests/unit, tests/e2e    Vitest and Playwright
```

## Watermelon UI rules
- Install with `npx shadcn@latest add https://registry.watermelon.sh/r/<name>.json`.
- Prefer the `-base` variant (`<name>-base.json`) so components use our theme tokens.
- Never invent a component name — confirm it exists in `https://registry.watermelon.sh/r/registry.json` first.
- If nothing fits, build a custom component matching Watermelon's style (spring motion, rounded, token colors).
- Use Watermelon for components; use design skills for layout, typography, color and accessibility.
- Adapting installed source is expected; record every adaptation in the README table.

## Design rules ("Agence Foudre" magazine style — adopted 2026-10-19, replaces "Cult Eats")
- Colours (2026-10-19: the user disliked the Foudre pinks, then the near-white canvas, and left both choices to
  Claude): Butter `#f6e3b4` canvas, Warm White `#fff8ec` cards, toasted hairlines `#d4b46e`, Tomato `#c2321b` display type and the round nav dots, Forest Ink `#00522d` body text, links and buttons, Sand
  `#f3e6d4` cards/tags/footer wash, Saffron `#f4b942` highlights, warm tan `#dcc6ab` hairlines, Paprika `#e0603f` /
  Sage `#b7cdb0` only in motion moments and the jar. Black only for line art. Flat. No pink anywhere.
- Buttons are forest with cream text. `.room` bands are forest with saffron headlines (light site) and flip to cream with
  tomato headlines (dark site, whose canvas is forest).
- Type, two families: Anton for display (standing in for Beni 900; uppercase, tracking 0, leading 0.92 because Anton's caps
  are 0.86em tall — Foudre's 0.70 would collide) and Inter for everything else (standing in for Clash Grotesk), buttons in
  sentence case, `label-caps` uppercase 13px.
- Shapes: buttons/badges 10px, cards 20px, elevated 25px, tags and icon buttons fully round. Photos are plain rectangles
  (no blob masks). Nav: 50px tomato dots (logo, theme, menu) plus Slush's pills.

### Previous: "Cult Eats" / Impossible Foods poster style (2026-10-19, superseded)
- Light: burnt-orange canvas `#8b3a10` with **gold** headlines `#fdae2d` (red on orange is only ~1.6:1). Dark: velvet wine
  `#260212` with **red** headlines `#e10600` (~3.9:1). Burgundy cards `#4f0423`, blush secondary text `#ffc7c6`, white body
  text, black hairlines and footer. Red `--primary` for every action. **No other hues, no shadows, no gradients.**
- `.room` sections flip canvas: wine (red headlines) on the light site, ember (gold headlines) on the dark site. It re-points
  the tokens including `--headline`, so content just uses `bg-background` / `text-foreground` / `text-headline` / `bg-primary`.
- Theme tokens only. **No hex colors in components** — hex lives only in `app/globals.css` (+ the two exceptions above).
- Type: Anton for h1–h4 and `.font-display` — uppercase, 0.03em tracking, h1/h2 in `--headline`; `text-display` up to 132px
  with leading 0.92 (Anton's caps are 0.86em tall, so tighter leading collides). Barlow Condensed for `label-caps`, buttons and
  the cursor label (uppercase). Inter for body copy.
- Shapes: cards 12px (`rounded-lg`), buttons / toggles / chips 15px (`rounded-md`), feature card 38px (`rounded-3xl`).
  Feature and decorative photos are blob-cut (`mask-blob-1…4`), never circles; rectangles only inside cards.
  `.hex` / `.hex-outline` stay as indicators.
- Header: Slush-style floating pill nav (burgundy ghost pills, red "Search"). The oversized "Sizzle Atlas" wordmark (gold/red)
  sits at the foot of the hero and footer.

## Animation rules (modelled on slush.app — recorded from its GSAP scripts and CSS, 2026-10-19)
- Two eases only, copied exactly: `--ease-slush` = cubic-bezier(.65,.05,0,1) (GSAP default, tab swaps, hovers, links)
  and `--ease-slush-bounce` = Slush's elastic `linear()` (peaks 1.142) for every entrance and press. JS twins live in
  `components/motion/slush-ease.ts`. Don't invent new curves or durations — look up Slush's value.
- Page load (runPageLoad): `.hero-content` fades in at `--load-delay` (0.1s); `SlantText mode="load"` chars slide from
  -0.25em, last character first, 15ms apart, 0.65s; `.load-stagger` blocks rise 3em, +0.5s, 0.1s apart, 1s; `.load-fade`;
  `.load-pop` (sticker pop). Home only: `LetterRoll` wordmark (1.25s slices, 0.15s apart) and `.home-sub` (2em, 1.5s, 0.3s apart).
- Page swing (runTransition): see Technical decisions. Reduced motion: crossfade (0.525s out / 1s in).
  2026-10-20: a cookbook page-turn replacement was tried and rejected ("I like the previous style, just change some
  animations"), so Slush's swing stays with Sizzle Atlas changes: the tracks gained rz (tilt, deg) and y (drop, vh) —
  the old card lifts -3vh / tilts -2.5° while shrinking, then is tossed down-left (rz -14°, y 14vh); the new card
  tilts in (rz 12°, y 12vh → 0); the panels arc and tilt too and carry SectionArt engravings (forest ink on the light
  panel colours, cream on the strong ones). Then "smooth and a bit fast": the timeline plays 1.6× faster (~1.3s;
  load clock 0.95s / 1.05s) on a smooth in-out ease instead of slush-bounce, and the drop shadow was dropped (a full-
  screen blur every frame). The update callback
  waits for the URL and for <main>'s content to be swapped before the swing starts.
  Then "same style, different animation": the sideways swing became a **card cascade** (same cards, panels and
  colours; tracks also gained rx): the old card falls out of the bottom tipping back, the three engraved panels tumble
  down past the middle 0.08s apart, the new card drops in from the top (drawn over the old one — new(root) z 2) and
  comes forward to full screen; 1.35s of timeline played 1.3× faster (~1.04s), no slush-bounce. Everything flows downward so no two cards cross. y offsets
  are applied far back in 3D (z -100vw → ~40% on screen), so "off-screen" is OFF = 260vh. The forest panel colour
  is never used (it would vanish into the forest backdrop). Load clock 0.65s / 0.73s.
- Scroll (ScrollTrigger "top 80%", once): `SlantText` (display titles), `HeadingReveal` (lines tip in from rotateY -45°,
  0.15s apart, 0.85s), `CardReveal` (x 5em, z 20em, rotateY -30°, scale .75, row spread 0.2s, perspective 1000px),
  `data-reveal="intro"` (showcase: y 40%, scale .75, 1.2s, at 50%). Parallax via `data-parallax` attributes (ScrollMotion).
- `ScrollMarquee`: duration = speed × (strip ÷ viewport) × 1/.5/.25; direction follows scroll; track drifts ±10vw.
- Hover: `.btn-flip` + `<FlipFace>` (3D flip to a `data-accent` back face, press 0.955), `.nav-circle` spins 90° (logo 360°, 1s),
  `.tile-press` sinks to .92, `.link` / `.link-group` underline (0.4s), `.text-link` + `<TextLinkLine>` sweep (0.75s),
  `Cursor` label over `[data-cursor="…"]` (text = attribute value; ≥768px, fine pointers).
- Nav: pills hide upward on scroll down (desktop), slide in from the right via the plus (≤991px); 10px direction threshold.
- Tabs (TrendingDishes): Flip pill 0.5s; text/photo swap 0.65s on "slush"; auto-advance to tab 2 at "center 75%".
- Home from the About section down (2026-10-20): AboutPanel, TrendingPanel, CuisinePanel, QuickPanel, CtaPanel
  (components/sections/home-panels.tsx, trending-panel.tsx, cuisine-panel.tsx, quick-panel.tsx). About: "A kitchen atlas" headline, short ScrubWords pitch,
  CountUp stats (dishes, cuisines, avg. hours), button, and three endlessly running photo columns (.about-cols; middle
  reversed; paused on hover/focus; still for reduced motion). The stacking-panel transition was tried and dropped
  (user: "make it new… like text going from left to right after scrolling"), and so was giving every section the same
  slide-in (user: "add different scroll animation and transition in each section"). Each section now moves its own
  way, scrubbed by ScrollMotion's `[data-progress]` → `--p` (0 → 1 between data-progress-start / -end; unset without JS
  or with reduced motion, so every CSS fallback is the finished state; see "The --p scrubs" in globals.css):
  - Trending: SlideBand (components/motion/slide-band.tsx) — a giant headline sliding left to right while an outlined
    copy slides the other way (data-parallax with data-parallax-axis="x", xPercent -38 → -4; the h2 is sr-only). Each
    row's rule draws across and its title rises out of a mask, staggered by --k; the photo window opens (clip inset)
    and zooms out. Hover/focus still wipes that dish's photo in.
  - Cuisines (#cuisines, client component): pinned card stack (280svh; user: "change it to card stack and open with
    scroll" — the sideways gallery was dropped). All ten cards start piled in the middle of the grid, each leaning
    (TILT), and deal out top card first to a 5 × 2 grid (2 × 5 on phones): each li translates by its measured
    --dx/--dy (pile centre minus slot) × (1 − --o) and rotates by --t × (1 − --o). Focusing a card while the stack is
    closed scrolls to the open grid. Fallback: the open grid.
  Everything after Cuisines was redone again on request ("redo after this"; the circle wipe / 3D tiles / growing
  window were dropped):
  - Quick meals (client component): pinned zoom-out (260svh). The first dish starts as a full-screen photo under a
    giant "Dinner in 30 minutes" and shrinks into its grid slot — uniform scale + translate from --dx/--dy/--s, which
    the component measures (stage centre vs. slot, scale to cover); the other three rise in, the heading slides down.
  - CTA: pinned stove (220svh; user asked for "animation of stove and cooking" instead of the photo-filled text).
    StoveScene (components/sections/stove-scene.tsx) is an original inline SVG, made realistic on request: a gas
    range — black hob, stainless front with four chrome knobs, oven door with handle and glass — with two GasBurners
    (components/motion/gas-burner.tsx, shared with the intro pot: drip bowl, metal crown, cast-iron grate, 16 blue
    jets) and a shaded skillet with a wooden handle and an oil sheen. --lit (from --p) turns the live knob and grows
    the front burner's jets (.stove .gas-burner__jets); the cooking loop (flame flicker, pan toss,
    food arcing out and back, steam, spitting oil) has its amplitudes / opacity tied to --lit so nothing moves until
    the flame is up. "Cook tonight" rises out of a mask line by line, then the line and button. Reduced motion: lit
    and still.
  The hero exit and footer .foot-rise letters are unchanged.
- Background artwork (2026-10-20; idea from the Pa'lais Refero style the user shared — "one image which goes from
  top to bottom", drawings our own): PageArt (components/page-art.tsx) is the first child of <body> (relative,
  isolate), absolute behind everything at z -1. It paints one 1440 × 3600 tile repeating down the page: public/art/
  blobs.svg (palette blobs + paprika brush strokes) under public/art/grain.svg (faint feTurbulence paper fibres),
  both on ::before (40% in dark mode), and public/art/lines.webp — real engravings, not drawn by us: the user
  rejected hand-coded SVG drawings ("not aligned properly", "realistic ones"). They are public-domain Pearson Scott
  Foresman line art from Wikimedia Commons (PD-ScottForesman), kept cleaned in scripts/art-src/*.ink.png (ink only,
  trimmed, ≤900px) and composed by scripts/make-page-art.mjs into a 2× 2880 × 7200 tile (webp, ~0.7 MB) down the outer
  bands. Used as a mask on ::after filled with 44% of --foreground, so it follows the theme. Coloured sections get the
  same engravings via SectionArt (components/section-art.tsx; the section is `relative isolate`, the layer z -1):
  the intro panel (z 0 over its slats), About, Cuisines, Quick meals, Cook tonight, the hero's widget wall, the recipe
  story and the footer, ink = the
  section's currentColor at 42% (58% on the intro), each starting at a different tile offset. Below 48rem the tile is shown at 100%
  width. To swap a drawing: drop a PNG/JPG in art-src (it is cleaned on the next run) and edit `place`. Drawings stay
  in the outer bands; below 48rem the tile is 150% wide (centre crop). Regenerate with node scripts/make-page-art.mjs.
  Sections with their own colour cover it; the Trending panel dropped its bg-background so the art shows through.
- Intro curtain (2026-10-19, recorded from kervangida.com; that site has no route transition, its transition is
  this first-load preloader): `IntroCurtain` (components/motion/intro-curtain.tsx, `.wp-intro` in globals.css). A
  full-screen `--dot` panel; the SIZZLE ATLAS wordmark fills left to right over its outline (2s linear, from 0.1s) —
  the user wants that picture kept as is. 2026-10-20 additions (user: "add some animation like the cooking stove …
  waits for user to scroll … scroll animation and transition"; a slot-reel / split version was tried and reverted):
  an original boiling pot under the wordmark (lid rattle, bubbles, steam on loop) — made realistic in two rounds
  (the second, 2026-10-20: cylinder shading with key light / specular streak / reflected light, polished-steel
  handles and lid rim, glossy black knob on a steel collar, water sheen, blurred vapour, a black-glass hob with the
  pot's reflection; GasBurner got graded translucent jets with a hot inner cone and glow, a ported aluminium crown
  and lit cast-iron grates; StoveScene got a cast-iron skillet, shimmering oil, round-shaded vegetables via CSS
  url(#stove-*) gradients, brushed stainless, knurled chrome knobs and tinted oven glass) — first round: a
  shaded enamel body, a domed enamel lid with a sheen, lip and turned metal knob, and a gas hob drawn below the
  240 × 210 box (overflow visible, so the zoom maths keyed to the box stay put): black top with knobs, cast-iron
  grate, metal burner crown and a ring of 16 blue gas jets (pale cores, orange tips) flickering, plus a blue glow — a "Scroll to start
  cooking" cue, and no automatic exit. The wheel / swipe / arrow, space and page keys drive --q (eased in JS,
  reversible): lid blows off + steam puffs (q 0 → 0.25), the wordmark lifts -28vh / scale 0.9 / fades (0.05 → 0.35),
  the pot travels to the screen centre and grows ×4 on a point 72% down its box (q 0.06 → 0.45, --pdx/--pdy measured
  in JS) — the user approved the motion up to this frame. Then the lid flies off screen (0.45 → 0.65) and the page
  opens out of the pot's mouth (0.5 → 1): a radial mask hole on .wp-intro, centred on the mouth, fills it exactly and
  widens exponentially until the page covers the screen (a version that zoomed the pot to fill the screen in green and
  faded was replaced). Click / Enter / Escape / Tab skip to open. Shown on every full load of the home page only:
  <html> starts with `data-intro` (pauses all page animation until q 0.5, so the hero's entrance plays as it opens) and `data-intro-lock` (overflow hidden; LenisProvider stops
  Lenis until "wp:intro-done"); the INTRO_SKIP head script in app/layout.tsx drops both before first paint off the
  home page, for reduced motion, or when localStorage "wp-intro-skip" is set (the page-swing spec sets it).
- Hungry Tiger scroll (2026-10-19, recorded from eathungrytiger.com via the user's Refero link): GSAP ScrollTrigger
  word scrub — each `.word` goes 0.2 → 1 opacity (0.2 long, 0.4 apart, power1.out), scrubbed "top 90%" → "top center".
  Ported into ScrollMotion as `[data-scrub="words"]` (`ScrubWords`, components/motion/scrub-words.tsx); it replaces the
  scroll-time SlantText / HeadingReveal on section titles, the manifesto, the trending title, the CTA, "Keep exploring" and
  "The story of this dish" (page-load SlantText titles are unchanged). Their pinned product stage (a jar Lottie that tumbles
  with scroll inside a container that rises, eases to 0.91×, tilts -10°, then shrinks away turning ~25°) is `DishStage`
  (components/sections/dish-stage.tsx) on the home page: an original Sizzle Atlas "House Masala" jar built in CSS 3D
  (`.jar` in globals.css, label art in public/jar-label.svg) tumbles through poses read off their frames and moves on
  the same container curve, passing in front of three ScrubWords headlines. Faces are shaded per frame from their turned
  normals (overlay opacity). Their jar, Lottie, branding and copy are not used.
- Cult Eats layer (2026-10-19): blob-cut hero photos float (`animate-float`, `.load-pop`, `data-parallax`). Floating
  food icons and, later, 3D food copied from a reference video were both tried and removed at the user's request. `MouseDepth` (components/motion/mouse-depth.tsx) moves every
  `[data-depth]` with the pointer (writes `transform`; ScrollMotion writes `translate`, so they compose). Scroll-driven CSS:
  `.scroll-progress` bar, `.scroll-zoom` card photos, `.clip-reveal` (trending photo frame) — unsupported browsers just skip them.
  The dish marquee is two tilted bands (red / burgundy). The tab highlight is a solid red pill behind the labels.
- Reduced motion: opacity fades only — no 3D, travel, parallax, marquee, letter roll, floating, mouse depth or scroll-linked
  zoom/clip/progress. Hover flips become colour swaps.
- Hover motion gated behind `(hover: hover)`. Never `transition: all`. Animate transform/opacity (+ clip-path for the swing).

## Database rules
- Schema in `db/schema.ts`; every change goes through `npm run db:generate` → committed migration in `db/migrations/`.
- Seed is idempotent (upserts keyed by slug / natural keys). Content source: `data/recipes.seed.ts`.
- Typed query functions live in `db/queries/`. No string-built SQL — Drizzle query builder or `sql` tagged templates only.
- Favorites/ratings reference `session_id` (anonymous cookie). Keep `session_id` as the owner column so a `user_id` can be added later.

## Security rules
- Validate all external input (query strings, localStorage, account documents) and drop invalid values rather than
  throwing: `cleanFavorites` / `cleanRatings` (lib/local-store.ts), `cleanShopping` (lib/shopping-list.ts).
- Secrets only in `.env.local`; `.env.example` is committed; never hard-code keys. (Firebase web config is public by design.)
- CSP lives in lib/csp.ts. It is a `<meta>` in app/layout.tsx (production only), hoisted to the top of each page by
  scripts/copy-site.mjs, and a real header on AWS Amplify (scripts/build-aws.mjs writes customHttp.yml with CSP_HEADER,
  which adds frame-ancestors, plus HSTS etc.). Any new third-party origin (script, style, font, image, connect, frame)
  must be added there deliberately. FRAME_GUARD stands in for frame-ancestors on hosts that can't send headers.
- **3D scenes (2026-10-29)**: three.js 0.180 (`lib/three/`): kit.ts (renderer, studio environment, grate, gas
  flames, steam, loop that pauses off screen), intro-pot.ts (driven by --q on .wp-intro), stove.ts (driven by the CTA
  section's --p). Both are dynamically imported (IntroCurtain, components/sections/stove-3d.tsx) and only start when
  `webglAvailable()` (failIfMajorPerformanceCaveat, so software WebGL, e.g. headless test browsers, keeps the SVGs).
  They set data-three, which hides the SVG fallback; with data-three the intro opens with a circular mask from the
  centre instead of the SVG pot-mouth mask. Everything is procedural (no model/texture files). The intro's q easing
  is time-based so it opens as fast on slow devices.
- Hosting: AWS Amplify, manual deploys (`npm run build:aws -- <https address>` → world-plate-aws.zip). Not Amplify's Git
  builds: they support Next.js 12–15 only. `npm run build` still writes ../site for Live Server.
- No `dangerouslySetInnerHTML` / `innerHTML` with user content (JSON-LD uses escaped, static recipe data; the flying
  heart/basket are fixed SVG strings; flying ingredient chips use textContent).
- firestore.rules allow-lists the user document's fields; a new saved field means updating the rules too. Favourites
  and rating keys must be in recipeSlugs() (generated with lib/recipe-slugs.ts by scripts/sync-recipe-slugs.ts in
  prebuild; slugs are only ever added). New recipes → the rules file changes → the owner must republish it.
- Security audit scripts (live Firebase, throwaway accounts): see the 2026-10-29 audit in README "Security".
- The localStorage demo account backend is only reachable when the build sets NEXT_PUBLIC_ACCOUNT_DEMO=1 (the E2E build).
- `npm audit --omit=dev` must show no high/critical issues (`overrides` pins a patched @grpc/grpc-js).
- Hex colours outside globals.css: the Google "G" logo's brand colours in components/account/account-panel.tsx.
- **Brand (2026-10-29): Sizzle Atlas** (formerly World Plate). The logo is the owner’s artwork (logo/*.jpg, navy
  background). public/brand/ holds cut-outs made from it (flood-fill of the navy from the edges): mark-*.webp (pan only,
  header) and lockup-light/dark-*.webp (full logo; light = navy lettering for cream pages). app/icon.png,
  app/apple-icon.png (on navy), app/opengraph-image.png and the jar badge (embedded PNG in public/jar-label.svg) come
  from the same art. Internal names stay world-plate / wp (folder, package, storage keys, CSS classes).

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
