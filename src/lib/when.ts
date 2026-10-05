/**
 * Event times are local wall-clock times with no zone: "2026-11-14T19:30", or a whole day
 * "2026-11-14". Never parse them with `new Date(string)`: a date-only string would be read
 * as UTC midnight (and show as 02:00 in Madrid, or the day before in New York).
 */

/** Accepted shapes: date, or date + time (seconds optional). No "Z" or offsets: it's the local time at the venue. */
export const WHEN_RE = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?$/;

export type When = { date: Date; allDay: boolean };

export function parseWhen(s: string | undefined | null): When | null {
  const m = s?.trim().match(WHEN_RE);
  if (!m) return null;
  const [, y, mo, d, h, mi, sec] = m.map(Number);
  const date = new Date(y, mo - 1, d, h || 0, mi || 0, sec || 0);
  // reject impossible dates (2026-02-31 rolls over)
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d || (m[4] && (h > 23 || mi > 59))) return null;
  return { date, allDay: m[4] === undefined };
}

export const whenTime = (s: string | undefined | null) => parseWhen(s)?.date.getTime() ?? NaN;

const pad = (n: number) => String(n).padStart(2, "0");
export const toWhen = (d: Date, allDay = false) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}${allDay ? "" : `T${pad(d.getHours())}:${pad(d.getMinutes())}`}`;
