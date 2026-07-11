import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";

const publicRoutes = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/grade", priority: 0.85, changeFrequency: "monthly" },
  { path: "/ielts-practice", priority: 0.8, changeFrequency: "monthly" },
  { path: "/cambridge-ielts-practice", priority: 0.8, changeFrequency: "monthly" },
  { path: "/vs/engnovate", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/ielts-gg", priority: 0.7, changeFrequency: "monthly" },
  { path: "/pricing", priority: 0.75, changeFrequency: "monthly" },
  { path: "/start", priority: 0.65, changeFrequency: "monthly" },
  { path: "/sign-in", priority: 0.3, changeFrequency: "yearly" },
  { path: "/sign-up", priority: 0.3, changeFrequency: "yearly" },
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
