# Sizzle Atlas

(Formerly World Plate. The folder, package name and browser-storage keys still say world-plate / wp, so nothing saved in visitors' browsers was lost.)

An animation-rich recipe site with 46 famous dishes from twelve cuisines, each with a full recipe: a servings scaler, an animated ingredient checklist that fills a pot, a method with kitchen timers, a step-by-step Cook Mode, favorites and star ratings. The whole site switches between English and Japanese with one button, and visitors can create an account to keep their favorites on every device.

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

The round **あ / EN** button in the header switches every word on the site instantly, without reloading: menus, headings and buttons, all 46 recipes (titles, descriptions, ingredients, steps, stories, photo descriptions) and the cuisines. The choice is remembered, and a first visit from a Japanese browser starts in Japanese. Quantities are written the Japanese way (小さじ2, 大さじ1½, 250g, 卵 4個). Japanese headlines use Dela Gothic One and body text uses Noto Sans JP; both load only when Japanese is shown. Search works in Japanese too (ラーメン, 鶏肉, ネパール…).

## Accounts (Firebase)

Visitors can create an account (name, email, password) or **continue with Google**, sign in later, and see their saved recipes and star ratings on any device. Favourites and ratings made before signing in are added to the account. Signing out removes them from that browser; they stay in the account. New email accounts get a confirmation email (with "Send it again"), there is a "Forgot your password?" reset, and **Delete my account** permanently removes the account and everything it saved. For safety, deleting needs a sign-in from the last few minutes.

Accounts use Firebase (Authentication + Firestore), called straight from the browser, so the site stays a static export. To switch them on:

1. Create a free project at https://console.firebase.google.com.
2. **Authentication → Sign-in method:** enable **Email/Password**, and **Google** if you want the Google button to work.
3. **Firestore Database → Create database** (production mode), then **Rules:** paste the contents of `firestore.rules` and publish. They let each account read and write only its own `users/{uid}` document.
4. **Project settings → Your apps → Web (`</>`):** register an app and copy its config into `.env.local` (the `NEXT_PUBLIC_FIREBASE_*` keys listed in `.env.example`).
5. `npm run build`. The web config is public by design; the security rules protect the data.

Without the config the site works as before: favorites stay in the browser, and the account page says accounts aren't switched on yet. The Firebase SDK is only downloaded on the account page, or for visitors who were signed in last time.

## Search by country

Both searches (the box on /recipes and the header search) find dishes by country as well as by name and ingredient, in English or Japanese: "Nepal" or "ネパール" lists all six Nepali dishes. They also know a country's other names ("Korea", "Nepalese", "Lebanon" and "Syria" for the Levant; see `lib/places.ts`) and the city or region a dish comes from ("Osaka", "Kathmandu").

## Shopping list, sharing and printing

- **Shopping list:** on any recipe, pick how many you're cooking for and press **Add to shopping list**. The ingredients, scaled to that number, go on one list (the Shopping list pill in the header). Tick things off at the shop, copy the remaining items as text, print the list, or remove a recipe. The list is kept in this browser.
- **Share and print:** every recipe has a **Share** button (your phone's share sheet, or it copies the link) and a **Print** button. Printing gives a clean black-on-white page with the ingredients and method, without the header, footer, artwork or animations.

## Publishing (AWS Amplify)

The site is published on AWS Amplify Hosting as plain static files, uploaded with Amplify's **Deploy without Git**. Amplify's own Git builds aren't used: they only support Next.js 12–15, and the site is a static export anyway.

The site is live at **https://sizzleatlas.com** (also reachable at https://main.d1arn7be8fhjvi.amplifyapp.com).

```bash
npm run build:aws
```

This builds the site for the root of its own domain (the `cooking/site/` copy is built for `/Programming/cooking/site/` under Live Server instead), writes `dist/`, and packs it as `world-plate-aws.zip`. The address (set in the `build:aws` script in package.json; pass another after `--` to override) is used for canonical links, Open Graph and the sitemap. The zip includes a `customHttp.yml`, so Amplify sends real security headers: the Content Security Policy from `lib/csp.ts` plus `frame-ancestors 'none'`, HSTS, nosniff, a referrer policy and a permissions policy, and long caching for the hashed files in `_next/static/`.

**First time:**

1. In the AWS console, open **Amplify → Create new app → Deploy without Git**. Name the app `world-plate` and the branch `main`, then drag in `world-plate-aws.zip`.
2. Note the address Amplify gives the site (`https://main.<app-id>.amplifyapp.com`), rebuild with it (the command above) and upload the new zip under **Deploy updates**.
3. **Hosting → Rewrites and redirects → Manage redirects → Add rewrite:** source `/<*>`, target `/404.html`, type **404 (Rewrite)**, so unknown addresses show the site's own "not found" page.
4. In Firebase → Authentication → Settings → **Authorized domains**, add the Amplify address (without `https://`), so Google sign-in works there.

**Each update:** run `npm run build:aws` and upload the zip under **Deploy updates**. To use your own domain later: Amplify → **Hosting → Custom domains**, then add that domain to Firebase's authorized domains too and rebuild with it.

## Security

Audited from scratch on 2026-10-29, including live tests against the Firebase project with throwaway accounts.

- **Response headers (AWS Amplify, `customHttp.yml` from `scripts/build-aws.mjs`):** Content Security Policy (`lib/csp.ts`; connections only to the three Firebase APIs the site uses, `frame-ancestors 'none'`, `upgrade-insecure-requests`), HSTS, nosniff, `X-Frame-Options: DENY`, a referrer policy, a permissions policy, and `Cross-Origin-Opener-Policy: same-origin-allow-popups` (keeps other sites from scripting the window while the Google sign-in popup still works). The same CSP is also a `<meta>` tag, for hosts that can't send headers. Plain HTTP redirects to HTTPS.
- **No server-side surface:** the site is static files. The SQLite database is only used at build time and is never published; its queries use bound parameters and escape LIKE wildcards. Probes for `.env`, `.git`, the database file, source maps, `package.json` and the rules file all return the 404 page.
- **Firestore rules** (`firestore.rules`): each account can read and write only its own document and only known fields. Favourites must be distinct names from the recipe list and ratings 1–5 stars, so nobody can store junk or bloat a document; timestamps must be the server's own time; listing users and every other collection is refused. The recipe list is generated by `npm run rules` (`scripts/sync-recipe-slugs.ts`, runs before every build; a unit test checks it). **After adding recipes, republish the rules.**
- **Accounts:** email enumeration protection and no anonymous sign-in (both checked live); deleting an account needs a recent sign-in and removes the stored data first; the site only sends known recipe names. The test-only stand-in login exists only in the test build (`NEXT_PUBLIC_ACCOUNT_DEMO`).
- **Untrusted storage is validated** when read back from localStorage or the account (slug-shaped names, stars 1–5, capped sizes). No user content is ever written as HTML.
- **Privacy page** (`/privacy`, both languages): what's stored where, the services pages load from, and how to delete everything. Linked from the footer and the sign-up form.
- **Dependencies:** `npm audit --omit=dev` reports 0 vulnerabilities. The full audit lists 4 moderate issues in `drizzle-kit`'s bundled esbuild: a development tool that never runs a server here. The shadcn CLI was removed (its one stylesheet is vendored as `app/shadcn-tailwind.css`), which cleared a deepmerge advisory.
- **To do in the consoles (can't be done from code):** restrict the Firebase API key to the site's addresses and APIs (Google Cloud → Credentials), turn on Firebase's password policy (minimum 8, matching the form), and consider App Check.

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
data/                    seed content (46 recipes, 12 cuisines), their Japanese editions (*.ja.ts) + Zod schemas
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
- **Page load:** the title's characters slide in from the last one, then blocks rise 3em 0.1s apart; on a client navigation this waits until the swing has landed. On the home page the "Sizzle Atlas" wordmark rolls up letter by letter and the tagline rises at 1.5s.
- **Scroll:** display titles slide in by character, smaller headings tip in line by line in 3D, card rows fly in from the right in 3D, the home showcase rises and grows, marquees reverse with your scroll direction, and the wordmark and CTA hexagon drift (parallax). All play once, when the top crosses 80% of the viewport.
- **Hover:** pill buttons flip in 3D to a coloured back face, circle buttons spin, tiles sink to 0.92, links draw their underline, and a "View recipe" label follows the pointer over dishes.
- **Nav:** the logo sits at the left edge of the screen and the menu at the right edge: the pills, then the language, theme, plus and search circles, with the account circle last. The pills fly up while you scroll down and return when you scroll up; on mobile the plus slides them in from the right and turns into a minus. The search circle opens a search box that grows out of the button. Dishes appear as you type (English or Japanese, accents optional: "pho" finds Phở). Typing a country also offers that cuisine's whole page first ("Japan" → All Japanese dishes), the arrow keys pick one and Enter opens it; with nothing picked, Enter runs the full search on /recipes. "/" or Ctrl/⌘+K opens it anywhere, and Esc closes it.
- **Trending dishes:** Slush's tab system — a red pill follows the hovered tab; switching slides the old text off and the new title in by character. The photo frame opens from a smaller rounded window as it scrolls in.
- **Background artwork:** behind every page runs one tall illustrated canvas, top to bottom — soft saffron, sage and paprika blobs at the edges with real vintage-style engravings among them — rosemary, a pepper plant, onion, mushrooms, parsley, oranges, spoons, pomegranate, fennel, carrot, fig, sage, ginger, pear, thyme and grapes (public-domain line art by Pearson Scott Foresman, from Wikimedia Commons) — on a faint paper grain, like the pages of an illustrated cookbook. The engravings carry on through the coloured sections too (the green, red and cream panels and the footer), drawn in each section's own text colour, and they follow dark mode.
- **Intro curtain:** when you open the home page, a tomato-red panel shows the Sizzle Atlas wordmark filling in left to right (timings recorded from kervangida.com's preloader) above a real-time 3D pot (three.js, `lib/three/intro-pot.ts`): an enamelled cast-iron pot of golden broth with herbs, carrot and spring onion, simmering on a gas burner on a black glass hob, steam escaping round its rattling lid. It waits for you to scroll: the lid blows off and the steam bursts out, the wordmark floats away, and the camera rises over the pot and looks down into the bubbling broth; the page then opens out of the middle of the soup. Scroll back and it runs backwards; click or press Enter to skip. Devices without hardware-accelerated WebGL get the illustrated pot instead.
- **Stove:** the closing "Cook tonight" panel has a real-time 3D stove (`lib/three/stove.ts`): a cast-iron skillet of tomatoes, peppers, red onion, corn and basil on a gas hob. Scrolling turns the knob and lights the blue flame, then the pan starts tossing, with steam and oil spits. three.js loads only on the home page, and the stove only as you get near it.
- **After the About section:** About opens with a "kitchen atlas" pitch, numbers that count up and three endlessly scrolling columns of dish photos. Every section after it has its own scroll effect: Trending dishes opens with a giant headline that slides left to right (an outlined copy slides the other way) while its rows rise out of masks and its photo zooms out; Explore by cuisine starts as a leaning stack of cuisine cards that deals out into a grid as you scroll; Quick meals starts as one full-screen dish photo that shrinks into a grid of four as the others rise in beside it; and the closing "Cook tonight" panel turns on an illustrated stove as you scroll — the knob turns, the flame lights and the pan starts tossing vegetables while steam rises.
- **Hungry Tiger scroll:** section titles and the about paragraph fill word by word as you scroll (20% → full, scrubbed from "top 90%" to "top center", as on eathungrytiger.com). On the home page a Sizzle Atlas "House Masala" jar (built in CSS 3D) stays pinned in the middle of the screen and tumbles as you scroll — lid, back label, base, upright again — while three headlines pass behind it; it rises, tilts and finally shrinks away on the curve recorded from their jar.
- **Floating photos and scroll extras:** dish photos float around the hero all the time, follow the mouse at different depths and rise at different speeds as you scroll. A tomato-red progress bar tracks the page, card photos settle inside their frames while scrolling, and the dish marquee runs as two tilted bands.
- **Recipe kitchen:** a cartoon pot sits at the top of the ingredient list. Tick an ingredient and its name flies in an arc into the pot, which bobs and splashes as the soup level rises. The pot starts bubbling when half full and steams when everything's in, and a "Start Cook Mode" button appears. The ingredient rows slide in one after another, and each method step rises out of a blur as you reach it. The step you're reading lights up and plays a small drawing of what to do: bubbles rise from a pot, oil spits in a pan, a knife chops, a whisk spins, an oven glows, a clock hand sweeps or a cloche lifts. The rail between step numbers fills in as you read on. Every time a step mentions ("8–10 minutes", "1½ hours") becomes a timer button with a draining ring that chimes and buzzes when done. Cook Mode shows the same drawing, large, with big timer buttons, and a running timer carries over between the page and Cook Mode.
- **Reduced motion:** no 3D, no travel, no parallax or marquee drift — opacity fades only; the page transition becomes a crossfade. Lenis isn't loaded.
- **Performance:** Motion is loaded via `LazyMotion` and `m.*` components, with its features fetched asynchronously. Lenis and Cook Mode are loaded on demand. The display and body fonts (Archivo and Plus Jakarta Sans, both variable) are preloaded. The Japanese fonts are not preloaded and are split by character range, so English visitors never download them. The floats and scroll-linked effects are CSS animations, off the main thread.

## Logo

The logo is the owner’s artwork in `logo/`: a cast-iron pan holding a glowing globe with map pins, steam and sparks, above “SIZZLE ATLAS · World recipe collection”. The site uses transparent cut-outs of it in `public/brand/`: the pan on its own (header) and the full logo in two versions, the original with cream “ATLAS” for dark backgrounds and one with navy lettering for light backgrounds (footer, switching with the theme). The browser-tab icon, phone home-screen icon and link-preview image (`app/icon.png`, `app/apple-icon.png`, `app/opengraph-image.png`) and the spice-jar badge are made from the same art.

## Step pictures

Each recipe step shows a small 3D picture of what it asks you to do (a pot of soup, an egg in a pan, a loaf, a knife, a mixing bowl, an hourglass, a laid plate, a flame), from Microsoft’s Fluent Emoji 3D set (MIT licence, `public/icons/steps/LICENSE.txt`). The one on the step you’re reading moves a little.

## Look

The Agence Foudre magazine style (from Refero): a butter-yellow canvas, huge condensed tomato-red headlines (Archivo, extra bold and expanded), forest-green body text and buttons, warm sand cards and tags, Plus Jakarta Sans for all other text, and round tomato-red nav dots. Dark mode runs on forest green with saffron headlines. See CLAUDE.md "Design rules".

## Status (last verified)

- Lint, typecheck, 106 unit tests and 18 E2E runs (9 tests × desktop + mobile) pass, and the production build succeeds (2026-10-20, after adding the 20 new dishes, Japanese and accounts). The account flow is tested against a localStorage stand-in for Firebase (`lib/account/demo-backend.ts`); real Firebase sign-in needs the project config above.
- Lighthouse 12, mobile preset (simulated slow 4G), against a local server that gzips like a real host (2026-10-26): **Performance** 78 on home, 87 on recipes, 88 on a recipe page, 85 on cuisine pages. **Best Practices 100, SEO 100** (the account, favourites and shopping list pages are deliberately `noindex`). **Accessibility 100**, except home at 96: the cuisine cards overlap while they're still piled up, before the deal animation spreads them out.
- Speed fixes made in that pass: the Japanese fonts load only in Japanese mode (they were a 189 KB render-blocking stylesheet for everyone), the large background-engravings image loads after the page, and the entrance fades start at 1% opacity so Chrome can measure Largest Contentful Paint.
- `npm audit --omit=dev`: 0 vulnerabilities (see Security above).
- Security review (2026-10-26): no exploitable issues found; hardening listed under Security.

Food photos come from [Unsplash](https://unsplash.com) (free licence), each chosen from a contact sheet of search results.
