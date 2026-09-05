import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";

// NOTE: /pricing is deliberately absent. It lives under app/(app) and calls
// requireOrgUser(), so an anonymous request 307s to /sign-in — listing it here
// advertised a URL no crawler could index. The public pricing lives in the
// landing page's #pricing section.
const publicRoutes = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/grade", priority: 0.85, changeFrequency: "monthly" },
  { path: "/demo", priority: 0.8, changeFrequency: "monthly" },
  { path: "/ielts-practice", priority: 0.8, changeFrequency: "monthly" },
  { path: "/ielts-writing-practice", priority: 0.8, changeFrequency: "monthly" },
  { path: "/ielts-reading-practice", priority: 0.8, changeFrequency: "monthly" },
  { path: "/ielts-listening-practice", priority: 0.8, changeFrequency: "monthly" },
  { path: "/ielts-speaking-practice", priority: 0.8, changeFrequency: "monthly" },
  { path: "/cefr-multilevel-practice", priority: 0.8, changeFrequency: "monthly" },
  { path: "/for-education-centers", priority: 0.8, changeFrequency: "monthly" },
  { path: "/start", priority: 0.65, changeFrequency: "monthly" },
  { path: "/sign-in", priority: 0.3, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.4, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
] satisfies Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}>;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return publicRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
