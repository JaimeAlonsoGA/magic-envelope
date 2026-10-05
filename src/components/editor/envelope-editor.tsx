"use client";

import { RotateCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { BLOCK_ICON, isEmpty, newBlock } from "@/lib/blocks";
import { SEAL_ICONS, SEAL_SHAPES, parseSeal, sealValue, type SealMark } from "@/lib/craft";
import { cardStyle, envelopeOf } from "@/lib/envelope";
import { useUI } from "@/lib/locale";
import { SLOT_LIMIT, SLOT_ROLE, envelopeBlocks } from "@/lib/mail";
import { ENV_SLOTS, SLOT_TYPE, type Block, type Card, type EnvSlot } from "@/lib/model";
import { EnvelopeFlip, SLOT_BOX, Seal, type EnvModel } from "../craft";
import { Placeholder, selectableClass, selectableStyle } from "../selectable";
import { BlockEditor } from "./block-editor";

export type EnvTarget = EnvSlot | "seal";


/**
 * Tap targets over the envelope, placed with the same boxes it's drawn with. They behave like the
 * letter's blocks: a blank slot keeps its placeholder (the block's icon and name) in the ink of the paper.
 */
function Targets({ slots, card, env, selected, onSelect }: { slots: EnvSlot[]; card: Card; env: EnvModel; selected: EnvTarget | null; onSelect: (t: EnvTarget) => void }) {
  const ui = useUI();
  const blocks = envelopeBlocks(card);
  return (
    <>
      {slots.map((slot) => {
        const b = blocks[slot];
        return (
          <button key={slot} type="button" aria-label={`${ui.blocks[b.type]} · ${SLOT_ROLE[slot]}`} title={SLOT_ROLE[slot]} onClick={() => onSelect(slot)}
            className={`absolute z-10 ${selectableClass(selected === slot)}`} style={{ ...SLOT_BOX[slot], ...selectableStyle(selected === slot) }}>
            {isEmpty(b, card) && <Placeholder icon={BLOCK_ICON[b.type]} label={ui.blocks[b.type]} color={env.ink} compact />}
          </button>
        );
      })}
    </>
  );
}

/** The envelope canvas: both faces, turn over, tap-to-edit slots and the seal. */
export function EnvelopeCanvas({ card, guestName, selected, onSelect }: {
  card: Card; guestName?: string; selected: EnvTarget | null; onSelect: (t: EnvTarget) => void;
}) {
  const ui = useUI();
  const [side, setSide] = useState<"front" | "back">("front");
  const env = envelopeOf(card, guestName);
  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <EnvelopeFlip
        env={env}
        side={side}
        className="[filter:drop-shadow(0_10px_18px_rgb(0_0_0/.16))]"
        overlay={{
          front: <Targets slots={["front-tl", "front-tr", "front-center", "front-bl"]} card={card} env={env} selected={selected} onSelect={onSelect} />,
          back: (
            <>
              <Targets slots={["back-center"]} card={card} env={env} selected={selected} onSelect={onSelect} />
              <button type="button" aria-label={ui.seal} title={ui.seal} onClick={() => onSelect("seal")}
                className={`absolute left-[37%] top-[40%] z-10 h-[36%] w-[26%] !rounded-full ${selectableClass(selected === "seal")}`}
                style={selectableStyle(selected === "seal")}>
                {!card.seal && <span className="grid h-full w-full place-items-center rounded-full border border-dashed font-hand text-xs" style={{ borderColor: env.ink, color: env.ink }}>{ui.seal}</span>}
              </button>
            </>
          ),
        }}
      />
      <div className="flex justify-center">
        <button type="button" onClick={() => setSide(side === "front" ? "back" : "front")}
          className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 px-4 py-1.5 text-sm hover:bg-ink/10">
          <RotateCw size={14} /> {side === "front" ? ui.turnOver : ui.front}
        </button>
      </div>
    </div>
  );
}

/** Sheet content for a selected slot (or the seal): the same header and block editor as on the letter. */
export function EnvelopeTargetEditor({ target, card, setCard }: { target: EnvTarget; card: Card; setCard: (p: Partial<Card>) => void }) {
  const ui = useUI();
  if (target === "seal") {
    return (
      <>
        <p className="mb-3 font-hand text-lg text-muted">{ui.seal}</p>
        <SealEditor card={card} setCard={setCard} />
      </>
    );
  }
  const all = envelopeBlocks(card);
  const b = all[target];
  const I = BLOCK_ICON[b.type];
  // the first edit makes the whole envelope the letter's own (no longer following the style's defaults)
  const put = (next: Block) => setCard({ envelope: { blocks: { ...Object.fromEntries(ENV_SLOTS.map((s) => [s, all[s]])), [target]: next } } });
  return (
    <>
      <div className="mb-3 flex items-center gap-1.5">
        <I size={20} className="shrink-0 text-violet" />
        <span className="mr-auto truncate font-hand text-lg text-muted">{ui.blocks[b.type]} <span className="text-base opacity-70">· {SLOT_ROLE[target]}</span></span>
        {/* slots are fixed: clearing leaves the block in place, blank */}
        <button type="button" aria-label={ui.clear} title={ui.clear} disabled={isEmpty(b, card)}
          onClick={() => put({ ...newBlock(SLOT_TYPE[target]), id: target } as Block)}
          className="grid h-10 w-10 place-items-center rounded-lg text-wax transition hover:bg-ink/5 disabled:opacity-25">
          <Trash2 size={18} />
        </button>
      </div>
      <BlockEditor key={target} b={b} card={card} limit={SLOT_LIMIT[target]} set={(patch) => put({ ...b, ...patch } as Block)} />
    </>
  );
}

