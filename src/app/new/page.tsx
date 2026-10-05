import type { Metadata } from "next";
import { Wizard } from "@/components/wizard";
import { KINDS, LANGS, type Kind, type Lang } from "@/lib/model";
import { STYLE_IDS, type StyleId } from "@/lib/styles";

export const metadata: Metadata = {
  title: "Create a letter",
  description: "Pick a language, a style and an occasion — or start blank. Free, no account.",
  alternates: { canonical: "/new" },
};

export default async function NewPage({ searchParams }: PageProps<"/new">) {
  const sp = await searchParams;
  const style = STYLE_IDS.includes(sp.style as StyleId) ? (sp.style as StyleId) : undefined;
  const kind = KINDS.includes(sp.kind as Kind) ? (sp.kind as Kind) : undefined;
  const lang = LANGS.includes(sp.lang as Lang) ? (sp.lang as Lang) : undefined;
  return <Wizard initialStyle={style} initialKind={kind} initialLang={lang} />;
}
