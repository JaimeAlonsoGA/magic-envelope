import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OccasionLanding } from "@/components/occasion-landing";
import { KINDS, LANGS, type Lang } from "@/lib/model";
import { SITE_NAME, kindFromSlug, languageAlternates, occasionCopy, occasionPath } from "@/lib/seo";
import { LOCALIZED } from "@/lib/seo-locales";

type Local = Exclude<Lang, "en">;
const LOCAL = LANGS.filter((l): l is Local => l !== "en");

export const dynamicParams = false;
export const generateStaticParams = () => LOCAL.flatMap((lang) => KINDS.map((k) => ({ lang, slug: LOCALIZED[lang].slugs[k] })));

async function resolve(params: Promise<{ lang: string; slug: string }>) {
  const { lang, slug } = await params;
  if (!LOCAL.includes(lang as Local)) return null;
  const kind = kindFromSlug(lang as Local, slug);
  return kind ? { lang: lang as Local, kind } : null;
}

export async function generateMetadata({ params }: PageProps<"/[lang]/[slug]">): Promise<Metadata> {
  const r = await resolve(params);
  if (!r) return {};
  const o = occasionCopy(r.lang, r.kind);
  return {
    title: o.title,
    description: o.intro,
    alternates: languageAlternates((l) => occasionPath(l, r.kind), r.lang),
    openGraph: { title: `${o.title} · ${SITE_NAME}`, description: o.intro, url: occasionPath(r.lang, r.kind), locale: r.lang },
  };
}

/** Occasion landing pages in Spanish, French, Portuguese, Italian and German, at native-language URLs. */
export default async function LocalOccasionPage({ params }: PageProps<"/[lang]/[slug]">) {
  const r = await resolve(params);
  if (!r) notFound();
  return <OccasionLanding kind={r.kind} lang={r.lang} />;
}
