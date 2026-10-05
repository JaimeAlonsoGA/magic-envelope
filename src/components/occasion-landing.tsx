import { Check, Plus } from "lucide-react";
import Link from "next/link";
import { CardView } from "@/components/card/card-view";
import { SiteFooter } from "@/components/site-footer";
import { fromPreset } from "@/lib/blocks";
import { LangProvider } from "@/lib/locale";
import type { Kind, Lang } from "@/lib/model";
import { SITE_NAME, homePath, occasionCopy, occasionPath } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { STYLES } from "@/lib/styles";
import { UI_TEXT } from "@/lib/ui";

/** Landing page per occasion and language: what you get, three live letters in fitting styles, deep links into the wizard. */
export function OccasionLanding({ kind, lang }: { kind: Kind; lang: Lang }) {
  const o = occasionCopy(lang, kind);
  const ui = UI_TEXT[lang];
  const start = (style?: string) => `/new?kind=${kind}&lang=${lang}${style ? `&style=${style}` : ""}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: o.title,
    description: o.intro,
    inLanguage: lang,
    url: `${SITE_URL}${occasionPath(lang, kind)}`,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    potentialAction: { "@type": "CreateAction", name: o.title, target: `${SITE_URL}${start()}` },
  };

  return (
    <LangProvider lang={lang}>
      <main lang={lang} className="mx-auto flex min-h-dvh max-w-5xl flex-col px-5 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <nav className="font-hand"><Link href={homePath(lang)} className="text-muted hover:text-ink">← {SITE_NAME}</Link></nav>

        <header className="mx-auto mt-10 max-w-2xl text-center">
          <h1 className="font-hand text-4xl font-bold leading-tight sm:text-5xl">{o.h1}</h1>
          <p className="mt-4 text-lg text-muted">{o.intro}</p>
          <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 font-hand">
            {o.points.map((p) => <li key={p} className="flex items-center gap-1.5"><Check size={16} className="text-violet" /> {p}</li>)}
          </ul>
          <Link href={start()}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-wax px-6 py-3 font-hand text-xl text-on-wax shadow-sm transition-transform hover:-translate-y-0.5">
            <Plus size={20} /> {ui.site.createFree}
          </Link>
        </header>

        {/* live previews: the real letters in this language, each a deep link into the wizard with that style */}
        <section aria-label={ui.theme} className="mt-14 grid gap-6 sm:grid-cols-3">
          {o.styles.map((style) => (
            <Link key={style} href={start(style)} className="group block rounded-md focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-violet">
              <div className="h-80 overflow-hidden [mask-image:linear-gradient(to_bottom,#000_80%,transparent)] transition-transform duration-200 group-hover:-translate-y-1">
                <div inert className="pointer-events-none w-[200%] origin-top-left scale-50 p-3">
                  <CardView card={fromPreset(kind, style, lang)} shareUrl={SITE_URL} />
                </div>
              </div>
              <p className="mt-2 px-3 font-hand text-lg">{STYLES[style].name}</p>
            </Link>
          ))}
        </section>

        <SiteFooter lang={lang} paths={(l) => occasionPath(l, kind)} />
      </main>
    </LangProvider>
  );
}
