"use client";

/**
 * The UI language in React. Localized pages (/es, /fr…) state it in the URL and provide it to
 * everything below them; elsewhere (editor, wizard) it's this device's language (lib/lang.ts).
 * The server renders English for unlocalized pages; the client switches after hydration.
 */
import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { detectLang, rememberLang } from "./lang";
import type { Lang } from "./model";
import { UI_TEXT } from "./ui";

const PageLang = createContext<Lang | null>(null);

/** A page in a known language. Reading it counts as choosing it, so the app follows. */
export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  useEffect(() => rememberLang(lang), [lang]);
  return <PageLang.Provider value={lang}>{children}</PageLang.Provider>;
}

const noop = () => () => {};

export function useLang(): Lang {
  const page = useContext(PageLang);
  const device = useSyncExternalStore(noop, detectLang, () => "en" as Lang);
  return page ?? device;
}

export const useUI = () => UI_TEXT[useLang()];
