import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The AI grader reads the `ielts-examiner` skill (rubric, taxonomy, anchors,
  // output schema) from disk at runtime. Trace those files into the server
  // bundle so they ship with serverless/standalone deploys.
  outputFileTracingIncludes: {
    "/**": [".claude/skills/ielts-examiner/**"],
  },
};

export default nextConfig;
