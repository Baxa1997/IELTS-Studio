import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api",
        "/auth",
        "/console",
        "/dashboard",
        "/activities",
        "/listen",
        "/speak",
        "/read",
        "/write",
        "/plan",
        "/vocabulary",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
