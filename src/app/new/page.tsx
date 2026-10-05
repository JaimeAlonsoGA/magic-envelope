import type { Metadata } from "next";
import { Wizard } from "@/components/wizard";
import { KINDS, type Kind } from "@/lib/model";
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
  return <Wizard initialStyle={style} initialKind={kind} />;
}
