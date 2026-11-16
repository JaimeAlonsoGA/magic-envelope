import { ArrowRight, Check, Plus } from "lucide-react";
import Link from "next/link";
import { CardView } from "@/components/card/card-view";
import { SiteFooter } from "@/components/site-footer";
import { fromPreset } from "@/lib/blocks";
import { LangProvider } from "@/lib/locale";
import type { Kind, Lang } from "@/lib/model";
import { SITE_NAME, homePath, occasionCopy, occasionPath } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { styleName, type StyleId } from "@/lib/styles";
import { UI_TEXT } from "@/lib/ui";

/**
 * Landing page per occasion and language. The letters are the page: a title, the button, and three real
 * letters in fitting styles. Each opens straight in the editor (the link decides language, occasion and
 * style, so the wizard has nothing to ask); the words a search engine needs sit below them.
 */
export function OccasionLanding({ kind, lang }: { kind: Kind; lang: Lang }) {
  const o = occasionCopy(lang, kind);
  const ui = UI_TEXT[lang];
  const start = (style?: StyleId) => `/new?kind=${kind}&lang=${lang}${style ? `&style=${style}` : ""}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: o.title,
    description: o.intro,
    inLanguage: lang,
    url: `${SITE_URL}${occasionPath(lang, kind)}`,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    potentialAction: { "@type": "CreateAction", name: o.title, target: `${SITE_URL}${start(o.styles[0])}` },
  };

  return (
    <LangProvider lang={lang}>
      <main className="mx-auto flex min-h-dvh max-w-5xl flex-col px-5 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        <nav className="font-hand"><Link href={homePath(lang)} className="text-muted hover:text-ink">← {SITE_NAME}</Link></nav>

        <header className="mx-auto mt-8 max-w-2xl text-center">
          <h1 className="text-balance font-hand text-4xl font-bold leading-tight sm:text-5xl">{o.h1}</h1>
          {/* the button opens this occasion's letter in the editor, in the first style below */}
          <Link href={start(o.styles[0])}
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-wax px-6 py-3 font-hand text-xl text-on-wax shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-offset-4 focus-visible:outline-violet">
            <Plus size={20} /> {ui.site.createFree}
          </Link>
        </header>

        {/* the real letters: swipe through them on a phone, side by side on a wide screen */}
        <section aria-label={ui.theme} className="-mx-5 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-0">
          {o.styles.map((style) => (
            <Link key={style} href={start(style)}
              className="group block w-[78%] shrink-0 snap-center rounded-md focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-violet sm:w-auto">
              {/* the letter laid out at its real width, then zoomed (not scaled) to half: the box takes its half height, so the name sits right under it */}
              <div className="max-h-[26rem] overflow-hidden transition-transform duration-200 group-hover:-translate-y-1">
                <div inert className="pointer-events-none mx-auto w-[38rem] p-3 [zoom:0.5]">
                  <CardView card={fromPreset(kind, style, lang)} shareUrl={SITE_URL} />
                </div>
              </div>
              <p className="mt-2 flex items-baseline justify-between gap-2 px-3 font-hand">
                <span className="text-lg">{styleName(style, lang)}</span>
                <span className="inline-flex items-center gap-1 text-muted transition-colors group-hover:text-wax">{ui.site.useThis} <ArrowRight size={15} /></span>
              </p>
            </Link>
          ))}
        </section>
        <p className="mt-4 text-center font-hand">
          <Link href={start()} className="text-muted underline decoration-dotted underline-offset-4 hover:text-ink">{ui.site.moreStyles}</Link>
        </p>

        {/* what it is, for whoever wants to read on (and for search engines) */}
        <section className="mx-auto mt-16 max-w-2xl">
          <h2 className="font-hand text-2xl">{ui.site.included}</h2>
          <p className="mt-3 text-muted">{o.intro}</p>
          <ul className="mt-5 grid gap-x-6 gap-y-2 font-hand text-lg sm:grid-cols-2">
            {o.points.map((p) => <li key={p} className="flex items-start gap-2"><Check size={17} className="mt-1 shrink-0 text-violet" /> {p}</li>)}
          </ul>
          <p className="mt-6"><Link href="/developers" className="text-sm text-muted underline decoration-dotted underline-offset-4 hover:text-ink">{ui.site.agentCan}</Link></p>
        </section>

        <SiteFooter lang={lang} paths={(l) => occasionPath(l, kind)} />
      </main>
    </LangProvider>
  );
}
