import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Home } from "@/components/home";
import { LangProvider } from "@/lib/locale";
import { LANGS, type Lang } from "@/lib/model";
import { homePath, languageAlternates, siteCopy, siteJsonLd } from "@/lib/seo";

type Local = Exclude<Lang, "en">;
const LOCAL = LANGS.filter((l): l is Local => l !== "en");
const local = (l: string) => (LOCAL.includes(l as Local) ? (l as Local) : null);

export const dynamicParams = false;
export const generateStaticParams = () => LOCAL.map((lang) => ({ lang }));

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const lang = local((await params).lang);
  if (!lang) return {};
  const c = siteCopy(lang);
  return {
    title: { absolute: c.title },
    description: c.description,
    alternates: languageAlternates(homePath, lang),
    openGraph: { title: c.title, description: c.description, url: homePath(lang), locale: lang },
    twitter: { title: c.title, description: c.description },
  };
}

/** The home page in Spanish, French, Portuguese, Italian or German. */
export default async function LocalHome({ params }: PageProps<"/[lang]">) {
  const lang = local((await params).lang);
  if (!lang) notFound();
  return (
    <LangProvider lang={lang}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd(lang)) }} />
      <div lang={lang}><Home /></div>
    </LangProvider>
  );
}
