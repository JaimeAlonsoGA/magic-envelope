import type { MetadataRoute } from "next";
import { KINDS, LANGS, type Lang } from "@/lib/model";
import { faqPath, homePath, occasionPath } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

/** Every public page in every language, each listing its translations (hreflang). */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const everyLang = (path: (l: Lang) => string, priority: number): MetadataRoute.Sitemap =>
    LANGS.map((lang) => ({
      url: `${SITE_URL}${path(lang)}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority,
      alternates: { languages: Object.fromEntries(LANGS.map((l) => [l, `${SITE_URL}${path(l)}`])) },
    }));
  return [
    ...everyLang(homePath, 1),
    ...everyLang(faqPath, 0.8),
    ...KINDS.flatMap((k) => everyLang((l) => occasionPath(l, k), 0.9)),
    { url: `${SITE_URL}/new`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/developers`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/llms.txt`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/api/v1/openapi.json`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
  ];
}
