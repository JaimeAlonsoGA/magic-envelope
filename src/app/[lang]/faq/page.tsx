import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FaqPage } from "@/components/faq-page";
import { FAQ } from "@/lib/faq";
import { LANGS, type Lang } from "@/lib/model";
import { faqPath, languageAlternates } from "@/lib/seo";

type Local = Exclude<Lang, "en">;
const LOCAL = LANGS.filter((l): l is Local => l !== "en");

export const dynamicParams = false;
export const generateStaticParams = () => LOCAL.map((lang) => ({ lang }));

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!LOCAL.includes(lang as Local)) return {};
  const page = FAQ[lang as Local];
  return {
    title: page.title,
    description: page.intro,
    alternates: languageAlternates(faqPath, lang as Local),
    openGraph: { title: page.title, description: page.intro, url: faqPath(lang as Local), locale: lang },
  };
}

export default async function LocalFaq({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!LOCAL.includes(lang as Local)) notFound();
  return <FaqPage lang={lang as Local} />;
}
