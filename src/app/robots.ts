import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // the public site and the agent docs are indexable; letters and drafts are private-by-link
      allow: ["/", "/api/v1", "/api/v1/catalog", "/api/v1/openapi.json", "/llms.txt"],
      disallow: ["/c/", "/e/", "/edit/", "/api/upload", "/api/imagine", "/api/publish", "/api/card/", "/api/file/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
