/**
 * Which language a person reads the app in. Shared by the proxy (Accept-Language), the client
 * (cookie, then browser) and the letter defaults. The UI dictionary is picked with useUI().
 */
import { LANGS, type Lang } from "./model";

export const LANG_COOKIE = "lang";

export const isLang = (l: string | undefined | null): l is Lang => !!l && (LANGS as readonly string[]).includes(l);

/** First supported language in a preference list (navigator.languages, or Accept-Language parts). */
export function pickLang(list: readonly string[]): Lang | null {
  for (const l of list) {
    const code = l.trim().slice(0, 2).toLowerCase();
    if (isLang(code)) return code;
  }
  return null;
}

/** "es-ES,es;q=0.9,en;q=0.8" → languages by preference. */
export const acceptLanguages = (header: string | null) =>
  (header ?? "").split(",").map((p) => {
    const [tag, q] = p.trim().split(";q=");
    return { tag, q: q ? Number(q) : 1 };
  }).filter((x) => x.tag && x.q > 0).sort((a, b) => b.q - a.q).map((x) => x.tag);

/** This device's language: an explicit choice (cookie) first, then the browser's preference. */
export function detectLang(): Lang {
  if (typeof document === "undefined") return "en";
  const chosen = document.cookie.match(/(?:^|;\s*)lang=([a-z]{2})/)?.[1];
  if (isLang(chosen)) return chosen;
  return pickLang(navigator.languages?.length ? navigator.languages : [navigator.language]) ?? "en";
}

/** Remember an explicit choice (a language link, or reading a localized page). */
export function rememberLang(l: Lang) {
  document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
}
