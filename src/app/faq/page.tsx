import type { Metadata } from "next";
import { FaqPage } from "@/components/faq-page";
import { FAQ } from "@/lib/faq";
import { faqPath, languageAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: FAQ.en.title,
  description: FAQ.en.intro,
  alternates: languageAlternates(faqPath, "en"),
  openGraph: { title: FAQ.en.title, description: FAQ.en.intro, url: "/faq" },
};

export default function Page() {
  return <FaqPage lang="en" />;
}
