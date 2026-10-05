import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OccasionLanding } from "@/components/occasion-landing";
import { KINDS, type Kind } from "@/lib/model";
import { OCCASIONS, SITE_NAME, languageAlternates, occasionPath } from "@/lib/seo";

export const dynamicParams = false;
export const generateStaticParams = () => KINDS.map((kind) => ({ kind }));

const occasion = (k: string) => (KINDS.includes(k as Kind) ? (k as Kind) : null);

export async function generateMetadata({ params }: PageProps<"/for/[kind]">): Promise<Metadata> {
  const k = occasion((await params).kind);
  if (!k) return {};
  const o = OCCASIONS[k];
  return {
    title: o.title,
    description: o.intro,
    alternates: languageAlternates((l) => occasionPath(l, k), "en"),
    openGraph: { title: `${o.title} · ${SITE_NAME}`, description: o.intro, url: occasionPath("en", k), locale: "en" },
  };
}

/** English occasion landing pages (the other languages live under /<lang>/<slug>). */
export default async function OccasionPage({ params }: PageProps<"/for/[kind]">) {
  const k = occasion((await params).kind);
  if (!k) notFound();
  return <OccasionLanding kind={k} lang="en" />;
}
