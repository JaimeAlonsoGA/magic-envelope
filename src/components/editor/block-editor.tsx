"use client";

import { useUI } from "@/lib/locale";
import type { UIText } from "@/lib/ui";
import {
  AlignCenter, AlignLeft, Camera, Image as ImageIcon, Loader2, Mail, MessageCircle, MessageSquare, Palette,
  Plus, Smile, Trash2, Type, Wand2, X,
} from "lucide-react";
import { useState } from "react";
import { musicEmbed } from "@/lib/actions";
import { countdownTarget } from "@/lib/blocks";
import { FIELD, val } from "@/lib/fields";
import { imagine, uploadImage } from "@/lib/image.client";
import { RSVP_CHANNELS, type Block, type BlockOf, type BoardItem, type Card } from "@/lib/model";
import { pickPhoto } from "@/lib/native";
import { STAMP_IDS } from "@/lib/mail";
import { Stamp } from "../craft";
import { SketchButton } from "../sketch";
import { Choice, Field } from "./field";

type Setter<T extends Block["type"]> = (patch: Partial<BlockOf<T>>) => void;

/* ───────────── Editors ───────────── */

/** `limit`: a character/line budget (envelope slots). Letters grow freely and pass none. */
export function BlockEditor({ b, set, card, limit }: { b: Block; set: (patch: Partial<Block>) => void; card: Card; limit?: { chars: number; lines: number } }) {
  const ui = useUI();
  const bounded = (patch: Partial<Block>) => {
    if (limit && "text" in patch && typeof patch.text === "string")
      patch = { ...patch, text: patch.text.split("\n").slice(0, limit.lines).join("\n").slice(0, limit.chars) } as Partial<Block>;
    set(patch);
  };
  return (
    <>
      <BlockFields b={b} set={bounded} card={card} limit={limit} />
      {/* every block with guest actions gets the same switch; images and print are always flat */}
      {"interactive" in b && (
        <label className="mt-5 flex cursor-pointer items-center gap-3 border-t border-dashed border-ink/15 pt-4 text-base">
          <input type="checkbox" className="peer sr-only" checked={b.interactive} onChange={(e) => set({ interactive: e.target.checked } as Partial<Block>)} />
          <span className="relative h-6 w-11 shrink-0 rounded-full bg-ink/15 transition-colors peer-checked:bg-violet peer-focus-visible:outline-2 peer-focus-visible:outline-dashed peer-focus-visible:outline-offset-2 peer-focus-visible:outline-violet
            after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
          {ui.interactive}
        </label>
      )}
    </>
  );
}

