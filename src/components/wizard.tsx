"use client";

import { ArrowLeft, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { KIND_EMOJI, blankCard, fromPreset } from "@/lib/blocks";
import { createDraft, getLastLang, setLastLang } from "@/lib/drafts";
import { useHydrated } from "@/lib/hooks";
import { FLAGS, t } from "@/lib/i18n";
import { useUI } from "@/lib/locale";
import { KINDS, LANGS, type Card, type Kind, type Lang } from "@/lib/model";
import { onBack } from "@/lib/native";
import { RADIUS, STYLES, STYLE_GROUPS, STYLE_IDS, resolveStyle, styleVars, type StyleId } from "@/lib/styles";
import { CardView } from "./card/card-view";
import { SketchButton, SketchLink } from "./sketch";
import { StyleSwatch } from "./style-swatch";

/** Deep links (/new?lang=…&style=…&kind=…) skip the steps they already decide. */
export function Wizard({ initialStyle, initialKind, initialLang }: { initialStyle?: StyleId; initialKind?: Kind; initialLang?: Lang }) {
  // The default language comes from localStorage, so render only on the client.
  return useHydrated() ? <Steps initialStyle={initialStyle} initialKind={initialKind} initialLang={initialLang} /> : null;
}

const tile = "cursor-pointer rounded-md transition-transform duration-200 ease-out hover:-translate-y-1 active:translate-y-0 focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-offset-4 focus-visible:outline-violet";

/** A letter preview: the real letter, scaled down and cut off with a soft fade. No outline: letters are paper. */
function Preview({ card }: { card: Card }) {
  return (
    <div className="h-64 overflow-hidden [mask-image:linear-gradient(to_bottom,#000_80%,transparent)] sm:h-[24rem]">
      <div inert className="pointer-events-none w-[200%] origin-top-left scale-50 p-3">
        <CardView card={card} shareUrl="https://magic-envelope.com" ghosts />
      </div>
    </div>
  );
}

/** Create a letter: language → style (how it looks) → blank or a preset (what's in it). */
function Steps({ initialStyle, initialKind, initialLang }: { initialStyle?: StyleId; initialKind?: Kind; initialLang?: Lang }) {
  const ui = useUI();
  const router = useRouter();
  // a link that already decides the language (and style) starts past those steps
  const [step, setStep] = useState(initialLang ? (initialStyle ? 2 : 1) : 0);
  const [lang, setLang] = useState<Lang>(() => initialLang ?? getLastLang());
  const [style, setStyle] = useState<StyleId>(initialStyle ?? "parchment");

  // Android back button steps back before leaving the wizard.
  useEffect(() => onBack(() => (step > 0 ? (setStep(step - 1), true) : false)), [step]);

  // a linked occasion comes first among the presets
  const order = initialKind ? [initialKind, ...KINDS.filter((k) => k !== initialKind)] : KINDS;
  const presets = useMemo(() => order.map((k) => fromPreset(k, style, lang)), [style, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const start = (card: Card) => {
    setLastLang(lang);
    router.push(`/edit/${createDraft(card)}`);
  };
  const s = resolveStyle(style);

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-4 pb-10 pt-[max(.75rem,env(safe-area-inset-top))]">
      <header className="grid h-14 grid-cols-[2.75rem_1fr_2.75rem] items-center">
        {step > 0
          ? <SketchButton size="icon" aria-label={ui.back} onClick={() => setStep(step - 1)}><ArrowLeft size={20} /></SketchButton>
          : <SketchLink href="/" size="icon" aria-label={ui.home}><ArrowLeft size={20} /></SketchLink>}
        <ol className="flex justify-center gap-2" aria-label={ui.stepOf(step + 1, 3, ui.steps[step])}>
          {ui.steps.map((x, i) => (
            <li key={x} className={`h-2 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-violet" : i < step ? "w-2 bg-violet/60" : "w-2 bg-ink/15"}`} />
          ))}
        </ol>
      </header>

      <section key={step} className="pop flex flex-1 flex-col justify-center py-6">
        <h1 className="mb-8 text-center font-hand text-2xl text-muted">{ui.steps[step]}</h1>

        {step === 0 && (
          <div className="mx-auto grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
            {LANGS.map((l) => (
              <SketchButton key={l} seed={l} size="lg" active={l === lang} className="!justify-start !py-5" onClick={() => { setLang(l); setStep(initialStyle ? 2 : 1); }}>
                <span className="text-2xl">{FLAGS[l]}</span> {t(l).langName}
              </SketchButton>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-8">
            {STYLE_GROUPS.map((g) => (
              <div key={g}>
                <h2 className="mb-3 text-sm text-muted">{ui.groups[g]}</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {STYLE_IDS.filter((id) => STYLES[id].group === g).map((id) => (
                    <button key={id} type="button" onClick={() => { setStyle(id); setStep(2); }} className={`${tile} text-left`}>
                      <StyleSwatch s={resolveStyle(id)} line="Magic Envelope" className="aspect-[4/3] text-lg" />
                      <span className="mt-2 block text-base">{STYLES[id].name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-8">
            {/* default: a blank sheet of this style */}
            <button type="button" onClick={() => start(blankCard(style, lang))} className={`${tile} text-left`}>
              <div className="p-3">
                <div style={styleVars(s)} className={`grid h-[calc(16rem-1.5rem)] place-items-center shadow-[0_1px_2px_rgb(0_0_0/.08),0_18px_36px_-18px_rgb(0_0_0/.35)] sm:h-[calc(24rem-1.5rem)] ${RADIUS[s.frame]}`}>
                  <span className="flex flex-col items-center gap-2" style={{ color: "var(--c-accent)" }}>
                    <Plus size={34} strokeWidth={1.5} />
                  </span>
                </div>
              </div>
              <span className="mt-1 block px-3 text-base sm:text-lg">{ui.blank}</span>
            </button>
            {/* optional presets (not <button>: the inert preview contains buttons, and buttons can't nest) */}
            {presets.map((card) => (
              <div key={card.kind} role="button" tabIndex={0} aria-label={`${ui.kinds[card.kind]} preset`} className={tile}
                onClick={() => start(card)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), start(card))}>
                <Preview card={card} />
                <span className="mt-1 block truncate px-3 text-base sm:text-lg">{KIND_EMOJI[card.kind]} {ui.kinds[card.kind]}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
