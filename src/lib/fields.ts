/**
 * Field kinds shared by the editor (input type, hints, validation) and the renderer (what counts as
 * filled). One definition per kind keeps every block consistent: a value is either valid and used,
 * or flagged in the editor and ignored on the card. No block validates on its own.
 */
import { safeUrl } from "./actions";

export type FieldKind = "text" | "long" | "phone" | "email" | "url" | "datetime" | "date" | "time" | "emoji";

type Spec = {
  input: { type: string; inputMode?: "text" | "tel" | "email" | "url"; autoComplete?: string; autoCapitalize?: string };
  /** Normalized value, or null when the (non-empty) input is invalid. */
  parse: (raw: string) => string | null;
  hint?: string; // shown in the editor while a non-empty value is invalid
};

const trimmed = (s: string) => s.trim() || null;

export const FIELD: Record<FieldKind, Spec> = {
  text: { input: { type: "text" }, parse: trimmed },
  long: { input: { type: "text" }, parse: trimmed },
  phone: {
    input: { type: "tel", inputMode: "tel", autoComplete: "tel" },
    // International format required (wa.me / sms need the country code). "0034…" is accepted as "+34…".
    parse: (s) => {
      const n = s.trim().replace(/^00/, "+").replace(/[^\d+]/g, "");
      return /^\+\d{7,15}$/.test(n) ? n : null;
    },
    hint: "International format: +34 600 000 000",
  },
  email: {
    input: { type: "email", inputMode: "email", autoComplete: "email", autoCapitalize: "off" },
    parse: (s) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim()) ? s.trim() : null),
    hint: "name@example.com",
  },
  url: {
    input: { type: "url", inputMode: "url", autoCapitalize: "off" },
    parse: (s) => safeUrl(s),
    hint: "A web address, e.g. example.com",
  },
  datetime: { input: { type: "datetime-local" }, parse: (s) => (s && !Number.isNaN(Date.parse(s)) ? s : null) },
  date: { input: { type: "date" }, parse: (s) => (s && !Number.isNaN(Date.parse(s)) ? s : null) },
  time: { input: { type: "time" }, parse: (s) => (/^\d{1,2}:\d{2}$/.test(s.trim()) ? s.trim() : null) },
  emoji: { input: { type: "text" }, parse: (s) => (s.trim() ? [...s.trim()].slice(0, 4).join("") : null) },
};

/** Parsed value or null. Empty input → null. */
export const val = (kind: FieldKind, raw: string | undefined) => (raw?.trim() ? FIELD[kind].parse(raw) : null);

/** True when the user typed something that won't be used. */
export const invalid = (kind: FieldKind, raw: string | undefined) => !!raw?.trim() && FIELD[kind].parse(raw) === null;
