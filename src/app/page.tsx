import { Home } from "@/components/home";
import { DESCRIPTION, SITE_NAME } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

/** Structured data: a free web application, with the agent API as a documented entry point. */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  description: DESCRIPTION,
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web, iOS, Android",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  inLanguage: ["en", "es", "fr", "pt", "it", "de"],
  author: { "@type": "Person", name: "Jaime Alonso", url: "https://jaimealonso.dev" },
  potentialAction: { "@type": "CreateAction", target: `${SITE_URL}/new` },
  sameAs: [`${SITE_URL}/llms.txt`],
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Home />
    </>
  );
}
