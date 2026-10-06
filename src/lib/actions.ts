/** Pure helpers that turn blocks into real-world actions (calendar, maps, RSVP) and safe URLs. */

import type { BlockOf, RsvpChannel } from "./model";
import { parseWhen } from "./when";

/* ───────────── URLs ─────────────
 * Cards are user content shown on our origin, so every href/src goes through here.
 * Only http(s) is allowed (plus same-origin paths for local-dev images): no javascript:, data: etc.
 */
export function safeUrl(raw: string | undefined): string | null {
  const s = raw?.trim();
  if (!s) return null;
  if (s.startsWith("/") && !s.startsWith("//")) return s;
  try {
    const u = new URL(/^[a-z][\w+.-]*:/i.test(s) ? s : `https://${s}`);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
  } catch {
    return null;
  }
}

export const hostOf = (href: string) => {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return href;
  }
};

/* ───────────── Dates (local wall-clock times, see lib/when.ts) ───────────── */

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;

/** Event start/end as floating local times; a whole-day event ends the next day (exclusive). */
function span(b: BlockOf<"date">) {
  const start = parseWhen(b.start)!;
  const end = parseWhen(b.end);
  if (start.allDay) {
    const last = end && end.date > start.date ? end.date : start.date;
    return { allDay: true, start: start.date, end: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1) };
  }
  // explicit end if it's after start, otherwise start + 3h
  return { allDay: false, start: start.date, end: end && end.date > start.date ? end.date : new Date(start.date.getTime() + 3 * 36e5) };
}

const icsTime = (d: Date, allDay: boolean) => (allDay ? ymd(d) : `${ymd(d)}T${pad(d.getHours())}${pad(d.getMinutes())}00`);

export function googleCalendarUrl(b: BlockOf<"date">, title: string, where?: string) {
  const s = span(b);
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: b.title || title,
    dates: `${icsTime(s.start, s.allDay)}/${icsTime(s.end, s.allDay)}`,
    ...(where ? { location: where } : {}),
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

export function icsFile(b: BlockOf<"date">, title: string, where?: string, url?: string) {
  const esc = (x: string) => x.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
  const s = span(b);
  const dt = (k: string, d: Date) => (s.allDay ? `${k};VALUE=DATE:${icsTime(d, true)}` : `${k}:${icsTime(d, false)}`);
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Magic Envelope//EN", "BEGIN:VEVENT",
    `UID:${b.id}@magic-envelope`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    dt("DTSTART", s.start), dt("DTEND", s.end),
    `SUMMARY:${esc(b.title || title)}`,
    ...(where ? [`LOCATION:${esc(where)}`] : []),
    ...(url ? [`URL:${url}`] : []),
    "END:VEVENT", "END:VCALENDAR",
  ];
  return new Blob([lines.join("\r\n")], { type: "text/calendar" });
}

/** Display parts in the letter's language; `time` is empty for a whole-day date. */
export function dateParts(s: string, lang: string) {
  const w = parseWhen(s);
  if (!w) return null;
  return {
    weekday: w.date.toLocaleDateString(lang, { weekday: "long" }),
    date: w.date.toLocaleDateString(lang, { day: "numeric", month: "long", year: "numeric" }),
    time: w.allDay ? "" : w.date.toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" }),
  };
}

export function formatDate(s: string, lang: string, opts: Intl.DateTimeFormatOptions) {
  const w = parseWhen(s);
  return w ? w.date.toLocaleString(lang, opts) : "";
}

/* ───────────── Maps / RSVP / music ───────────── */

export const mapsUrl = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
export const mapsEmbed = (q: string) => `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;

/**
 * Where a message can open. `web` stays in the browser (no mail or chat app required).
 * `app` is the phone handoff: mailto, WhatsApp, or SMS. Desktop uses `web`.
 */
export function composeLinks(channel: "email" | "whatsapp" | "sms", to: string, body: string, subject = "") {
  const digits = to.replace(/\D/g, "");
  const text = encodeURIComponent(body);
  if (channel === "email") {
    const q = new URLSearchParams({ view: "cm", fs: "1", to, su: subject, body });
    return { web: `https://mail.google.com/mail/?${q}`, app: `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${text}` };
  }
  if (channel === "whatsapp") {
    return {
      web: digits ? `https://web.whatsapp.com/send?phone=${digits}&text=${text}` : `https://web.whatsapp.com/send?text=${text}`,
      app: digits ? `https://wa.me/${digits}?text=${text}` : `https://wa.me/?text=${text}`,
    };
  }
  return { web: "", app: `sms:${to}?&body=${text}` };
}

/** Reply link for one RSVP answer. `contact` must already be validated with lib/fields.ts. */
export function rsvpUrl(channel: RsvpChannel, contact: string, message: string, subject: string) {
  const links = composeLinks(channel, contact, message, subject);
  return links.web || links.app;
}

/** Accept "spotify.com/…", "youtu.be/…" etc. and return an embeddable URL, or null. */
export function musicEmbed(href: string): string | null {
  const s = safeUrl(href);
  if (!s) return null;
  const u = new URL(s);
  const host = u.hostname.replace(/^www\.|^m\./, "");
  if (host === "open.spotify.com") return `https://open.spotify.com/embed${u.pathname.replace(/^\/intl-[\w-]+/, "")}`;
  if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed${u.pathname}`;
  if (host === "youtube.com" || host === "music.youtube.com") {
    const v = u.searchParams.get("v");
    return v ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(v)}` : null;
  }
  if (host === "soundcloud.com") return `https://w.soundcloud.com/player/?url=${encodeURIComponent(s)}&visual=true`;
  return null;
}
