"use client";

import { useUI } from "@/lib/locale";
import { Check, RotateCcw } from "lucide-react";
import { FLAGS } from "@/lib/i18n";
import { ENVELOPE_PAPERS } from "@/lib/mail";
import { LANGS, type Card } from "@/lib/model";
import { FONTS, FONT_IDS, STYLES, STYLE_IDS, resolveStyle, type Custom, type FontId } from "@/lib/styles";
import { cardStyle } from "../card/card-view";
import { SketchButton } from "../sketch";
import { StyleSwatch } from "../style-swatch";


const Section = ({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) => (
  <section className="space-y-2.5">
    <div className="flex items-center justify-between"><h3 className="text-sm text-muted">{title}</h3>{action}</div>
    {children}
  </section>
);

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 hover:bg-ink/5">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}
        className="h-9 w-9 cursor-pointer appearance-none rounded-full border border-ink/15 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0" />
      <span className="text-base">{label}</span>
    </label>
  );
}

function FontPicker({ label, value, onChange }: { label: string; value: FontId; onChange: (f: FontId) => void }) {
  return (
    <div className="space-y-1.5">
      <span className="text-sm text-muted">{label}</span>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {FONT_IDS.map((f) => (
          <button key={f} type="button" role="radio" aria-checked={value === f} onClick={() => onChange(f)}
            className={`rounded-md border px-2.5 py-1.5 text-sm transition-colors ${value === f ? "border-violet bg-violet-soft/40" : "border-ink/15 hover:bg-ink/5"}`}
            style={{ fontFamily: FONTS[f].css, fontSize: `calc(.9rem * ${FONTS[f].body})` }}>
            {FONTS[f].label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** How a letter looks: its style, colors, fonts and language. (The envelope is edited on its own canvas.) */
export function StylePanel({ card, setCard, link }: { card: Card; setCard: (p: Partial<Card>) => void; link: boolean }) {
  const ui = useUI();
  const s = cardStyle(card);
  const custom = card.custom ?? {};
  const setCustom = (patch: Custom) => {
    const next = { ...custom, ...patch };
    (Object.keys(next) as (keyof Custom)[]).forEach((k) => next[k] === undefined && delete next[k]);
    setCard({ custom: Object.keys(next).length ? next : undefined });
  };

  return (
    <div className="space-y-6">
      <Section title={ui.theme}>
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
          {STYLE_IDS.map((id) => {
            const on = card.style === id;
            return (
              <button key={id} type="button" aria-pressed={on} onClick={() => setCard({ style: id, custom: undefined })} className="group text-left">
                <span className={`block rounded-[6px] outline-2 outline-offset-2 transition ${on ? "outline outline-violet" : "outline-transparent group-hover:outline-ink/20 group-hover:outline"}`}>
                  <StyleSwatch s={resolveStyle(id)} className="aspect-[4/3] text-base" />
                </span>
                <span className="mt-1 flex items-center gap-1 text-sm">{on && <Check size={13} className="text-violet" />}{STYLES[id].name}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title={ui.customize} action={card.custom && (
        <button type="button" onClick={() => setCard({ custom: undefined })} className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <RotateCcw size={13} /> Reset
        </button>
      )}>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <ColorField label={ui.accent} value={s.accent} onChange={(accent) => setCustom({ accent })} />
          <ColorField label={ui.paper} value={s.paper} onChange={(paper) => setCustom({ paper })} />
          <ColorField label={ui.ink} value={s.ink} onChange={(ink) => setCustom({ ink })} />
        </div>
        {/* envelopes only exist for links; their paper comes from a curated set so it always looks right */}
        {link && (
          <div className="space-y-1.5">
            <span className="text-sm text-muted">{ui.envelope}</span>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={ui.envelopePaper}>
              <button type="button" role="radio" aria-checked={!custom.envelope} title={ui.styleDefault} onClick={() => setCustom({ envelope: undefined })}
                className={`h-9 w-12 rounded-md text-xs ring-offset-2 ring-offset-sheet ${!custom.envelope ? "ring-2 ring-violet" : "ring-1 ring-ink/15"}`}
                style={{ background: STYLES[card.style].envelope }}>
                <span className="rounded bg-white/70 px-1 text-[10px] text-ink">{ui.auto}</span>
              </button>
              {ENVELOPE_PAPERS.map((p) => (
                <button key={p.id} type="button" role="radio" aria-checked={custom.envelope === p.color} aria-label={p.label} title={p.label}
                  onClick={() => setCustom({ envelope: p.color })}
                  className={`h-9 w-12 rounded-md shadow-[inset_0_0_0_1px_rgb(0_0_0/.12)] ring-offset-2 ring-offset-sheet ${custom.envelope === p.color ? "ring-2 ring-violet" : ""}`}
                  style={{ background: p.color }} />
              ))}
            </div>
          </div>
        )}
        <FontPicker label={ui.fontTitles} value={s.head} onChange={(head) => setCustom({ head })} />
        <FontPicker label={ui.fontText} value={s.body} onChange={(body) => setCustom({ body })} />
      </Section>

      <Section title={ui.language}>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={ui.language}>
          {LANGS.map((l) => (
            <SketchButton key={l} size="sm" active={card.lang === l} role="radio" aria-checked={card.lang === l} onClick={() => setCard({ lang: l })}>
              {FLAGS[l]} <span className="uppercase">{l}</span>
            </SketchButton>
          ))}
        </div>
      </Section>
    </div>
  );
}
