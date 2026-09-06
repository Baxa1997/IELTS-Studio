# EngProgress Refactor Audit

Date: 2026-09-06

## Purpose

This document records the performance audit of `https://www.engprogress.com/` and the local Next.js codebase.

It separates:

1. What was found.
2. What should be changed.
3. The recommended implementation order.
4. How the result should be verified.

No code changes are included in this document. It is the refactoring plan.

## Executive summary

The homepage is slow because several independent issues compound together:

- The production website and the current local branch are not the same implementation.
- The public homepage is forced to render dynamically and performs authentication work.
- The homepage renders a very large amount of content immediately.
- The interactive product demo sends a large client-side component to the browser.
- Many styles are serialized as inline React styles instead of reusable CSS.
- The project contains multiple competing visual systems and many font families.
- A large global stylesheet contains styles for unrelated application areas.
- Vercel caching is disabled for the public homepage.

The first priority is not a cosmetic rewrite. It is to make the public homepage static, reduce the initial client bundle, and ensure the intended branch is actually deployed.

## What was found

### 1. Production and local code are out of sync

The live homepage currently shows the older “Agentic IELTS Platform” implementation. The checked-out branch contains the newer burgundy “professional AI platform” implementation.

The repository contains two separate landing-page systems:

- New design tokens: `app/_landing/design.ts`
- Older landing chrome and indigo design: `app/_landing/chrome.tsx`
- New homepage chrome: `app/_landing/design-chrome.tsx`
- New homepage entry: `app/page.tsx`
- Older chrome still used by `/demo`: `app/demo/page.tsx`

This creates a release and maintenance conflict. A developer can change the local homepage while production still serves a different implementation. It also keeps old fonts, tokens, components, and CSS alive in the build.

### 2. The homepage is explicitly dynamic

`app/page.tsx` contains:

```ts
export const dynamic = "force-dynamic";
```

The homepage also calls `getSession()` before rendering. `lib/auth.ts` then calls Supabase Auth with `getUser()` and may query the profile table.

For an anonymous public visitor, this work is not needed to display the marketing page. It prevents normal static rendering and caching.

The live response confirmed:

- `cache-control: private, no-cache, no-store`
- Vercel cache status: `MISS`
- The page is server-rendered on every request

### 3. Authentication work happens in front of public requests

The proxy runs on public routes and calls `supabase.auth.getClaims()` in `lib/supabase/middleware.ts`.

The homepage then separately calls `getSession()` and `supabase.auth.getUser()`.

This creates two authentication paths around the public homepage. The proxy is useful for protected routes, but public static pages should avoid unnecessary session work wherever possible.

### 4. The homepage response is large

The live homepage response measured approximately:

- 190.7 KB of HTML before transfer compression
- 269 `<div>` elements
- 185 `<span>` elements
- 34 React Flight script payloads
- Approximately 89 KB of serialized React Flight data
- Approximately 30 KB of inline `<style>` content
- Four preloaded institution logo images

The page sends the hero, animated demo, reports, product sections, pricing, FAQ, CTA, and footer together.

The page is SEO-friendly, but too much interactive presentation is being sent and hydrated during the first visit.

### 5. The product demo is a large client boundary

`app/_landing/demo-screens.tsx` is a client component of roughly 1,096 lines. It contains several full coded replicas of product screens.

`app/_landing/demo-tabs.tsx` imports the entire demo-screen module. The browser therefore receives the module containing all demo screen implementations even though only one screen is initially visible.

The same pattern is used by the homepage and `/demo`.

### 6. Several client components are used for marketing theatre

The public homepage uses client components for:

- Hero scene switching: `app/_landing/hero-process-demo.tsx`
- Full demo tabs: `app/_landing/demo-tabs.tsx`
- All demo screen replicas: `app/_landing/demo-screens.tsx`
- Band count-up animation: `components/landing/band-countup.tsx`
- Scroll reveal behavior: `components/landing/scroll-reveal.tsx`
- Language picker behavior: `app/_landing/lang-picker.tsx`

These features are visually useful, but none is required for the first meaningful page render. They should not delay the main marketing content.

### 7. Large amounts of styling are inline

`app/page.tsx` contains roughly 1,015 lines, many of which are inline style objects.

`app/_landing/demo-screens.tsx` contains approximately 1,096 lines and also uses large inline style objects.

Inline styles increase the amount of HTML and React Flight data that must be generated and parsed. Repeated visual rules are also harder to audit and maintain.

### 8. Global CSS is too broad

`app/globals.css` is approximately 2,769 lines long. It contains styles for:

- Marketing pages
- Authentication
- Dashboard
- Reading
- Writing
- Listening
- Speaking
- Center console
- Admin console
- Reports
- Loading states
- Multiple animation systems

