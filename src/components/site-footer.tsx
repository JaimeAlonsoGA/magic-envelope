import { Bot, Coffee } from "lucide-react";
import Link from "next/link";
import { t } from "@/lib/i18n";
import { KINDS, LANGS, type Lang } from "@/lib/model";
import { faqPath, homePath, occasionPath } from "@/lib/seo";
import { UI_TEXT } from "@/lib/ui";
import { LangLink } from "./lang-link";

export const COFFEE_URL = "https://buymeacoffee.com/jaimehuman";

/**
 * Site footer, in the page's language: occasions (localized landing pages), agent access,
 * support, credit, and the same page in every other language.
 */
export function SiteFooter({ lang = "en", paths = homePath }: { lang?: Lang; paths?: (l: Lang) => string }) {
  const ui = UI_TEXT[lang];
  const link = "text-muted transition-colors hover:text-ink";
  return (
    <footer className="mt-24 w-full border-t border-dashed border-ink/15 pt-10 font-hand">
      <div className="grid gap-8 sm:grid-cols-3">
        <nav aria-label={ui.site.makeInvitation}>
          <h2 className="mb-2 text-lg">{ui.site.makeInvitation}</h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
            {KINDS.map((k) => <li key={k}><Link className={link} href={occasionPath(lang, k)}>{ui.kinds[k]}</Link></li>)}
            <li className="col-span-2 mt-2"><Link className={link} href={faqPath(lang)}>{ui.site.faq}</Link></li>
          </ul>
        </nav>
        <nav aria-label={ui.site.forAgents}>
          <h2 className="mb-2 flex items-center gap-1.5 text-lg"><Bot size={18} /> {ui.site.forAgents}</h2>
          <ul className="space-y-1">
            <li><Link className={link} href="/developers">{ui.site.apiDocs}</Link></li>
            <li><a className={link} href="/llms.txt">llms.txt</a></li>
            <li><a className={link} href="/api/v1/openapi.json">OpenAPI</a></li>
          </ul>
        </nav>
        <div>
          <h2 className="mb-2 text-lg">{ui.site.freeForever}</h2>
          <p className="mb-3 text-muted">{ui.site.noAds}</p>
          <a href={COFFEE_URL} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#ffdd00] px-4 py-2 text-[#1e1e1e] shadow-sm transition-transform hover:-translate-y-0.5 active:translate-y-0">
            <Coffee size={18} /> {ui.site.coffee}
          </a>
        </div>
      </div>
      <nav aria-label={ui.site.languages} className="mt-10 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
        {LANGS.map((l) => l === lang
          ? <span key={l} aria-current="page" className="text-ink">{t(l).langName}</span>
          : <LangLink key={l} lang={l} href={paths(l)} className={link}>{t(l).langName}</LangLink>)}
      </nav>
      <p className="mt-4 pb-4 text-center text-sm text-muted">
        Magic Envelope · {ui.site.madeBy} <a className="underline decoration-dotted underline-offset-4 hover:text-ink" href="https://jaimealonso.dev" target="_blank" rel="noopener">Jaime Alonso</a>
      </p>
    </footer>
  );
}
