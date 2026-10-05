import { NextResponse, type NextRequest } from "next/server";
import { LANG_COOKIE, acceptLanguages, isLang, pickLang } from "@/lib/lang";

/** Crawlers index each language at its own URL (hreflang), so they always get the page they asked for. */
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|lighthouse|headless/i;

/**
 * The home page speaks the visitor's language: an explicit choice (cookie) first, then the
 * browser's Accept-Language. English stays at "/", the rest live at /es, /fr…
 */
export function proxy(req: NextRequest) {
  if (BOT.test(req.headers.get("user-agent") ?? "")) return NextResponse.next();
  const chosen = req.cookies.get(LANG_COOKIE)?.value;
  const lang = isLang(chosen) ? chosen : pickLang(acceptLanguages(req.headers.get("accept-language")));
  if (!lang || lang === "en") return NextResponse.next();
  const res = NextResponse.redirect(new URL(`/${lang}${req.nextUrl.search}`, req.url), 307);
  res.headers.set("vary", "accept-language, cookie");
  return res;
}

export const config = { matcher: "/" };
