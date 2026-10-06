import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { FAQ, faqJsonLd } from "@/lib/faq";
import { LangProvider } from "@/lib/locale";
import type { Lang } from "@/lib/model";
import { SITE_NAME, faqPath, homePath } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

/** The public answers, in the page's language. The JSON-LD matches the questions on the page. */
export function FaqPage({ lang }: { lang: Lang }) {
  const page = FAQ[lang];
  const jsonLd = JSON.stringify(faqJsonLd(lang, `${SITE_URL}${faqPath(lang)}`)).replace(/</g, "\\u003c");
  return (
    <LangProvider lang={lang}>
      <main lang={lang} className="mx-auto flex min-h-dvh max-w-3xl flex-col px-5 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
        <nav className="font-hand"><Link href={homePath(lang)} className="text-muted hover:text-ink">← {SITE_NAME}</Link></nav>
        <header className="mt-10">
          <h1 className="font-hand text-4xl font-bold leading-tight sm:text-5xl">{page.title}</h1>
          <p className="mt-4 text-lg text-muted">{page.intro}</p>
        </header>
        <div className="mt-10 space-y-8">
          {page.items.map((item) => (
            <section key={item.q}>
              <h2 className="font-hand text-2xl">{item.q}</h2>
              <p className="mt-2 text-lg leading-relaxed">{item.a}</p>
            </section>
          ))}
        </div>
        <SiteFooter lang={lang} paths={faqPath} />
      </main>
    </LangProvider>
  );
}
