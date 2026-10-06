"use client";

import {
  CalendarPlus, Camera, Check, Copy, Gift, HelpCircle, Link2, Map as MapIcon, MapPin, Music, Shirt, Video, X,
} from "lucide-react";
import QRCode from "qrcode";
import { Fragment, useEffect, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import {
  composeLinks, dateParts, formatDate, googleCalendarUrl, hostOf, icsFile, mapsEmbed, mapsUrl, musicEmbed,
} from "@/lib/actions";
import { BLOCK_ICON, DIGITAL_ONLY, countdownTarget, isEmpty, rsvpContact } from "@/lib/blocks";
import { val } from "@/lib/fields";
import { displayImageSrc } from "@/lib/media";
import { useFlash, useHydrated } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import { useUI } from "@/lib/locale";
import type { Block, BlockOf, Card, RsvpAnswer } from "@/lib/model";
import { copy, haptic, isNative, openOutbound, prefersApp, saveFile } from "@/lib/native";
import { SHAPE, type Resolved } from "@/lib/styles";
import { fallbackName, splitName } from "@/lib/personalize";
import { whenTime } from "@/lib/when";
import { Stamp } from "../craft";
import { Placeholder } from "../selectable";

export type Ctx = {
  card: Card; style: Resolved; title: string; shareUrl: string; where?: string;
  /** Render target is an image/print: no buttons, maps, embeds or live counters. */
  flat: boolean;
  guestName?: string; // this letter's guest, if any
  editing?: boolean; // show the {name} token as a visible field
  /** On a guest's page: where an RSVP answer is recorded for the host. */
  rsvpKey?: { id: string; g?: string };
};

/** Should this block show its digital actions here? Off in images/print, or when the block opts out. */
const live = (ctx: Ctx, b: { interactive?: boolean }) => !ctx.flat && b.interactive !== false;

/** Text with the guest's name injected. In the editor the name is marked as a field. */
function Named({ text, ctx }: { text: string; ctx: Ctx }) {
  const ui = useUI();
  const parts = splitName(text);
  if (parts.length === 1) return <>{text}</>;
  const name = ctx.guestName?.trim() || fallbackName(ctx.card);
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {p}
          {i < parts.length - 1 && (ctx.editing
            ? <span className="rounded-sm underline decoration-dotted decoration-2 underline-offset-4" title={ui.guests.insertName}>{name}</span>
            : name)}
        </Fragment>
      ))}
    </>
  );
}

const LINK_ICON = { link: Link2, gift: Gift, music: Music, video: Video, map: MapIcon, camera: Camera };

/* ───────────── Primitives: shapes come from the style's tokens (lib/styles.ts) ───────────── */

/** Box (countdown digits, QR) in the style's shape. */
function Framed({ ctx, className = "", children }: { ctx: Ctx; className?: string; children: ReactNode }) {
  return <div className={`${SHAPE[ctx.style.shape].box} ${className}`}>{children}</div>;
}

