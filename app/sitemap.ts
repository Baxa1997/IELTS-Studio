import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";

const publicRoutes = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/grade", priority: 0.85, changeFrequency: "monthly" },
  { path: "/pricing", priority: 0.75, changeFrequency: "monthly" },
  { path: "/start", priority: 0.65, changeFrequency: "monthly" },
  { path: "/sign-in", priority: 0.3, changeFrequency: "yearly" },
  { path: "/sign-up", priority: 0.3, changeFrequency: "yearly" },
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
