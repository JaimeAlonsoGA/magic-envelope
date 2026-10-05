import { Check, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CardView } from "@/components/card/card-view";
import { SiteFooter } from "@/components/site-footer";
import { fromPreset } from "@/lib/blocks";
import { KINDS, type Kind } from "@/lib/model";
import { OCCASIONS, SITE_NAME } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { STYLES } from "@/lib/styles";
import { KIND_LABEL } from "@/lib/ui";

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
    alternates: { canonical: `/for/${k}` },
    openGraph: { title: `${o.title} · ${SITE_NAME}`, description: o.intro, url: `/for/${k}` },
  };
}

/** Landing page per occasion: what you get, three live previews in fitting styles, and deep links into the wizard. */
export default async function OccasionPage({ params }: PageProps<"/for/[kind]">) {
  const k = occasion((await params).kind);
  if (!k) notFound();
  const o = OCCASIONS[k];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: o.title,
    description: o.intro,
    url: `${SITE_URL}/for/${k}`,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    potentialAction: { "@type": "CreateAction", name: `Create a ${KIND_LABEL[k].toLowerCase()} invitation`, target: `${SITE_URL}/new?kind=${k}` },
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col px-5 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="font-hand"><Link href="/" className="text-muted hover:text-ink">← {SITE_NAME}</Link></nav>

      <header className="mx-auto mt-10 max-w-2xl text-center">
        <h1 className="font-hand text-4xl font-bold leading-tight sm:text-5xl">{o.h1}</h1>
        <p className="mt-4 text-lg text-muted">{o.intro}</p>
        <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 font-hand">
          {o.points.map((p) => <li key={p} className="flex items-center gap-1.5"><Check size={16} className="text-violet" /> {p}</li>)}
        </ul>
        <Link href={`/new?kind=${k}`}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-wax px-6 py-3 font-hand text-xl text-white shadow-sm transition-transform hover:-translate-y-0.5">
          <Plus size={20} /> Create yours — free
        </Link>
      </header>

      {/* live previews: the real letters, each a deep link into the wizard with that style */}
      <section aria-label="Styles" className="mt-14 grid gap-6 sm:grid-cols-3">
        {o.styles.map((style) => (
          <Link key={style} href={`/new?kind=${k}&style=${style}`} className="group block rounded-md focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-violet">
            <div className="h-80 overflow-hidden [mask-image:linear-gradient(to_bottom,#000_80%,transparent)] transition-transform duration-200 group-hover:-translate-y-1">
              <div inert className="pointer-events-none w-[200%] origin-top-left scale-50 p-3">
                <CardView card={fromPreset(k, style, "en")} shareUrl={SITE_URL} />
              </div>
            </div>
            <p className="mt-2 px-3 font-hand text-lg">{STYLES[style].name}</p>
          </Link>
        ))}
      </section>

      <SiteFooter />
    </main>
  );
}