The public homepage receives a global stylesheet containing rules for many unrelated surfaces.

### 9. Too many font families are defined

The project defines many `next/font/google` imports across route layouts and components, including:

- Hanken Grotesk
- Newsreader
- Sora
- Manrope
- JetBrains Mono
- Bricolage Grotesque
- Plus Jakarta Sans
- DM Sans
- Work Sans
- Source Serif 4
- Poppins
- Geist Mono

The local production build produced approximately 54 font files totaling around 1 MB across the full build output.

Many fonts are legitimate for specialized application surfaces, but the public marketing pages should use a small, consistent font set. Repeated declarations across nested layouts also make font ownership unclear.

### 10. The project has multiple typography and color systems

The new marketing design uses burgundy tokens from `app/_landing/design.ts`.

The older landing chrome uses indigo and cream tokens from `app/_landing/chrome.tsx`.

Other route groups define their own combinations of Hanken, Newsreader, Manrope, Work Sans, Source Serif, Bricolage, Jakarta, and DM Sans.

This is a design-system conflict, not just a performance issue. It increases the chance of inconsistent pages and unnecessary assets.

### 11. The homepage is not cached at the edge

The live request timing from the audit environment was approximately:

- Warm TTFB: 0.78–0.87 seconds
- Warm total response: 1.09–1.41 seconds
- Cold sample: approximately 1.25 seconds TTFB and 1.68 seconds total

The user-facing 4–8 second experience is therefore likely a combination of:

- Dynamic server rendering
- Browser asset loading
- Font loading
- Client hydration
- Main-thread parsing and rendering
- Possible regional distance between Vercel, Supabase, and the visitor

The response header suggested Vercel routing through an edge in `hkg1` to an origin in `iad1`. The exact best region depends on the Supabase database region, but public static caching should be addressed first.

### 12. Build dependency on Google Fonts

A build without external network access failed while fetching 26 Google Font resources. The build succeeded when network access was available.

This is not necessarily a production runtime failure on Vercel, but it makes builds dependent on Google Fonts availability. Self-hosted fonts using `next/font/local` would make builds more deterministic.

### 13. Existing optimization configuration is not enough

`next.config.ts` enables `staleTimes` and `dynamicOnHover`.

The router cache settings may improve authenticated navigation, but they do not make the public homepage static because the homepage is explicitly `force-dynamic`.

`dynamicOnHover` can also cause full dynamic route renders when a visitor merely hovers a link. It should be measured carefully on a large authenticated application.

## What needs to be done

### P0 — Fix deployment consistency

- Confirm the Vercel production branch.
- Confirm the deployed commit SHA.
- Deploy the intended branch containing the current homepage.
- Remove or migrate the old landing implementation after confirming no route depends on it.
- Add a deployment check that records the deployed commit in the app or response headers.
- Confirm that `/`, `/demo`, `/how-to-use`, legal pages, and marketing pages use the intended design system.

### P0 — Make the public homepage static or ISR-cached

Recommended direction:

1. Remove `force-dynamic` from `app/page.tsx`.
2. Remove `getSession()` from the anonymous homepage.
3. If signed-in users must be redirected from `/`, perform that redirect in the proxy or through a separate authenticated entry path.
4. Use static rendering or a safe ISR interval for public marketing content.
5. Keep authentication and dynamic database reads inside the authenticated application routes.

The homepage should be cacheable by Vercel and should not require Supabase before the first render.

### P1 — Split the demo into deferred modules

Refactor the demo structure:

```text
app/_landing/demo/
  demo-tabs.tsx
  writing-feedback.tsx
  writing-studio.tsx
  reading.tsx
  listening.tsx
  speaking.tsx
  coach.tsx
  progress.tsx
```

Load the first screen only. Dynamically import the other screens when:

- The user selects a tab.
- The demo enters the viewport.
- The browser is idle, if appropriate.

The initial homepage should not pay the cost of all seven coded replicas.

### P1 — Reduce client-side marketing code

- Keep the initial hero markup server-rendered.
- Replace the hero scene timer with static content plus optional CSS animation.
- Defer the band count-up until after first paint or remove it from the critical path.
- Avoid mounting a `ResizeObserver` for offscreen demo content.
- Use `content-visibility: auto` for large below-the-fold sections where appropriate.
- Ensure `prefers-reduced-motion` is respected without requiring hydration.

### P1 — Consolidate public fonts

Choose one public marketing font system, for example:

- One display family
- One body family
- System fallback

Then:

- Load only the required weights.
- Use `preload` only for above-the-fold fonts.
- Use `preload: false` for fonts used only below the fold.
- Move fonts to `next/font/local` where licensing and product requirements allow.
- Remove Poppins from the logo if the logo can use the selected display font.
- Avoid defining the same family independently in multiple nested layouts.

