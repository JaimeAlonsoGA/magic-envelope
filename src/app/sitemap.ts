import type { MetadataRoute } from "next";
import { KINDS } from "@/lib/model";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/new`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    ...KINDS.map((k) => ({ url: `${SITE_URL}/for/${k}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.9 })),
    { url: `${SITE_URL}/developers`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/llms.txt`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];
}
