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
components/motion/       Reveal, WordReveal, CountUp, Magnetic, Lenis + Motion providers, PageTransition
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
| `marquee` | `npx shadcn@latest add https://registry.watermelon.sh/r/marquee.json` | Dish-name ticker | Repeated copies `aria-hidden`, pauses for reduced motion |
| `theme-toggler` | `npx shadcn@latest add https://registry.watermelon.sh/r/theme-toggler.json` | Light / Dark / System switch | Invalid `aria-selected` removed, prop syncing moved out of effects; loaded lazily |

`motion-carousel`, `newsletter-1`, `footer-1`, `marquee` and `theme-toggler` have no `-base` variant in the registry; their fixed colours were replaced with theme tokens by hand. The other components are custom builds in the same style: header, hero, recipe card, Cook Mode, ingredient checklist, favorite heart and star rating.

## Animation notes

- **Hero:** the headline appears word by word (stagger, blur to sharp, slide up) with pure CSS, so it plays from the first paint. The photo has a CSS Ken Burns zoom and Motion scroll parallax. SVG chili, basil and garlic drift slowly and lean toward the mouse. The CTAs fade in after the headline and pull toward the pointer on hover.
- **Card image to recipe hero morph:** React's `<ViewTransition>` with a shared name, which is how Next 16 handles transitions between routes. Motion's `layoutId` can't pair elements across an App Router navigation because the old page unmounts first, so `layoutId` is used for in-page shared elements instead: the nav pill, filter pills and carousel dots.
- **Reduced motion:** `MotionConfig reducedMotion="user"` plus CSS media queries. Parallax, drifting, the Ken Burns zoom and layout morphs are switched off; only opacity fades remain. Lenis isn't loaded.
- **Performance:** Motion is loaded via `LazyMotion` and `m.*` components, with its features fetched asynchronously. Lenis and Cook Mode are loaded on demand, and the display font isn't preloaded so it doesn't compete with the hero photo.

## Status (last verified)

- Lint, typecheck, 36 unit tests and the E2E test (desktop + mobile) pass; the production build succeeds.
- Lighthouse, mobile preset, against a local production server: **Accessibility 100, Best Practices 100, SEO 100** on every page. **Performance** is 91 on home, 92 on recipes, 93–94 on cuisine pages and 93 on favorites. Recipe detail pages score **88–90**, just under the 90 target. That number is Lighthouse's simulated slow-4G estimate for the large hero photo; the real unthrottled LCP is about 0.1 s.
- `npm audit --omit=dev`: 0 vulnerabilities. The full audit lists 13 issues, all in dev tooling (shadcn CLI, eslint-config-next, drizzle-kit). The high-severity `braces` advisory has no patched release yet.
- Security review: no exploitable issues found. See CLAUDE.md for the security rules.

Food photos come from [Unsplash](https://unsplash.com).