### P1 — Replace repeated inline styles with scoped CSS

Start with:

- `app/page.tsx`
- `app/_landing/demo-screens.tsx`
- `app/_landing/design-chrome.tsx`
- `app/_landing/site-footer.tsx`

Use CSS modules or scoped route styles for repeated cards, buttons, grids, typography, and responsive behavior.

Keep inline styles only for values that are truly data-driven, such as a progress percentage or a dynamic color.

### P2 — Split the global stylesheet

Move styles out of `app/globals.css` according to ownership:

```text
app/globals.css                 # reset, tokens, minimal shared base
app/_landing/landing.module.css # public marketing
app/(auth)/auth.module.css      # authentication
components/console/*.module.css # center console
components/admin/*.module.css   # admin console
app/(studio)/*.module.css       # writing/reading/speaking surfaces
```

Do not move every rule mechanically. First identify which route or component owns each rule, then delete obsolete styles.

### P2 — Choose one landing design system

Either:

- Migrate `/demo` and all marketing pages to the new burgundy system, then delete `chrome.tsx`; or
- Keep the old system intentionally and stop adding a second parallel system.

The recommended direction is to standardize all public pages on one design system and keep application surfaces independently scoped only where necessary.

### P2 — Review public route caching and regional placement

- Confirm the Supabase project region.
- Confirm the Vercel function region.
- Align dynamic application routes with the database region.
- Keep public pages edge-cacheable where content permits.
- Add response timing headers or observability for TTFB, database time, and render time.
- Review whether `dynamicOnHover` is generating unnecessary server renders.

### P3 — Remove obsolete assets and dependencies

After the design migration:

- Delete unused landing components.
- Delete unused old token files.
- Remove obsolete font declarations.
- Remove unused logo assets.
- Re-evaluate `react-icons` if only three small social icons remain.
- Keep `lucide-react` imports explicit and tree-shakable.

Do not delete old code until route references and production deployment are verified.

## Suggested target architecture

### Public marketing routes

- Static or ISR-rendered.
- No Supabase session lookup during anonymous render.
- One public design system.
- One or two font families.
- Small server-rendered initial HTML.
- Deferred interactive demos.

### Authenticated application routes

- Dynamic where user data requires it.
- Server-side authentication and RLS remain enabled.
- Shared authenticated shell remains dynamic.
- Route-specific fonts and styles stay inside their owning route group.

### Interactive demos

- First screen rendered with minimal code.
- Additional screens code-split by tab.
- No API calls from marketing demos.
- No unnecessary timers or observers before interaction.

## Validation checklist

### Before refactor

- [ ] Record the deployed commit SHA.
- [ ] Record Vercel region and Supabase region.
- [ ] Run Lighthouse on desktop and mobile.
- [ ] Capture a network waterfall for `/`.
- [ ] Record TTFB, FCP, LCP, total blocking time, and transferred bytes.
- [ ] Record initial JS, CSS, and font bytes.

### After each priority group

- [ ] Homepage response is cacheable.
- [ ] Anonymous homepage does not call Supabase Auth.
- [ ] First meaningful content appears before client hydration completes.
- [ ] Initial JS is reduced.
- [ ] Initial font requests are reduced.
- [ ] Demo tabs still work.
- [ ] SEO HTML still contains the important marketing copy.
- [ ] Mobile layout remains correct.
- [ ] Reduced-motion mode remains correct.
- [ ] Signed-in users still reach the correct dashboard or admin route.

### Suggested performance targets

- TTFB: below 0.8 seconds for cached public pages.
- Largest Contentful Paint: below 2.5 seconds on a normal mobile profile.
- Total Blocking Time: below 200 ms where practical.
- Initial homepage JavaScript: preferably below 100 KB compressed.
- Initial font requests: preferably one or two files.
- No large interactive demo module before the visitor interacts with it.

## Verification commands

```bash
pnpm build
pnpm typecheck
pnpm lint
git status --short
```

For production verification, inspect:

```text
https://www.engprogress.com/
```

Confirm that the visible production copy and design match the intended branch before measuring performance again.

## Recommended implementation sequence

1. Fix the Vercel branch/commit mismatch.
2. Make the anonymous homepage static or ISR-cached.
3. Split the demo screens and defer non-active tabs.
4. Reduce above-the-fold client components and animation work.
5. Consolidate marketing fonts.
6. Move repeated landing styles into scoped CSS.
7. Split global CSS by route ownership.
8. Delete obsolete landing code and assets.
9. Align dynamic route region with Supabase.
10. Run Lighthouse and compare the before/after metrics.