function BlockFields({ b, set, card, limit }: { b: Block; set: (patch: Partial<Block>) => void; card: Card; limit?: { chars: number; lines: number } }) {
  const ui = useUI();
  switch (b.type) {
    case "heading":
      return (
        <div className="space-y-4">
          <Field value={b.text} onChange={(text) => set({ text })} placeholder={ui.headingPh} autoFocus guestName maxLength={limit?.chars} />
          <Choice label={ui.size} value={b.size} onChange={(size) => set({ size })} options={[["md", ui.sizes.md], ["lg", ui.sizes.lg], ["xl", ui.sizes.xl]]} />
        </div>
      );
    case "text":
      return (
        <div className="space-y-4">
          {limit?.lines === 1
            ? <Field value={b.text} onChange={(text) => set({ text })} placeholder={ui.textPh} autoFocus guestName maxLength={limit.chars} />
            : <Field kind="long" value={b.text} onChange={(text) => set({ text })} placeholder={ui.textPh} autoFocus guestName maxLength={limit?.chars} />}
          <Choice label={ui.alignment} value={b.align} onChange={(align) => set({ align })} options={[
            ["center", <><AlignCenter size={16} /> {ui.align.center}</>], ["left", <><AlignLeft size={16} /> {ui.align.left}</>],
          ]} />
        </div>
      );
    case "signature":
      return <Field value={b.text} onChange={(text) => set({ text })} placeholder={ui.signature} autoFocus guestName />;
    case "image":
      return <ImageEditor b={b} set={set} />;
    case "date": {
      const endBad = !!val("datetime", b.end) && !!val("datetime", b.start) && new Date(b.end!) <= new Date(b.start);
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field kind="datetime" label={ui.start} value={b.start} onChange={(start) => start && set({ start })} />
          <Field kind="datetime" label={ui.end} value={b.end ?? ""} onChange={(end) => set({ end: end || undefined })} error={endBad && ui.endBeforeStart} />
        </div>
      );
    }
    case "countdown": {
      const follow = !b.to;
      const followed = countdownTarget(card, "");
      return (
        <div className="space-y-4">
          <Choice label={ui.countdownTarget} value={follow ? "follow" : "custom"}
            onChange={(v) => set({ to: v === "follow" ? "" : followed || new Date(Date.now() + 864e5 * 21).toISOString().slice(0, 16) })}
            options={[["follow", ui.followDate], ["custom", ui.customDate]]} />
          {follow
            ? !followed && <p className="text-sm text-wax">{ui.noDateBlock}</p>
            : <Field kind="datetime" value={b.to} onChange={(to) => to && set({ to })} />}
        </div>
      );
    }
    case "place":
      return (
        <div className="space-y-4">
          <Field label={ui.placeName} value={b.name} onChange={(name) => set({ name })} autoFocus />
          <Field label={ui.address} value={b.address} onChange={(address) => set({ address })} />
        </div>
      );
    case "link":
      return (
        <div className="space-y-4">
          <Field kind="url" label={ui.linkUrl} value={b.href} onChange={(href) => set({ href })} autoFocus />
          <Field label={ui.linkLabel} value={b.label} onChange={(label) => set({ label })} />
          <Choice label={ui.icon} value={b.icon} onChange={(icon) => set({ icon })} options={Object.entries(ui.linkIcons) as [BlockOf<"link">["icon"], string][]} />
        </div>
      );
    case "qr":
      return (
        <div className="space-y-4">
          <Field label={ui.qrData} value={b.data} onChange={(data) => set({ data })} maxLength={2048} />
          <Field label={ui.qrCaption} value={b.caption ?? ""} onChange={(caption) => set({ caption: caption || undefined })} />
        </div>
      );
    case "rsvp": {
      const kind = b.channel === "email" ? "email" : "phone";
      const icons = { whatsapp: <MessageCircle size={16} />, sms: <MessageSquare size={16} />, email: <Mail size={16} /> };
      return (
        <div className="space-y-4">
          <Choice label={ui.replyChannel} value={b.channel} onChange={(channel) => set({ channel })}
            options={RSVP_CHANNELS.map((c) => [c, <>{icons[c]} {c === "whatsapp" ? "WhatsApp" : c === "sms" ? "SMS" : ui.email}</>])} />
          {/* each channel keeps its own contact, so switching never carries a value into the wrong format */}
          <Field key={b.channel} kind={kind} label={ui.rsvpTo[b.channel]} value={b.contacts[b.channel]}
            onChange={(v) => set({ contacts: { ...b.contacts, [b.channel]: v } })} placeholder={FIELD[kind].hint} autoFocus />
          <p className="text-sm text-muted">{ui.rsvpHint}</p>
          <Field kind="date" label={ui.deadline} value={b.deadline ?? ""} onChange={(deadline) => set({ deadline: deadline || undefined })} />
        </div>
      );
    }
    case "agenda":
      return <AgendaEditor b={b} set={set} />;
    case "dress":
      return <DressEditor b={b} set={set} />;
    case "gift":
      return (
        <div className="space-y-4">
          <Field label={ui.giftText} value={b.text} onChange={(text) => set({ text })} autoFocus />
          <Field label={ui.giftIban} value={b.iban ?? ""} onChange={(iban) => set({ iban: iban || undefined })} />
          <Field kind="url" label={ui.giftUrl} value={b.href ?? ""} onChange={(href) => set({ href: href || undefined })} />
        </div>
      );
    case "divider":
      return <Choice label={ui.dividerStyle} value={b.style} onChange={(style) => set({ style })} options={[["flourish", ui.dividers.flourish], ["stars", ui.dividers.stars], ["line", ui.dividers.line]]} />;
    case "stamp":
      return (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-7" role="radiogroup" aria-label={ui.stamp}>
          {STAMP_IDS.map((id) => (
            <button key={id} type="button" role="radio" aria-checked={b.stamp === id} aria-label={id} onClick={() => set({ stamp: id })}
              className={`rounded-md p-1 transition ${b.stamp === id ? "bg-violet-soft/50 ring-2 ring-violet" : "hover:bg-ink/5"}`}>
              <Stamp id={id} className="mx-auto h-14 w-auto" />
            </button>
          ))}
        </div>
      );
    case "music":
      return (
        <Field kind="url" label={ui.musicUrl} value={b.href} onChange={(href) => set({ href })} autoFocus
          error={!!val("url", b.href) && !musicEmbed(b.href) && ui.musicUnsupported} />
      );
  }
}

