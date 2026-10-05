import type { Metadata } from "next";
import { Home } from "@/components/home";
import { LangProvider } from "@/lib/locale";
import { homePath, languageAlternates, siteJsonLd } from "@/lib/seo";

export const metadata: Metadata = { alternates: languageAlternates(homePath, "en") };

export default function Page() {
  return (
    <LangProvider lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd("en")) }} />
      <Home />
    </LangProvider>
  );
}
