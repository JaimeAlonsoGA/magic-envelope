/** Pure helpers that turn blocks into real-world actions (calendar, maps, RSVP) and safe URLs. */

import type { BlockOf, RsvpChannel } from "./model";

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

/* ───────────── Dates ───────────── */

const pad = (n: number) => String(n).padStart(2, "0");
const valid = (d: Date) => !Number.isNaN(d.getTime());

/** "2026-11-14T19:30" (local) → "20261114T193000" (floating local time). */
function icsLocal(s: string) {
  const d = new Date(s);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

/** Event end: explicit end if it's after start, otherwise start + 3h. */
function endOf(b: BlockOf<"date">) {
  if (b.end && new Date(b.end) > new Date(b.start)) return b.end;
  const d = new Date(new Date(b.start).getTime() + 3 * 36e5);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function googleCalendarUrl(b: BlockOf<"date">, title: string, where?: string) {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: b.title || title,
    dates: `${icsLocal(b.start)}/${icsLocal(endOf(b))}`,
    ...(where ? { location: where } : {}),
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

export function icsFile(b: BlockOf<"date">, title: string, where?: string, url?: string) {
  const esc = (s: string) => s.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Magic Envelope//EN", "BEGIN:VEVENT",
    `UID:${b.id}@magic-envelope`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART:${icsLocal(b.start)}`, `DTEND:${icsLocal(endOf(b))}`,
    `SUMMARY:${esc(b.title || title)}`,
    ...(where ? [`LOCATION:${esc(where)}`] : []),
    ...(url ? [`URL:${url}`] : []),
    "END:VEVENT", "END:VCALENDAR",
  ];
  return new Blob([lines.join("\r\n")], { type: "text/calendar" });
}

/** Split a date into display parts, independent of locale word order. */
export function dateParts(iso: string, lang: string) {
  const d = new Date(iso);
  if (!valid(d)) return null;
  return {
    weekday: d.toLocaleDateString(lang, { weekday: "long" }),
    date: d.toLocaleDateString(lang, { day: "numeric", month: "long", year: "numeric" }),
    time: d.toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" }),
  };
}

export function formatDate(iso: string, lang: string, opts: Intl.DateTimeFormatOptions) {
  const d = new Date(iso);
  return valid(d) ? d.toLocaleString(lang, opts) : "";
}

/* ───────────── Maps / RSVP / music ───────────── */

export const mapsUrl = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
export const mapsEmbed = (q: string) => `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;

/** Reply link for one RSVP answer. `contact` must already be validated with lib/fields.ts. */
export function rsvpUrl(channel: RsvpChannel, contact: string, message: string, subject: string) {
  switch (channel) {
    case "whatsapp":
      return `https://wa.me/${contact.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
    case "sms":
      return `sms:${contact}?&body=${encodeURIComponent(message)}`;
    case "email":
      return `mailto:${contact}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  }
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
