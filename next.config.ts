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
};

export default nextConfig;
