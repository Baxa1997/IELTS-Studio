import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The AI grader reads the `ielts-examiner` skill (rubric, taxonomy, anchors,
  // output schema) from disk at runtime. Trace those files into the server
  // bundle so they ship with serverless/standalone deploys.
  outputFileTracingIncludes: {
    "/**": [".claude/skills/ielts-examiner/**"],
  },
  // The Multilevel paper was folded into CEFR (CEFR === the Uzbekistan Multilevel
  // exam), so the old standalone route forwards to the CEFR hub.
  async redirects() {
    return [{ source: "/multilevel", destination: "/cefr", permanent: false }];
  },

  experimental: {
    /**
     * How long the CLIENT-side Router Cache may reuse a fetched route segment.
     *
     * `dynamic` defaults to 0, and 65 of this app's 81 pages are
     * `force-dynamic`. At 0 the router keeps nothing: every navigation is a cold
     * server round trip, and so is pressing BACK — which is why moving around the
     * app feels like a website rather than an application. The user is paying
     * Vercel→Supabase latency again for a page they were looking at four seconds
     * ago.
     *
     * 30s is safe HERE specifically because mutations already invalidate: there
     * are 146 `revalidatePath` calls across 18 files, and `revalidatePath` clears
     * the client router cache for that path as well as the server one. So a
     * teacher who records a payment still sees it immediately — the staleness
     * window only applies to changes made by SOMEONE ELSE, in another session,
     * which for a school console is well within tolerance.
     *
     * If a screen ever genuinely cannot tolerate 30s of cross-user staleness,
     * the fix is `router.refresh()` on that screen, not turning this back off
     * for the whole app.
     */
    staleTimes: {
      dynamic: 30,
      static: 300,
    },

    /**
     * Prefetch the FULL page on hover, not just its loading boundary.
     *
     * Next only prefetches a dynamic route as far as the nearest `loading.tsx`,
     * so for these pages the default prefetch fetches the skeleton and nothing
     * else — the click still waits on the real server render. `dynamicOnHover`
     * upgrades a hover into a complete prefetch, so by the time the click lands
     * the payload is usually already there.
     *
     * The cost is server renders for pages the user hovered but did not open.
     * That is a real cost and worth watching in the Vercel function count; it is
     * bounded by hover intent rather than by viewport, which is what makes it
     * affordable at this app's size.
     */
    dynamicOnHover: true,
  },
};

export default nextConfig;