function AgendaEditor({ b, set }: { b: BlockOf<"agenda">; set: Setter<"agenda"> }) {
  const ui = useUI();
  const update = (i: number, patch: Partial<BlockOf<"agenda">["items"][number]>) =>
    set({ items: b.items.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[6.5rem_1fr_2.5rem] gap-2 text-sm text-muted">
        <span>{ui.scheduleTime}</span><span>{ui.scheduleWhat}</span>
      </div>
      {b.items.map((it, i) => (
        <div key={i} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-2">
          <input className="field" type="time" value={it.time} aria-label={ui.scheduleTime} onChange={(e) => update(i, { time: e.target.value })} />
          <input className="field" value={it.what} maxLength={200} aria-label={ui.scheduleWhat}
            placeholder={ui.scheduleExamples[i % ui.scheduleExamples.length]}
            autoFocus={i === b.items.length - 1 && !it.what} onChange={(e) => update(i, { what: e.target.value })} />
          <button type="button" aria-label={ui.delete} className="grid h-10 w-10 place-items-center text-muted hover:text-wax"
            onClick={() => set({ items: b.items.filter((_, j) => j !== i) })}><Trash2 size={16} /></button>
        </div>
      ))}
      {b.items.length < 20 && (
        <SketchButton size="sm" onClick={() => set({ items: [...b.items, { time: "", what: "" }] })}><Plus size={16} /> {ui.addItem}</SketchButton>
      )}
    </div>
  );
}

/** Curated emoji sets for dress-code moodboards. */
const EMOJI_SETS: [keyof UIText["emojiSets"], string[]][] = [
  ["wear", ["👗", "👔", "🤵", "👰", "👠", "👞", "🎩", "👒", "🧣", "🕶️", "💍", "👜"]],
  ["colors", ["❤️", "🧡", "💛", "💚", "💙", "💜", "🤎", "🖤", "🤍", "🩷", "🩵", "🩶"]],
  ["nature", ["🌿", "🌸", "🌹", "🌻", "🌷", "🍂", "🌾", "🌊", "🌙", "⭐", "☀️", "❄️"]],
  ["mood", ["✨", "💎", "🕯️", "🎀", "🦢", "🕊️", "🪩", "🎉", "🥂", "🍾", "🎶", "💃"]],
];

export function EmojiPicker({ onPick }: { onPick: (e: string) => void }) {
  const ui = useUI();
  return (
    <div className="space-y-2 rounded-lg border border-ink/10 p-2.5">
      {EMOJI_SETS.map(([name, list]) => (
        <div key={name}>
          <span className="text-xs text-muted">{ui.emojiSets[name]}</span>
          <div className="grid grid-cols-6 gap-1 sm:grid-cols-12">
            {list.map((e) => (
              <button key={e} type="button" onClick={() => onPick(e)} aria-label={e}
                className="grid aspect-square place-items-center rounded-md text-2xl transition-colors hover:bg-ink/5 active:bg-ink/10">{e}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DressEditor({ b, set }: { b: BlockOf<"dress">; set: Setter<"dress"> }) {
  const ui = useUI();
  const [busy, setBusy] = useState(false);
  /** null = closed; "new" = add an emoji; number = replace that tile's emoji */
  const [picking, setPicking] = useState<null | "new" | number>(null);
  const full = b.board.length >= 12;
  const put = (i: number, item: BoardItem) => set({ board: b.board.map((x, j) => (j === i ? item : x)) });
  const add = (item: BoardItem) => set({ board: [...b.board, item] });
  const addImage = async () => {
    setBusy(true);
    try {
      const f = await pickPhoto("gallery");
      if (f) add({ kind: "image", value: await uploadImage(f) });
    } finally {
      setBusy(false);
    }
  };
  const pick = (e: string) => {
    if (picking === "new") add({ kind: "emoji", value: e });
    else if (typeof picking === "number") put(picking, { kind: "emoji", value: e });
    setPicking(null);
  };
  return (
    <div className="space-y-4">
      <Field label={ui.dressText} value={b.text} onChange={(text) => set({ text })} autoFocus />
      {b.board.length > 0 && (
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {b.board.map((it, i) => (
            <li key={i} className="relative aspect-square">
              {it.kind === "color" && (
                <input type="color" value={it.value} aria-label={ui.board.color} onChange={(e) => put(i, { kind: "color", value: e.target.value })}
                  className="h-full w-full cursor-pointer appearance-none rounded-md border border-ink/15 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0" />
              )}
              {it.kind === "emoji" && (
                <button type="button" aria-label={`${ui.board.emoji} ${it.value}`} onClick={() => setPicking(picking === i ? null : i)}
                  className={`grid h-full w-full place-items-center rounded-md border bg-ink/[.03] text-3xl ${picking === i ? "border-violet" : "border-ink/15"}`}>
                  {it.value}
                </button>
              )}
              {it.kind === "text" && (
                <input value={it.value} maxLength={60} aria-label={ui.board.text} autoFocus={!it.value} placeholder={ui.boardWordPh}
                  onChange={(e) => put(i, { kind: "text", value: e.target.value })}
                  className="h-full w-full rounded-md border border-ink/15 bg-ink/[.03] text-center text-sm" />
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {it.kind === "image" && <img src={val("url", it.value) ?? ""} alt="" className="h-full w-full rounded-md object-cover" />}
              <button type="button" aria-label={ui.delete} onClick={() => { set({ board: b.board.filter((_, j) => j !== i) }); setPicking(null); }}
                className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-sheet text-muted shadow ring-1 ring-ink/10 hover:text-wax">
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-1.5">
        <SketchButton size="sm" disabled={full} onClick={() => add({ kind: "color", value: "#c9a26b" })}><Palette size={16} /> {ui.board.color}</SketchButton>
        <SketchButton size="sm" disabled={full} active={picking === "new"} onClick={() => setPicking(picking === "new" ? null : "new")}><Smile size={16} /> {ui.board.emoji}</SketchButton>
        <SketchButton size="sm" disabled={full} onClick={() => add({ kind: "text", value: "" })}><Type size={16} /> {ui.board.text}</SketchButton>
        <SketchButton size="sm" disabled={full || busy} onClick={addImage}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />} {ui.board.image}
        </SketchButton>
      </div>
      {picking !== null && <EmojiPicker onPick={pick} />}
    </div>
  );
}

const STYLES = ["storybook", "medieval", "sketch", "photo"] as const;

function ImageEditor({ b, set }: { b: BlockOf<"image">; set: Setter<"image"> }) {
  const ui = useUI();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<(typeof STYLES)[number]>("storybook");
  const [busy, setBusy] = useState<null | "ai" | "photo">(null);
  const [err, setErr] = useState<string | null>(null);

  const run = async (kind: "ai" | "photo", fn: () => Promise<string | null>) => {
    setBusy(kind);
    setErr(null);
    try {
      const src = await fn();
      if (src) set({ src });
    } catch (e) {
      setErr((e as Error).message === "429" ? "Limit reached — try again in a while." : ui.error);
    } finally {
      setBusy(null);
    }
  };
  const photo = (source: "camera" | "gallery") =>
    run("photo", async () => {
      const f = await pickPhoto(source);
      return f ? uploadImage(f) : null;
    });

  return (
    <div className="space-y-5">
      {val("url", b.src) && (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={val("url", b.src)!} alt="" className="h-16 w-24 rounded-md object-cover ring-1 ring-ink/10" />
          <SketchButton size="sm" onClick={() => set({ src: "" })}><Trash2 size={16} /> {ui.removeImage}</SketchButton>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <SketchButton disabled={!!busy} onClick={() => photo("camera")}><Camera size={18} /> {ui.camera}</SketchButton>
        <SketchButton disabled={!!busy} onClick={() => photo("gallery")}>
          {busy === "photo" ? <Loader2 className="animate-spin" size={18} /> : <ImageIcon size={18} />} {ui.gallery}
        </SketchButton>
      </div>

      <div className="space-y-3 border-t border-dashed border-ink/15 pt-4">
        <Field kind="long" value={prompt} onChange={setPrompt} placeholder={ui.describe} maxLength={400} />
        <Choice label={ui.illustrationStyle} value={style} onChange={setStyle} options={STYLES.map((s) => [s, ui.styles[s]])} />
        <SketchButton tone="primary" disabled={!!busy || prompt.trim().length < 3} onClick={() => run("ai", () => imagine(prompt, style, b.shape))}>
          {busy === "ai" ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />} {busy === "ai" ? ui.imagining : ui.imagine}
        </SketchButton>
      </div>

      {/* the shape is self-describing: draw it */}
      <Choice label={ui.shape} value={b.shape} onChange={(shape) => set({ shape })} options={[
        ["wide", <span key="w" className="inline-block h-4 w-7 rounded-[3px] border-2 border-current" />, ui.shapes.wide],
        ["square", <span key="s" className="inline-block h-5 w-5 rounded-[3px] border-2 border-current" />, ui.shapes.square],
        ["round", <span key="r" className="inline-block h-5 w-5 rounded-full border-2 border-current" />, ui.shapes.round],
      ]} />
      {err && <p className="text-sm text-wax" role="alert">{err}</p>}
    </div>
  );
}
