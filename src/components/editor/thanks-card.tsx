"use client";

import { Check, Coffee, Share2, Star, X } from "lucide-react";
import { useState } from "react";
import { useFlash } from "@/lib/hooks";
import { useLang, useUI } from "@/lib/locale";
import { share } from "@/lib/native";
import { homePath } from "@/lib/seo";
import { COFFEE_URL } from "../site-footer";

const KEY = "me:thanks";
type Memory = { rated?: number; hiddenAt?: number };
const MONTH = 30 * 864e5;

function recall(): Memory {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Memory;
  } catch {
    return {};
  }
}
function remember(m: Memory) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...recall(), ...m }));
  } catch {}
}

/**
 * The thank-you after a letter goes out: rate the app in one tap (real ratings back the stars in
 * search results), then pass Magic Envelope on (its link, to share) and, below, a coffee. Closing
 * it keeps it away for a month; it never interrupts anything.
 */
export function ThanksCard() {
  const ui = useUI();
  const t = ui.thanks;
  const [mem, setMem] = useState(recall);
  const [hidden, setHidden] = useState(() => { const at = recall().hiddenAt; return !!at && Date.now() - at < MONTH; });
  const [hover, setHover] = useState(0);
  if (hidden) return null;

  const rate = (stars: number) => {
    void fetch("/api/rate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ stars }) }).catch(() => {});
    remember({ rated: stars });
    setMem(recall());
  };
  const hide = () => {
    remember({ hiddenAt: Date.now() });
    setHidden(true);
  };

  return (
    <aside className="relative rounded-xl border border-dashed border-ink/20 bg-highlight/30 p-4 pr-10 font-hand" aria-live="polite">
      <button type="button" onClick={hide} aria-label={t.close} title={t.close}
        className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-ink/5 hover:text-ink">
        <X size={16} />
      </button>
      {!mem.rated ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-lg">{t.howWasIt}</span>
          <div className="flex" role="radiogroup" aria-label={t.howWasIt} onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={false} aria-label={t.stars(n)} title={t.stars(n)}
                onMouseEnter={() => setHover(n)} onFocus={() => setHover(n)} onClick={() => rate(n)}
                className="grid h-9 w-9 place-items-center rounded-md text-[#d29a12] hover:bg-ink/5">
                <Star size={22} fill={n <= hover ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-lg leading-snug">{t.thankYou} <span className="text-muted">{t.passItOn}</span></p>
          <PassItOn />
          <a href={COFFEE_URL} target="_blank" rel="noopener noreferrer"
            className="flex w-fit items-center gap-2 rounded-full bg-[#ffdd00] px-4 py-2 text-[#1e1e1e] shadow-sm transition-transform hover:-translate-y-0.5 active:translate-y-0">
            <Coffee size={18} /> {ui.site.coffee}
          </a>
        </div>
      )}
    </aside>
  );
}

/** The app's own link, to pass on: the share sheet on phones, copied on desktops. Opens in the sharer's language. */
function PassItOn() {
  const ui = useUI();
  const lang = useLang();
  const [copied, flash] = useFlash();
  const url = `${location.origin}${homePath(lang)}`;
  return (
    <button type="button" onClick={() => share({ title: "Magic Envelope", text: ui.site.tagline, url }).then((r) => r === "copied" && flash())}
      className="flex w-fit items-center gap-2 rounded-full border border-ink/15 bg-sheet px-4 py-1.5 font-mono text-sm hover:border-ink/30">
      {url.replace(/^https?:\/\//, "")}
      {copied ? <Check size={16} className="text-violet" /> : <Share2 size={16} />}
    </button>
  );
}
