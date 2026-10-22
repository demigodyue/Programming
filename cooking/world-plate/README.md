# World Plate

An animation-rich recipe site with 35 famous dishes from twelve cuisines, each with a full recipe: a servings scaler, an animated ingredient checklist that fills a pot, a method with kitchen timers, a step-by-step Cook Mode, favorites and star ratings. The whole site switches between English and Japanese with one button, and visitors can create an account to keep their favorites on every device.

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

## English and Japanese

The round **あ / EN** button in the header switches every word on the site instantly, without reloading: menus, headings and buttons, all 35 recipes (titles, descriptions, ingredients, steps, stories, photo descriptions) and the cuisines. The choice is remembered, and a first visit from a Japanese browser starts in Japanese. Quantities are written the Japanese way (小さじ2, 大さじ1½, 250g, 卵 4個). Japanese headlines use Dela Gothic One and body text uses Noto Sans JP; both load only when Japanese is shown. Search works in Japanese too (ラーメン, 鶏肉…).

## Accounts (Firebase)

Visitors can create an account (name, email, password), sign in later and see their saved recipes on any device. Favorites saved before signing in are added to the account. Signing out removes them from that browser; they stay in the account. There is also a "Forgot your password?" email reset.

Accounts use Firebase (Authentication + Firestore), called straight from the browser, so the site stays a static export. To switch them on:

1. Create a free project at https://console.firebase.google.com.
2. **Authentication → Sign-in method:** enable **Email/Password**.
3. **Firestore Database → Create database** (production mode), then **Rules:** paste the contents of `firestore.rules` and publish. They let each account read and write only its own `users/{uid}` document.
4. **Project settings → Your apps → Web (`</>`):** register an app and copy its config into `.env.local` (the `NEXT_PUBLIC_FIREBASE_*` keys listed in `.env.example`).
5. `npm run build`. The web config is public by design; the security rules protect the data.

Without the config the site works as before: favorites stay in the browser, and the account page says accounts aren't switched on yet. The Firebase SDK is only downloaded on the account page, or for visitors who were signed in last time.

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
components/recipe/       recipe card, browser/filters, kitchen (servings + pot checklist + steps + timers), step icons, Cook Mode, actions
components/account/      account page panel, header account button, favorites note, account boot
components/i18n.tsx      <T en ja> (both languages in the page, CSS shows one); i18n-image.tsx (bilingual alt text)
db/                      schema, client, migrations, typed queries, idempotent seed
data/                    seed content (35 recipes, 12 cuisines), their Japanese editions (*.ja.ts) + Zod schemas
lib/                     scaling/formatting (English + Japanese), language (lang.ts), accounts (account/), step parsing, JSON-LD, site config
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