/** Guest action (calendar, directions, RSVP…). Link when `href`, button otherwise. */
function Action({ ctx, href, onClick, children }: { ctx: Ctx; href?: string; onClick?: (e?: MouseEvent<HTMLAnchorElement>) => void; children: ReactNode }) {
  // https stays in the browser. mailto/sms are only the phone fallback, so they must not open a blank tab.
  const web = !!href && /^https?:/i.test(href);
  const cls = `inline-flex min-h-10 items-center gap-2 px-5 py-1.5 text-[calc(.95rem*var(--c-body-scale))] transition-[background-color,transform,box-shadow,filter] duration-150
    active:scale-[.97] focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-offset-4 ${SHAPE[ctx.style.shape].action}`;
  const font = { fontFamily: "var(--c-body)" };
  if (href) return <a href={href} {...(web ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={cls} style={font} onClick={(e) => { haptic(); onClick?.(e); }}>{children}</a>;
  return <button type="button" className={cls} style={font} onClick={() => { haptic(); onClick?.(); }}>{children}</button>;
}

const Body = ({ children, className = "", italic = false }: { children: ReactNode; className?: string; italic?: boolean }) => (
  <p className={`leading-relaxed ${className}`} style={{ fontFamily: "var(--c-body)", fontSize: "calc(1.125rem * var(--c-body-scale))", fontStyle: italic ? "italic" : "normal" }}>{children}</p>
);
const Icon = ({ as: I }: { as: typeof Gift }) => <I className="mx-auto" size={22} strokeWidth={1.5} style={{ color: "var(--c-accent)" }} />;
const headFont = { fontFamily: "var(--c-head)", fontWeight: "var(--c-head-weight)", letterSpacing: "var(--c-head-tracking)", textTransform: "var(--c-head-case)" } as CSSProperties;
/** Secondary headings (date, place name, digits): the title face unless it's display-only. */
const subFont = { ...headFont, fontFamily: "var(--c-sub)", textTransform: "none" } as CSSProperties;

/** Renders one block. With `ghost`, empty blocks show a labelled placeholder (editor, template previews). */
export function RenderBlock({ b, ctx, ghost }: { b: Block; ctx: Ctx; ghost?: boolean }) {
  if (isEmpty(b, ctx.card, ctx.flat)) return ghost ? <Ghost b={b} digitalOnly={ctx.flat && DIGITAL_ONLY.has(b.type)} /> : null;
  switch (b.type) {
    case "heading": {
      const rem = { md: 1.5, lg: 2.1, xl: 2.8 }[b.size];
      return (
        <h2 className="text-balance break-words text-center leading-[1.2]"
          style={{ ...headFont, fontStyle: b.italic ? "italic" : "normal", color: "var(--c-accent)", fontSize: `calc(clamp(${rem * 0.8}rem, ${rem * 3.4}vw, ${rem}rem) * var(--c-head-scale))` }}>
          <Named text={b.text} ctx={ctx} />
        </h2>
      );
    }
    case "text":
      return <Body italic={b.italic} className={`whitespace-pre-line text-pretty break-words ${b.align === "center" ? "text-center" : ""}`}><Named text={b.text} ctx={ctx} /></Body>;
    case "image": {
      const shape = { wide: "aspect-video w-full rounded-sm", square: "aspect-square w-full rounded-sm", round: "mx-auto aspect-square w-48 rounded-full" }[b.shape];
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={displayImageSrc(val("url", b.src)!)} alt="" decoding="async" className={`${shape} bg-black/5 object-cover`} />;
    }
    case "date": return <DateB b={b} ctx={ctx} />;
    case "place": return <Place b={b} ctx={ctx} />;
    case "countdown": return <Countdown b={b} ctx={ctx} />;
    case "link": {
      const LIcon = LINK_ICON[b.icon];
      const href = val("url", b.href)!;
      if (!live(ctx, b))
        return (
          <p className="flex items-center justify-center gap-2 text-center" style={{ fontFamily: "var(--c-body)" }}>
            <LIcon size={16} style={{ color: "var(--c-accent)" }} />
            {b.label.trim() && <span>{b.label.trim()} ·</span>}<span className="opacity-80">{hostOf(href)}{new URL(href).pathname.replace(/\/$/, "")}</span>
          </p>
        );
      return <div className="text-center"><Action ctx={ctx} href={href}><LIcon size={17} />{b.label.trim() || hostOf(href)}</Action></div>;
    }
    case "qr": return <Qr b={b} ctx={ctx} />;
    case "rsvp": return <Rsvp b={b} ctx={ctx} />;
    case "agenda": return <Agenda b={b} />;
    case "dress": return <Dress b={b} />;
    case "gift": {
      const href = val("url", b.href);
      return (
        <div className="space-y-3 text-center">
          <Icon as={Gift} />
          {b.text && <Body>{b.text}</Body>}
          {b.iban?.trim() && (live(ctx, b)
            ? <CopyLine value={b.iban.trim()} label={t(ctx.card.lang).guest.copied} />
            : <p className="break-all font-mono text-sm">{b.iban.trim()}</p>)}
          {href && (live(ctx, b)
            ? <div><Action ctx={ctx} href={href}><Gift size={16} />{hostOf(href)}</Action></div>
            : <p className="text-sm opacity-80">{hostOf(href)}</p>)}
        </div>
      );
    }
    case "signature":
      return <p className="text-right" style={{ fontFamily: "var(--c-sign)", color: "var(--c-accent)", fontSize: "calc(1.9rem * var(--c-body-scale))" }}><Named text={b.text} ctx={ctx} /></p>;
    case "divider": return <Divider style={b.style} />;
    case "stamp": return <Stamp id={b.stamp as Exclude<typeof b.stamp, "">} className="mx-auto h-24 w-auto" />;
    case "music":
      return <iframe src={musicEmbed(b.href)!} title="music" className="no-print h-[152px] w-full rounded-xl border-0" loading="lazy" allow="autoplay; clipboard-write; encrypted-media" />;
  }
}

function Ghost({ b, digitalOnly }: { b: Block; digitalOnly?: boolean }) {
  const ui = useUI();
  return <Placeholder icon={BLOCK_ICON[b.type]} label={ui.blocks[b.type]} note={digitalOnly ? ui.linkOnly : undefined} />;
}

function DateB({ b, ctx }: { b: BlockOf<"date">; ctx: Ctx }) {
  const { lang } = ctx.card;
  const p = dateParts(b.start, lang)!;
  const end = whenTime(b.end) > whenTime(b.start) ? dateParts(b.end!, lang) : null;
  // Decided at click time (no hydration mismatch): Apple devices & the native app get an .ics, others Google Calendar.
  const add = () => {
    // The installed app and iPhone/iPad use the calendar file. A desktop browser, including a Mac, opens Google Calendar.
    if (isNative() || /iPhone|iPad/.test(navigator.userAgent)) saveFile("invite.ics", icsFile(b, ctx.title, ctx.where, ctx.shareUrl));
    else window.open(googleCalendarUrl(b, ctx.title, ctx.where), "_blank", "noopener");
  };
  return (
    <div className="space-y-1.5 text-center">
      <div className="text-xs uppercase tracking-[.3em] opacity-70">{p.weekday}</div>
      <div className="first-letter:uppercase" style={{ ...subFont, fontSize: "calc(1.5rem * var(--c-sub-scale))" }}>{p.date}</div>
      {p.time && (
        <div style={{ fontFamily: "var(--c-body)", color: "var(--c-accent)", fontSize: "calc(1.5rem * var(--c-body-scale))" }}>
          {p.time}{end && end.date === p.date && end.time && ` – ${end.time}`}
        </div>
      )}
      {end && end.date !== p.date && <div className="opacity-80">→ {[end.date, end.time].filter(Boolean).join(", ")}</div>}
      {live(ctx, b) && <div className="no-print pt-2"><Action ctx={ctx} onClick={add}><CalendarPlus size={16} />{t(lang).guest.calendar}</Action></div>}
    </div>
  );
}

/** The name is a label; only the address drives the map and directions. */
function Place({ b, ctx }: { b: BlockOf<"place">; ctx: Ctx }) {
  const address = b.address.trim();
  // "Finca La Alameda" / "Finca La Alameda": say it once
  const same = (x: string) => x.trim().toLowerCase().replace(/[\s.,]+/g, " ");
  const showAddress = address && same(address) !== same(b.name);
  return (
    <div className="space-y-2 text-center">
      <Icon as={MapPin} />
      {b.name.trim() && <div style={{ ...subFont, fontSize: "calc(1.5rem * var(--c-sub-scale))" }}>{b.name}</div>}
      {showAddress && <div className="opacity-80" style={{ fontFamily: "var(--c-body)", fontSize: "calc(1rem * var(--c-body-scale))" }}>{address}</div>}
      {address && live(ctx, b) && (
        <>
          <iframe title="map" src={mapsEmbed(address)} loading="lazy" className="no-print mt-3 h-44 w-full rounded-sm border-0" />
          <div className="no-print pt-2"><Action ctx={ctx} href={mapsUrl(address)}><MapIcon size={16} />{t(ctx.card.lang).guest.map}</Action></div>
        </>
      )}
    </div>
  );
}

function Countdown({ b, ctx }: { b: BlockOf<"countdown">; ctx: Ctx }) {
  const hydrated = useHydrated();
  const [now, setNow] = useState(() => Date.now());
  const target = whenTime(countdownTarget(ctx.card, b.to));
  const done = hydrated && now >= target;
  useEffect(() => {
    if (done) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [done]);
  const g = t(ctx.card.lang).guest;
  if (done) return <div className="text-center" style={{ ...headFont, color: "var(--c-accent)", fontSize: "calc(1.9rem * var(--c-head-scale))" }}>{g.today}</div>;
  const left = Math.max(0, target - now);
  const parts = [
    [Math.floor(left / 864e5), g.days], [Math.floor(left / 36e5) % 24, g.hours],
    [Math.floor(left / 6e4) % 60, g.minutes], [Math.floor(left / 1e3) % 60, g.seconds],
  ] as const;
  return (
    <div className="flex justify-center gap-2 sm:gap-3" role="timer">
      {parts.map(([n, label], i) => (
        <Framed key={i} ctx={ctx} className="w-[4.25rem] py-2.5 text-center sm:w-20">
          <div className="tabular-nums leading-none" style={{ ...subFont, fontSize: "calc(1.85rem * var(--c-sub-scale))" }}>{hydrated ? String(n).padStart(2, "0") : "··"}</div>
          <div className="mt-1.5 text-[.65rem] uppercase tracking-[.15em] opacity-70">{label}</div>
        </Framed>
      ))}
    </div>
  );
}

function Qr({ b, ctx }: { b: BlockOf<"qr">; ctx: Ctx }) {
  const target = b.data.trim() || ctx.shareUrl; // any text is fine: it's only encoded, never linked
  const [svg, setSvg] = useState("");
  useEffect(() => {
    let live = true;
    if (target) QRCode.toString(target, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: ctx.style.ink, light: "#0000" } })
      .then((s) => live && setSvg(s)).catch(() => {});
    return () => { live = false; };
  }, [target, ctx.style.ink]);
  return (
    <div className="text-center">
      <Framed ctx={ctx} className="mx-auto inline-block p-4">
        {/* qrcode generates the SVG from our own string: safe to inline */}
        <div className="h-36 w-36 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
      </Framed>
      <div className="mt-2 text-sm opacity-75">{b.caption || t(ctx.card.lang).guest.scan}</div>
    </div>
  );
}

function Rsvp({ b, ctx }: { b: BlockOf<"rsvp">; ctx: Ctx }) {
  const g = t(ctx.card.lang).guest;
  const contact = rsvpContact(b)!;
  const deadline = val("date", b.deadline) && <div className="text-sm opacity-70">{g.deadline} {formatDate(b.deadline!, ctx.card.lang, { day: "numeric", month: "long" })}</div>;
  if (!live(ctx, b)) {
    // Printed RSVP: who to answer and how, as text.
    const via = b.channel === "email" ? contact : `${b.channel === "whatsapp" ? "WhatsApp " : ""}${contact.replace(/^(\+\d{2})(\d{3})(\d{3})(\d+)$/, "$1 $2 $3 $4")}`;
    return (
      <div className="space-y-1 text-center">
        <div style={{ ...subFont, fontSize: "calc(1.2rem * var(--c-sub-scale))" }}>{g.rsvpFlat}</div>
        <div className="opacity-85" style={{ fontFamily: "var(--c-body)" }}>{via}</div>
        {deadline}
      </div>
    );
  }
  // A message a person would write: thanks to the host (the signature), the answer, and who it's from.
  const host = ctx.card.blocks.find((x) => x.type === "signature")?.text.trim() || undefined;
  const message = (a: RsvpAnswer) => `${g.reply.thanks(host)} ${g.reply[a]}${ctx.guestName ? `\n— ${ctx.guestName}` : ""}`;
  // the answer is also kept for the host's guest list (sendBeacon survives leaving for WhatsApp)
  const record = (answer: RsvpAnswer) => ctx.rsvpKey && navigator.sendBeacon?.("/api/rsvp", new Blob([JSON.stringify({ ...ctx.rsvpKey, answer })], { type: "application/json" }));
  const opts = [["yes", g.attending, Check], ["maybe", g.maybe, HelpCircle], ["no", g.notAttending, X]] as const;
  return (
    <div className="no-print space-y-3 text-center">
      <div className="flex flex-wrap justify-center gap-2">
        {opts.map(([answer, label, I]) => {
          const text = message(answer);
          const links = composeLinks(b.channel, contact, text, ctx.title);
          return (
            <Action key={answer} ctx={ctx} href={links.web || links.app} onClick={(e) => {
              record(answer);
              if (!prefersApp() && !links.web) { e?.preventDefault(); copy(text); return; }
              if (prefersApp() && links.web) { e?.preventDefault(); openOutbound(links.web, links.app); }
            }}>
              <I size={16} />{label}
            </Action>
          );
        })}
      </div>
      {deadline}
    </div>
  );
}

/** Schedule as a vertical timeline: time on the left, a dot on the line, what happens on the right. */
function Agenda({ b }: { b: BlockOf<"agenda"> }) {
  const items = b.items.filter((i) => i.what.trim());
  return (
    <ol className="mx-auto w-fit max-w-full">
      {items.map((i, n) => (
        <li key={n} className="grid grid-cols-[4rem_1.25rem_1fr] items-start">
          <span className="pt-0.5 text-right text-sm tabular-nums opacity-80" style={{ fontFamily: "var(--c-body)" }}>{i.time}</span>
          <span className="relative flex h-full justify-center" aria-hidden>
            {n < items.length - 1 && <span className="absolute bottom-0 top-3 w-px bg-[var(--c-accent)] opacity-40" />}
            <span className="relative mt-2 h-2 w-2 rounded-full bg-[var(--c-accent)]" />
          </span>
          <span className="pb-4 leading-snug" style={{ fontFamily: "var(--c-body)", fontSize: "calc(1.125rem * var(--c-body-scale))" }}>{i.what}</span>
        </li>
      ))}
    </ol>
  );
}

/** Dress code as a moodboard of references. */
function Dress({ b }: { b: BlockOf<"dress"> }) {
  return (
    <div className="space-y-4 text-center">
      <Icon as={Shirt} />
      {b.text && <Body>{b.text}</Body>}
      {b.board.length > 0 && (
        <ul className="mx-auto grid max-w-sm grid-cols-3 gap-2">
          {b.board.map((it, i) => (
            <li key={i} className="grid aspect-square place-items-center overflow-hidden rounded-sm ring-1 ring-[color-mix(in_srgb,var(--c-ink)_12%,transparent)]"
              style={it.kind === "color" ? { background: it.value } : { background: "color-mix(in srgb, var(--c-ink) 4%, transparent)" }}>
              {it.kind === "emoji" && <span className="text-4xl">{it.value}</span>}
              {it.kind === "text" && <span className="px-2 text-sm leading-tight" style={{ fontFamily: "var(--c-body)" }}>{it.value}</span>}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {it.kind === "image" && val("url", it.value) && <img src={displayImageSrc(val("url", it.value)!)} alt="" className="h-full w-full object-cover" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CopyLine({ value, label }: { value: string; label: string }) {
  const [ok, flash] = useFlash();
  return (
    <button type="button" onClick={() => copy(value).then((y) => y && flash())}
      className="inline-flex max-w-full items-center gap-2 break-all rounded px-2 py-1 font-mono text-sm underline decoration-dotted underline-offset-4 hover:bg-[color-mix(in_srgb,var(--c-accent)_10%,transparent)]">
      {ok ? <><Check size={14} /> {label}</> : <><Copy size={14} className="shrink-0" /> {value}</>}
    </button>
  );
}

/** Dividers: symmetric, thin, accent-colored. */
export function Divider({ style }: { style: BlockOf<"divider">["style"] }) {
  if (style === "line") return <hr className="mx-auto w-2/5 border-t border-[var(--c-accent)] opacity-60" />;
  if (style === "stars")
    return (
      <div className="flex items-center justify-center gap-3" style={{ color: "var(--c-accent)" }} aria-hidden>
        <span className="h-px w-14 bg-current opacity-50" /><span className="text-sm">✦</span><span className="h-px w-14 bg-current opacity-50" />
      </div>
    );
  return (
    <svg viewBox="0 0 200 20" className="mx-auto h-5 w-52 max-w-full" style={{ color: "var(--c-accent)" }} aria-hidden>
      {/* tapered rules, a lozenge flanked by two dots, small terminal dots */}
      <path d="M86 9.4 Q52 9.8 16 10 Q52 10.2 86 10.6 Z M114 9.4 Q148 9.8 184 10 Q148 10.2 114 10.6 Z" fill="currentColor" />
      <path d="M100 4.5 L105.5 10 L100 15.5 L94.5 10 Z" fill="currentColor" />
      <circle cx="90" cy="10" r="1.6" fill="currentColor" /><circle cx="110" cy="10" r="1.6" fill="currentColor" />
      <circle cx="12" cy="10" r="1.1" fill="currentColor" /><circle cx="188" cy="10" r="1.1" fill="currentColor" />
    </svg>
  );
}
