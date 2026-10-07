/**
 * Search/agent-facing copy. One place for the words that describe Magic Envelope and each occasion,
 * used by metadata, the /for/<occasion> landing pages, the sitemap and structured data.
 */
import { KINDS, LANGS, type Kind, type Lang } from "./model";
import { LOCALIZED } from "./seo-locales";
import { SITE_URL } from "./site";
import type { StyleId } from "./styles";

export type Occasion = { title: string; h1: string; intro: string; styles: StyleId[]; points: string[] };

/** The words a person actually says. An agent matches the request to this list, then uses that preset. */
export const PRESET_FOR: Record<Kind, readonly string[]> = {
  wedding: ["wedding", "boda", "mariage", "casamento", "matrimonio", "Hochzeit"],
  birthday: ["birthday", "cumpleaños", "aniversário", "anniversaire", "compleanno", "Geburtstag"],
  party: ["party", "house party", "fiesta", "fiesta en casa", "quedada", "hangout", "get-together", "fête", "festa", "Houseparty"],
  baby: ["baby shower", "chá de bebê", "babyshower"],
  dinner: ["dinner", "cena", "dîner", "jantar", "Abendessen"],
  graduation: ["graduation", "graduación", "formatura", "remise de diplôme", "laurea", "Abschluss"],
  event: ["event", "evento", "meetup", "cineforum", "cinefórum", "film club", "actividad", "taller", "workshop", "activité"],
  letter: ["letter", "carta", "lettre", "Brief"],
};
export type SiteCopy = { title: string; description: string };

export const SITE_NAME = "Magic Envelope";
export const TAGLINE = "Free invitations that arrive in a sealed envelope";
export const DESCRIPTION =
  "Create beautiful invitations and letters for free — weddings, birthdays, parties, baby showers and more. Each guest gets their own link with their name on the envelope, one-tap RSVP, map and calendar. Or download them as images. No account.";

export const OCCASIONS: Record<Kind, Occasion> = {
  wedding: {
    title: "Free wedding invitations online",
    h1: "Wedding invitations, sealed with wax",
    intro: "Send each guest their own wedding invitation: their name on the envelope, the ceremony and reception times, a map, a dress code moodboard, your gift list and one-tap RSVP.",
    styles: ["parchment", "romance", "deco"],
    points: ["Personal link for every guest", "RSVP by WhatsApp, SMS or email", "Schedule, dress code and gift list", "Download as images to print or share"],
  },
  birthday: {
    title: "Free birthday invitations online",
    h1: "Birthday invitations they'll actually open",
    intro: "A birthday invitation that arrives in an envelope with the guest's name, a countdown to the party, the place on a map and one-tap replies.",
    styles: ["notebook", "bubblegum", "confetti"],
    points: ["Live countdown to the party", "Add to calendar in one tap", "Personal link per friend", "Free, no account"],
  },
  party: {
    title: "Free party invitations online",
    h1: "Party invitations with style",
    intro: "A house party, a get-together or a night out: pick a look, add the place, the music and a dress code, and send everyone their own invitation. It can be tonight.",
    styles: ["groovy", "launch", "midnight"],
    points: ["Playlist and dress code", "Map and directions", "One-tap RSVP", "Share as a link or an image"],
  },
  baby: {
    title: "Free baby shower invitations online",
    h1: "Baby shower invitations",
    intro: "Soft, warm baby shower invitations with the date, the place, a gift list and replies straight to your phone.",
    styles: ["bubblegum", "romance", "botanical"],
    points: ["Gift list or bank details", "Personal link per guest", "RSVP to your phone", "Download as images"],
  },
  dinner: {
    title: "Free dinner invitations online",
    h1: "Dinner invitations",
    intro: "Invite people to your table with a letter: the menu or schedule, the address and a simple way to say yes.",
    styles: ["botanical", "ivory", "minimal"],
    points: ["Schedule or menu", "Address with map", "One-tap RSVP", "Free, no account"],
  },
  graduation: {
    title: "Free graduation party invitations online",
    h1: "Graduation invitations",
    intro: "Celebrate the milestone: a graduation invitation with a countdown, the place and replies from everyone you want there.",
    styles: ["midnight", "parchment", "launch"],
    points: ["Countdown to the day", "Map and calendar", "Personal link per guest", "Download as images"],
  },
  event: {
    title: "Free event invitations online",
    h1: "Event invitations",
    intro: "A film club, a workshop, a meetup or a launch: a clean invitation with the agenda, the place, links and a QR code to check in.",
    styles: ["launch", "minimal", "brutal"],
    points: ["Agenda and links", "QR code", "Personal invitation per attendee", "API for agents and automations"],
  },
  letter: {
    title: "Write a letter online, sealed in an envelope",
    h1: "A letter, sealed in an envelope",
    intro: "Some things only fit in a letter. Write it, seal it with wax, and send it — it opens like real mail.",
    styles: ["parchment", "typewriter", "ivory"],
    points: ["Opens like real mail", "Wax seal with your initials", "Printable", "Free, no account"],
  },
};

/* ───────────── Languages ───────────── */

export const siteCopy = (lang: Lang): SiteCopy =>
  lang === "en" ? { title: `${SITE_NAME} — ${TAGLINE}`, description: DESCRIPTION } : LOCALIZED[lang].site;

export const occasionCopy = (lang: Lang, kind: Kind): Occasion => (lang === "en" ? OCCASIONS[kind] : LOCALIZED[lang].occasions[kind]);

/** English lives at the root (/, /for/wedding); other languages under their code with native slugs. */
export const homePath = (lang: Lang) => (lang === "en" ? "/" : `/${lang}`);
export const faqPath = (lang: Lang) => (lang === "en" ? "/faq" : `/${lang}/faq`);
export const occasionPath = (lang: Lang, kind: Kind) => (lang === "en" ? `/for/${kind}` : `/${lang}/${LOCALIZED[lang].slugs[kind]}`);

export const kindFromSlug = (lang: Exclude<Lang, "en">, slug: string) =>
  KINDS.find((k) => LOCALIZED[lang].slugs[k] === slug) ?? null;

/** hreflang links for a page that exists in every language (x-default is the English one). */
export function languageAlternates(path: (l: Lang) => string, lang: Lang) {
  const languages: Record<string, string> = Object.fromEntries(LANGS.map((l) => [l, path(l)]));
  languages["x-default"] = path("en");
  return { canonical: path(lang), languages };
}

/**
 * Structured data for the home page: a free web app, in this language. The rating is the real one
 * people leave after sending a letter, shown once there are enough of them to mean something.
 */
export const siteJsonLd = (lang: Lang, rating?: { count: number; average: number }) => ({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: `${SITE_URL}${homePath(lang)}`,
  description: siteCopy(lang).description,
  inLanguage: lang,
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web, iOS, Android",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  availableLanguage: LANGS,
  author: { "@type": "Person", name: "Jaime Alonso", url: "https://jaimealonso.dev" },
  potentialAction: { "@type": "CreateAction", target: `${SITE_URL}/new` },
  ...(rating && rating.count >= 3
    ? { aggregateRating: { "@type": "AggregateRating", ratingValue: rating.average.toFixed(1), ratingCount: rating.count, bestRating: 5, worstRating: 1 } }
    : {}),
});
