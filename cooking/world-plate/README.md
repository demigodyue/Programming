# World Plate

An animation-rich recipe site with famous dishes from ten cuisines, each with a full recipe: a servings scaler, an ingredient checklist, a step-by-step Cook Mode, favorites and star ratings.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, [Watermelon UI](https://ui.watermelon.sh), Motion, Lenis, SQLite + Drizzle ORM and Zod.

## Quick start

Requires Node.js 22.12 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000. `npm run dev` applies the migrations and seeds the database first, so there are no other setup steps. A `.env.local` is optional; copy `.env.example` if you want to change the defaults.

To view it with VS Code **Live Server**, keep `npm run dev` running and open `../index.html` (one folder up, in `cooking/`) with Live Server. That page opens the app as soon as the dev server responds. Live Server can't run the app by itself, because the app needs Node for its database, favorites and ratings.

Production build:

```bash
npm run build   # also migrates and seeds
npm start
```

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on http://localhost:3000 (runs `db:setup` first) |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types + `tsc --noEmit` |
| `npm test` | Vitest unit tests (servings scaling, formatting, database queries) |
| `npm run test:e2e` | Playwright: search → open recipe → save favorite (desktop + mobile). Builds the app and uses a separate `db/e2e.db` |
| `npm audit --omit=dev` | Audit production dependencies |

### Database

| Command | What it does |
|---|---|
| `npm run db:generate` | Create a migration from changes to `db/schema.ts` (commit the file in `db/migrations/`) |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` |
| `npm run db:seed` | Upsert recipes from `data/recipes.seed.ts`. Safe to run repeatedly: recipe ids are stable, so favorites and ratings survive |
| `npm run db:setup` | `db:migrate` + `db:seed` |
| `npm run db:studio` | Browse the database in Drizzle Studio |

The default database is the SQLite file `db/world-plate.db` (git-ignored). To use Turso/libSQL, set `DATABASE_URL=libsql://…` and `DATABASE_AUTH_TOKEN`. Moving to Postgres/Supabase means swapping the Drizzle dialect and driver in `db/client.ts` and `drizzle.config.ts`; the query functions in `db/queries/` stay the same.

**Tables:** `cuisines`, `recipes`, `recipe_tags`, `ingredients`, `steps`, `sessions`, `favorites`, `ratings`, `newsletter_subscribers`. Favorites and ratings belong to an anonymous `sessions` row, created from an HttpOnly cookie on the visitor's first save or rating. That table has a reserved `user_id` column, so real login can link sessions to accounts later without moving any data.

## Project structure

```
app/                     routes (Server Components by default), server actions, API route, sitemap/robots/OG image
components/ui/           shadcn primitives
components/watermelon/   Watermelon UI components (adapted — see below)
components/sections/     page sections: header, hero, carousel, cuisine grid, footer…
components/motion/       Slush motion: PageSwing, ScrollMotion, SlantText, HeadingReveal, CardReveal, LetterRoll, FlipFace, ScrollMarquee, Cursor; Lenis + Motion providers
components/recipe/       recipe card, browser/filters, kitchen (servings + checklist + steps), Cook Mode, actions
db/                      schema, client, migrations, typed queries, idempotent seed
data/                    seed content (15 recipes, 10 cuisines) + Zod schemas
lib/                     scaling/formatting, validation, session, rate limit, JSON-LD, site config
tests/unit, tests/e2e    Vitest and Playwright
```

## Watermelon UI components

Each one was checked against the registry index (`https://registry.watermelon.sh/r/registry.json`) before installing. The `-base` (theme-token) variant was used wherever the registry has one. Installed source was then adapted, and each file starts with a comment describing what changed.

| Component | Install command | Used for | Main adaptations |
|---|---|---|---|
| `stepper-base` | `npx shadcn@latest add https://registry.watermelon.sh/r/stepper-base.json` | Servings adjuster | Controlled, labelled +/- buttons, live value for screen readers, Lucide icons |
| `emoji-spree-choice-chips-base` | `npx shadcn@latest add https://registry.watermelon.sh/r/emoji-spree-choice-chips-base.json` | Cuisine filter chips | Controlled, `aria-pressed`, wrapping layout, emoji burst rises from the chip that was clicked |
| `continuous-tabs-base` | `npx shadcn@latest add https://registry.watermelon.sh/r/continuous-tabs-base.json` | Difficulty and time filters | Controlled, radiogroup with arrow keys, renders on the server (the original rendered nothing until mounted) |
| `step-indicator-base` | `npx shadcn@latest add https://registry.watermelon.sh/r/step-indicator-base.json` | Cook Mode progress | `current` prop fills completed steps; the gliding tooltip is unchanged |
| `floating-input-base` | `npx shadcn@latest add https://registry.watermelon.sh/r/floating-input-base.json` | Recipe search | Label tied to the input, leading icon, 16px text so iOS doesn't zoom |
| `motion-carousel` | `npx shadcn@latest add https://registry.watermelon.sh/r/motion-carousel.json` | Trending dishes | Takes real slides, carousel ARIA, dot indicator uses `layoutId` (transform) instead of animating width |
| `newsletter-1` | `npx shadcn@latest add https://registry.watermelon.sh/r/newsletter-1.json` | Newsletter CTA | Validated server action via `useActionState`, honeypot, error and success states |
| `footer-1` | `npx shadcn@latest add https://registry.watermelon.sh/r/footer-1.json` | Site footer | Placeholder form replaced by a slot, `next/link`, rounded corners, theme tokens |
| `theme-toggler` | `npx shadcn@latest add https://registry.watermelon.sh/r/theme-toggler.json` | Light / Dark / System switch | Invalid `aria-selected` removed, prop syncing moved out of effects; loaded lazily |

(`marquee` was removed when the motion moved to Slush's scroll-direction marquee, `components/motion/scroll-marquee.tsx`.) `motion-carousel`, `newsletter-1`, `footer-1` and `theme-toggler` have no `-base` variant in the registry; their fixed colours were replaced with theme tokens by hand. The other components are custom builds in the same style: header, hero, recipe card, Cook Mode, ingredient checklist, favorite heart and star rating.

## Animation notes

All motion is modelled on [slush.app](https://slush.app) (the "Slush" style on Refero), recorded from the live site's own GSAP scripts and CSS on 2026-10-19. Values are copied exactly: the `slush` ease `cubic-bezier(.65,.05,0,1)`, the elastic `slush-bounce` (as a CSS `linear()` with Slush's own points), and their durations and staggers.

- **Page transition:** the old page shrinks into a rounded card, sinks back in 3D and swings out left while three panels in Slush's colours sweep past; the new page swings in from the right and settles flat (~2.1s). Built on the View Transitions API (`components/motion/page-swing.tsx`) with keyframes sampled from Slush's GSAP timeline. The header stays put. Back/forward and browsers without view transitions navigate without it.
- **Page load:** the title's characters slide in from the last one, then blocks rise 3em 0.1s apart; on a client navigation this waits until the swing has landed. On the home page the "World Plate" wordmark rolls up letter by letter and the tagline rises at 1.5s.
- **Scroll:** display titles slide in by character, smaller headings tip in line by line in 3D, card rows fly in from the right in 3D, the home showcase rises and grows, marquees reverse with your scroll direction, and the wordmark and CTA hexagon drift (parallax). All play once, when the top crosses 80% of the viewport.
- **Hover:** pill buttons flip in 3D to a coloured back face, circle buttons spin, tiles sink to 0.92, links draw their underline, and a "View recipe" label follows the pointer over dishes.
- **Nav:** pills fly up while you scroll down and return when you scroll up; on mobile the plus slides them in from the right and turns into a minus.
- **Trending dishes:** Slush's tab system — a red pill follows the hovered tab; switching slides the old text off and the new title in by character. The photo frame opens from a smaller rounded window as it scrolls in.
- **Intro curtain:** when you open the home page, a tomato-red panel shows the World Plate wordmark filling in left to right (timings recorded from kervangida.com's preloader) above an enamel pot boiling on a gas hob — a ring of flickering blue gas flames under a cast-iron grate, a rattling domed lid with a metal knob, bubbles and steam. It waits for you to scroll: as you do, the lid blows off in a puff of steam, the wordmark floats away and the pot moves to the middle and grows; keep scrolling and the lid flies off and the page opens up out of the pot's mouth until it fills the screen. Scroll back and it runs backwards; click or press Enter to skip.
- **After the About section:** About opens with a "kitchen atlas" pitch, numbers that count up and three endlessly scrolling columns of dish photos. Every section after it has its own scroll effect: Trending dishes opens with a giant headline that slides left to right (an outlined copy slides the other way) while its rows rise out of masks and its photo zooms out; Explore by cuisine starts as a leaning stack of cuisine cards that deals out into a grid as you scroll; Quick meals starts as one full-screen dish photo that shrinks into a grid of four as the others rise in beside it; and the closing "Cook tonight" panel turns on an illustrated stove as you scroll — the knob turns, the flame lights and the pan starts tossing vegetables while steam rises.
- **Hungry Tiger scroll:** section titles and the about paragraph fill word by word as you scroll (20% → full, scrubbed from "top 90%" to "top center", as on eathungrytiger.com). On the home page a World Plate "House Masala" jar (built in CSS 3D) stays pinned in the middle of the screen and tumbles as you scroll — lid, back label, base, upright again — while three headlines pass behind it; it rises, tilts and finally shrinks away on the curve recorded from their jar.
- **Floating photos and scroll extras:** dish photos float around the hero all the time, follow the mouse at different depths and rise at different speeds as you scroll. A tomato-red progress bar tracks the page, card photos settle inside their frames while scrolling, and the dish marquee runs as two tilted bands.
- **Reduced motion:** no 3D, no travel, no parallax or marquee drift — opacity fades only; the page transition becomes a crossfade. Lenis isn't loaded.
- **Performance:** Motion is loaded via `LazyMotion` and `m.*` components, with its features fetched asynchronously. Lenis and Cook Mode are loaded on demand. Anton (one weight) is preloaded because the home page's largest element is the Anton wordmark; Barlow Condensed is not. The floats and scroll-linked effects are CSS animations, off the main thread.

## Look

The Agence Foudre magazine style (from Refero): a butter-yellow canvas, huge condensed tomato-red headlines (Anton), forest-green body text and buttons, warm sand cards and tags, Inter for all other text, and round tomato-red nav dots. Dark mode runs on forest green with saffron headlines. See CLAUDE.md "Design rules".

## Status (last verified)

- Lint, typecheck, 41 unit tests and the 6 E2E tests (desktop + mobile) pass; the production build succeeds (2026-10-19, after the Cult Eats restyle).
- Lighthouse scores below were measured before the restyle and haven't been re-run since.
- Lighthouse, mobile preset, against a local production server: **Accessibility 100, Best Practices 100, SEO 100** on every page. **Performance** is 91 on home, 92 on recipes, 93–94 on cuisine pages and 93 on favorites. Recipe detail pages score **88–90**, just under the 90 target. That number is Lighthouse's simulated slow-4G estimate for the large hero photo; the real unthrottled LCP is about 0.1 s.
- `npm audit --omit=dev`: 0 vulnerabilities. The full audit lists 13 issues, all in dev tooling (shadcn CLI, eslint-config-next, drizzle-kit). The high-severity `braces` advisory has no patched release yet.
- Security review: no exploitable issues found. See CLAUDE.md for the security rules.

Food photos come from [Unsplash](https://unsplash.com).
