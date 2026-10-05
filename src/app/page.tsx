import type { Metadata } from "next";
import { Home } from "@/components/home";
import { LangProvider } from "@/lib/locale";
import { homePath, languageAlternates, siteJsonLd } from "@/lib/seo";
import { ratingSummary } from "@/lib/store.server";

export const metadata: Metadata = { alternates: languageAlternates(homePath, "en") };
export const revalidate = 3600; // picks up new ratings

export default async function Page() {
  const rating = await ratingSummary().catch(() => undefined);
  return (
    <LangProvider lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd("en", rating)) }} />
      <Home />
    </LangProvider>
  );
}