- **Page transition:** a card cascade — the old page shrinks into a rounded card and falls away out of the bottom, tipping back; three engraved panels in Slush's colours tumble down past the middle; the new page drops in from the top, straightens and grows to full screen — a smooth ~1s. Built on the View Transitions API (`components/motion/page-swing.tsx`) with keyframes sampled from Slush's GSAP timeline. The header stays put. Back/forward and browsers without view transitions navigate without it.
- **More transitions (2026-10-22):**
  - **Photo flight:** opening a recipe from a dish photo (recipe cards, the hero's floating photos, the photo tiles) lifts that photo out of its card. It flies and grows into the recipe page's big photo while the pages cascade.
  - **Circle reveal:** switching language or theme spreads the new look across the page in a circle growing out of the button you pressed.
  - **Flying heart:** saving a recipe sends a heart flying up into the header's Favorites pill (or the account button when the pills are tucked away), which bumps as it lands.
  - **Scroll extras:** recipe cards in the browse and favourites grids rise and straighten into place as they scroll into view, and the recipe page's photo slowly pushes in as you scroll past it.
- **Page load:** the title's characters slide in from the last one, then blocks rise 3em 0.1s apart; on a client navigation this waits until the swing has landed. On the home page the "World Plate" wordmark rolls up letter by letter and the tagline rises at 1.5s.
- **Scroll:** display titles slide in by character, smaller headings tip in line by line in 3D, card rows fly in from the right in 3D, the home showcase rises and grows, marquees reverse with your scroll direction, and the wordmark and CTA hexagon drift (parallax). All play once, when the top crosses 80% of the viewport.
- **Hover:** pill buttons flip in 3D to a coloured back face, circle buttons spin, tiles sink to 0.92, links draw their underline, and a "View recipe" label follows the pointer over dishes.
- **Nav:** the logo sits at the left edge of the screen and the menu at the right edge: the pills, then the language, theme, plus and search circles, with the account circle last. The pills fly up while you scroll down and return when you scroll up; on mobile the plus slides them in from the right and turns into a minus. The search circle opens a search box that grows out of the button. Dishes appear as you type (English or Japanese, accents optional: "pho" finds Phở), the arrow keys pick one and Enter opens it; with nothing picked, Enter runs the full search on /recipes. "/" or Ctrl/⌘+K opens it anywhere, and Esc closes it.
- **Trending dishes:** Slush's tab system — a red pill follows the hovered tab; switching slides the old text off and the new title in by character. The photo frame opens from a smaller rounded window as it scrolls in.
- **Background artwork:** behind every page runs one tall illustrated canvas, top to bottom — soft saffron, sage and paprika blobs at the edges with real vintage-style engravings among them — rosemary, a pepper plant, onion, mushrooms, parsley, oranges, spoons, pomegranate, fennel, carrot, fig, sage, ginger, pear, thyme and grapes (public-domain line art by Pearson Scott Foresman, from Wikimedia Commons) — on a faint paper grain, like the pages of an illustrated cookbook. The engravings carry on through the coloured sections too (the green, red and cream panels and the footer), drawn in each section's own text colour, and they follow dark mode.
- **Intro curtain:** when you open the home page, a tomato-red panel shows the World Plate wordmark filling in left to right (timings recorded from kervangida.com's preloader) above a glossy enamel stockpot boiling on a gas hob — shaded like real cookware, with polished steel handles and lid rim, a rattling lid with a glossy black knob, translucent flickering blue gas flames under a cast-iron grate, bubbles and soft vapour, and the pot's reflection in the black glass hob. It waits for you to scroll: as you do, the lid blows off in a puff of steam, the wordmark floats away and the pot moves to the middle and grows; keep scrolling and the lid flies off and the page opens up out of the pot's mouth until it fills the screen. Scroll back and it runs backwards; click or press Enter to skip.
- **After the About section:** About opens with a "kitchen atlas" pitch, numbers that count up and three endlessly scrolling columns of dish photos. Every section after it has its own scroll effect: Trending dishes opens with a giant headline that slides left to right (an outlined copy slides the other way) while its rows rise out of masks and its photo zooms out; Explore by cuisine starts as a leaning stack of cuisine cards that deals out into a grid as you scroll; Quick meals starts as one full-screen dish photo that shrinks into a grid of four as the others rise in beside it; and the closing "Cook tonight" panel turns on an illustrated stove as you scroll — the knob turns, the flame lights and the pan starts tossing vegetables while steam rises.
- **Hungry Tiger scroll:** section titles and the about paragraph fill word by word as you scroll (20% → full, scrubbed from "top 90%" to "top center", as on eathungrytiger.com). On the home page a World Plate "House Masala" jar (built in CSS 3D) stays pinned in the middle of the screen and tumbles as you scroll — lid, back label, base, upright again — while three headlines pass behind it; it rises, tilts and finally shrinks away on the curve recorded from their jar.
- **Floating photos and scroll extras:** dish photos float around the hero all the time, follow the mouse at different depths and rise at different speeds as you scroll. A tomato-red progress bar tracks the page, card photos settle inside their frames while scrolling, and the dish marquee runs as two tilted bands.
- **Recipe kitchen:** a cartoon pot sits at the top of the ingredient list. Tick an ingredient and its name flies in an arc into the pot, which bobs and splashes as the soup level rises. The pot starts bubbling when half full and steams when everything's in, and a "Start Cook Mode" button appears. The ingredient rows slide in one after another, and each method step rises out of a blur as you reach it. The step you're reading lights up and plays a small drawing of what to do: bubbles rise from a pot, oil spits in a pan, a knife chops, a whisk spins, an oven glows, a clock hand sweeps or a cloche lifts. The rail between step numbers fills in as you read on. Every time a step mentions ("8–10 minutes", "1½ hours") becomes a timer button with a draining ring that chimes and buzzes when done. Cook Mode shows the same drawing, large, with big timer buttons, and a running timer carries over between the page and Cook Mode.
- **Reduced motion:** no 3D, no travel, no parallax or marquee drift — opacity fades only; the page transition becomes a crossfade. Lenis isn't loaded.
- **Performance:** Motion is loaded via `LazyMotion` and `m.*` components, with its features fetched asynchronously. Lenis and Cook Mode are loaded on demand. Anton (one weight) is preloaded because the home page's largest element is the Anton wordmark. The Japanese fonts are not preloaded and are split by character range, so English visitors never download them. The floats and scroll-linked effects are CSS animations, off the main thread.

## Look

The Agence Foudre magazine style (from Refero): a butter-yellow canvas, huge condensed tomato-red headlines (Anton), forest-green body text and buttons, warm sand cards and tags, Inter for all other text, and round tomato-red nav dots. Dark mode runs on forest green with saffron headlines. See CLAUDE.md "Design rules".

## Status (last verified)

- Lint, typecheck, 106 unit tests and 18 E2E runs (9 tests × desktop + mobile) pass, and the production build succeeds (2026-10-20, after adding the 20 new dishes, Japanese and accounts). The account flow is tested against a localStorage stand-in for Firebase (`lib/account/demo-backend.ts`); real Firebase sign-in needs the project config above.
- Lighthouse scores below were measured before the restyle and haven't been re-run since.
- Lighthouse, mobile preset, against a local production server: **Accessibility 100, Best Practices 100, SEO 100** on every page. **Performance** is 91 on home, 92 on recipes, 93–94 on cuisine pages and 93 on favorites. Recipe detail pages score **88–90**, just under the 90 target. That number is Lighthouse's simulated slow-4G estimate for the large hero photo; the real unthrottled LCP is about 0.1 s.
- `npm audit --omit=dev`: 0 vulnerabilities. The full audit lists 13 issues, all in dev tooling (shadcn CLI, eslint-config-next, drizzle-kit). The high-severity `braces` advisory has no patched release yet.
- Security review: no exploitable issues found. See CLAUDE.md for the security rules.

Food photos come from [Unsplash](https://unsplash.com) (free licence), each chosen from a contact sheet of search results.
