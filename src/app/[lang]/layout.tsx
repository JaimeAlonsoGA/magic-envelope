import { LANGS, type Lang } from "@/lib/model";
import { Document } from "../shell";

export { metadata, viewport } from "../shell";

type Local = Exclude<Lang, "en">;
const LOCAL = LANGS.filter((l): l is Local => l !== "en");

export const dynamicParams = false;
export const generateStaticParams = () => LOCAL.map((lang) => ({ lang }));

/** /es, /fr… and their pages: the whole document is in that language. */
export default async function LocalLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  // dynamicParams is off: only the five local codes reach this layout
  return <Document lang={LOCAL.includes(lang as Local) ? (lang as Local) : "en"}>{children}</Document>;
}