/** Seal: a shape and a mark, each chosen by looking at real wax. */
function SealEditor({ card, setCard }: { card: Card; setCard: (p: Partial<Card>) => void }) {
  const ui = useUI();
  const wax = cardStyle(card).wax;
  const mark = parseSeal(card.seal);
  const shape = card.sealShape;
  const pick = (m: SealMark) => setCard({ seal: sealValue(m) });
  const ring = (on: boolean) => (on ? "ring-2 ring-violet ring-offset-2 ring-offset-sheet" : "opacity-85 hover:opacity-100");
  const letters = (v: string, n: number) => [...v.replace(/[^\p{L}\p{N}&]/gu, "").toUpperCase()].slice(0, n).join("");
  const couple = mark.kind === "couple" ? mark : { a: "", b: "" };
  const initials = mark.kind === "initials" ? mark.text : "";

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <h3 className="text-sm text-muted">{ui.shape}</h3>
        <div className="flex flex-wrap gap-2">
          {SEAL_SHAPES.map((sh) => (
            <button key={sh} type="button" aria-label={sh} title={sh} aria-pressed={shape === sh} onClick={() => setCard({ sealShape: sh })}
              className={`rounded-full p-0.5 transition ${ring(shape === sh)}`}>
              <Seal value={card.seal || "_"} shape={sh} color={wax} size={48} />
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm text-muted">{ui.mark}</h3>
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" aria-label={ui.noSeal} title={ui.noSeal} aria-pressed={mark.kind === "none"} onClick={() => pick({ kind: "none" })}
            className={`grid h-12 w-12 place-items-center rounded-full p-0.5 transition ${ring(mark.kind === "none")}`}>
            <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-dashed border-ink/30 text-sm text-muted">∅</span>
          </button>
          <button type="button" aria-label={ui.plainWax} title={ui.plainWax} aria-pressed={mark.kind === "blank"} onClick={() => pick({ kind: "blank" })}
            className={`rounded-full p-0.5 transition ${ring(mark.kind === "blank")}`}>
            <Seal value="_" shape={shape} color={wax} size={44} />
          </button>
          {SEAL_ICONS.map((icon) => {
            const on = mark.kind === "icon" && mark.icon === icon;
            return (
              <button key={icon} type="button" aria-label={icon} title={icon} aria-pressed={on} onClick={() => pick({ kind: "icon", icon })}
                className={`rounded-full p-0.5 transition ${ring(on)}`}>
                <Seal value={`icon:${icon}`} shape={shape} color={wax} size={44} />
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <label className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-3 ${mark.kind === "initials" ? "ring-2 ring-violet" : "ring-1 ring-ink/15"}`}>
          <Seal value={`ini:${initials || "ABC"}`} shape={shape} color={wax} size={40} className={initials ? "" : "opacity-50"} />
          <input value={initials} maxLength={3} placeholder={ui.initials} aria-label="Initials (up to 3)"
            onChange={(e) => { const t = letters(e.target.value, 3); pick(t ? { kind: "initials", text: t } : { kind: "icon", icon: "sparkle" }); }}
            className="w-full min-w-0 bg-transparent text-base uppercase placeholder:normal-case placeholder:text-muted" />
        </label>
        <div className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-3 ${mark.kind === "couple" ? "ring-2 ring-violet" : "ring-1 ring-ink/15"}`}>
          <Seal value={`duo:${couple.a || "A"}|${couple.b || "J"}`} shape={shape} color={wax} size={40} className={mark.kind === "couple" ? "" : "opacity-50"} />
          {(["a", "b"] as const).map((k, idx) => (
            <span key={k} className="contents">
              {idx === 1 && <span className="text-wax">♥</span>}
              <input value={couple[k]} maxLength={1} placeholder={k === "a" ? "A" : "J"} aria-label={k === "a" ? ui.firstInitial : ui.secondInitial}
                onChange={(e) => pick({ kind: "couple", ...couple, [k]: letters(e.target.value, 1) })}
                className="w-8 bg-transparent text-center text-base uppercase placeholder:text-muted" />
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
