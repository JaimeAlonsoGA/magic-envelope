"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { rememberLang } from "@/lib/lang";
import type { Lang } from "@/lib/model";

/** A link to the same page in another language. Choosing it is remembered, so "/" stops redirecting. */
export function LangLink({ lang, ...props }: { lang: Lang } & ComponentProps<typeof Link>) {
  return <Link hrefLang={lang} lang={lang} {...props} onClick={() => rememberLang(lang)} />;
}
