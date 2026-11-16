import type { Metadata } from "next";
import { FaqPage } from "@/components/faq-page";
import { FAQ } from "@/lib/faq";
import { OG_IMAGE, faqPath, languageAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: FAQ.en.title,
  description: FAQ.en.intro,
  alternates: languageAlternates(faqPath, "en"),
  openGraph: { type: "website", siteName: "Magic Envelope", title: FAQ.en.title, description: FAQ.en.intro, url: "/faq", images: [OG_IMAGE] },
};

export default function Page() {
  return <FaqPage lang="en" />;
}
