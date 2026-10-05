/**
 * Pure geometry + palettes for the craft elements (wax seal, envelope).
 * Shared by the React components and the OG image so every rendering is identical.
 */
import { luminance, shade } from "./color";

/* ───────────── Wax seal ─────────────
 * A seal is a shape (its outline) + a mark (what's pressed in it). Both are data; the mark is
 * stored as a small string so cards stay serializable:
 *   ""  no seal · "_" plain wax · "icon:<id>" · "ini:ABC" (1–3 letters) · "duo:A|J" (A ♥ J)
 */

export const SEAL_SHAPES = ["scallop", "round", "flower", "octagon"] as const;
export type SealShape = (typeof SEAL_SHAPES)[number];

/** Marks people actually reach for: weddings, birthdays, parties, babies, graduations, holidays. */
export const SEAL_ICONS = [
  "heart", "ring", "cake", "cheers", "balloon", "gift", "cap", "note",
  "star", "sparkle", "moon", "sun", "flower", "olive", "snowflake", "tree", "crown",
] as const;
export type SealIcon = (typeof SEAL_ICONS)[number];

export type SealMark =
  | { kind: "none" } | { kind: "blank" }
  | { kind: "icon"; icon: SealIcon }
  | { kind: "initials"; text: string }
  | { kind: "couple"; a: string; b: string };

/** v1–v3 seals were single typographic glyphs: map them onto icons. */
const LEGACY: Record<string, SealIcon> = {
  "✦": "sparkle", "✶": "sparkle", "★": "star", "✪": "star", "♥": "heart", "☾": "moon", "❦": "flower", "✿": "flower",
  "⚜": "crown", "♪": "note", "✉": "olive", "✒": "olive", "∞": "heart", "❖": "star", "☘": "olive",
};
/** Icons from the first vector set that were retired. */
const RETIRED: Record<string, SealIcon> = { rings: "ring", feather: "olive", bird: "sparkle", key: "crown", anchor: "star", infinity: "heart" };

export function parseSeal(v: string): SealMark {
  if (!v) return { kind: "none" };
  if (v === "_") return { kind: "blank" };
  if (v.startsWith("icon:")) {
    const icon = (RETIRED[v.slice(5)] ?? v.slice(5)) as SealIcon;
    return SEAL_ICONS.includes(icon) ? { kind: "icon", icon } : { kind: "blank" };
  }
  if (v.startsWith("ini:")) return { kind: "initials", text: [...v.slice(4)].slice(0, 3).join("") };
  if (v.startsWith("duo:")) {
    const [a = "", b = ""] = v.slice(4).split("|");
    return { kind: "couple", a: [...a][0] ?? "", b: [...b][0] ?? "" };
  }
  if (LEGACY[v]) return { kind: "icon", icon: LEGACY[v] };
  return /^[\p{L}\p{N}&]{1,3}$/u.test(v) ? { kind: "initials", text: v.toUpperCase() } : { kind: "icon", icon: "sparkle" };
}

export function sealValue(m: SealMark): string {
  switch (m.kind) {
    case "none": return "";
    case "blank": return "_";
    case "icon": return `icon:${m.icon}`;
    case "initials": return `ini:${m.text}`;
    case "couple": return `duo:${m.a}|${m.b}`;
  }
}

/** Seal outline for a shape, centred on (cx, cy). Every shape is point-symmetric. */
export function sealOutline(cx: number, cy: number, r: number, shape: SealShape = "scallop") {
  const polar = (lobes: number, depth: number, k = 1) => {
    const steps = Math.max(96, lobes * 12);
    let d = "";
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const wave = Math.cos(lobes * a);
      const rr = r * (1 + depth * (k === 1 ? wave : Math.sign(wave) * Math.abs(wave) ** k));
      d += `${i ? "L" : "M"}${(cx + rr * Math.cos(a)).toFixed(2)} ${(cy + rr * Math.sin(a)).toFixed(2)}`;
    }
    return `${d}Z`;
  };
  switch (shape) {
    case "scallop": return polar(14, 0.045);
    case "round": return polar(1, 0); // a clean disc
    case "flower": return polar(8, 0.09, 0.6); // fewer, rounder petals
    case "octagon": {
      // eight sides with softly rounded corners
      const pts = Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
      });
      const k = 0.18;
      let d = "";
      pts.forEach((p, i) => {
        const prev = pts[(i + 7) % 8], next = pts[(i + 1) % 8];
        const a = [p[0] + (prev[0] - p[0]) * k, p[1] + (prev[1] - p[1]) * k];
        const b = [p[0] + (next[0] - p[0]) * k, p[1] + (next[1] - p[1]) * k];
        d += `${i ? "L" : "M"}${a[0].toFixed(2)} ${a[1].toFixed(2)}Q${p[0].toFixed(2)} ${p[1].toFixed(2)} ${b[0].toFixed(2)} ${b[1].toFixed(2)}`;
      });
      return `${d}Z`;
    }
  }
}

/**
 * All opaque: lit edge, body, shadowed edge, pressed rim and the engraved mark. The mark is always
 * legible: on mid/light wax it's pressed darker; on very dark wax (black, navy) it reads as a light
 * engraving instead, so no wax colour can hide it.
 */
export function sealPalette(wax: string) {
  const lum = luminance(wax);
  const darkWax = lum < 0.06;
  return {
    light: shade(wax, darkWax ? 0.3 : 0.22),
    base: wax,
    dark: shade(wax, -0.32),
    rim: darkWax ? shade(wax, 0.22) : shade(wax, -0.2),
    rimLight: shade(wax, darkWax ? 0.4 : 0.14),
    face: shade(wax, darkWax ? 0.1 : 0.08), // the pressed disc, a touch lighter than the wax around it
    mark: darkWax ? shade(wax, 0.62) : shade(wax, lum > 0.25 ? -0.62 : -0.52),
    markEdge: darkWax ? shade(wax, -0.4) : shade(wax, 0.4), // lit lower lip of the impression
    markShadow: darkWax ? shade(wax, 0.85) : shade(wax, -0.75), // shadowed upper lip
  };
}

/* ───────────── Envelope (back side, flap closed) ─────────────
 * viewBox 0 0 300 200. Side flaps meet at the centre, the bottom flap overlaps them,
 * the top flap closes over everything with a softly rounded tip where the seal sits.
 */
export const ENV = {
  w: 300,
  h: 200,
  radius: 6,
  seal: { x: 150, y: 114 },
  left: "M0 0 L150 112 L0 200 Z",
  right: "M300 0 L150 112 L300 200 Z",
  bottom: "M0 200 L150 96 L300 200 Z",
  flap: "M0 0 L300 0 L163 110 Q150 120 137 110 Z",
} as const;

export function envelopePalette(paper: string) {
  return {
    inside: shade(paper, -0.2),
    side: shade(paper, -0.04),
    bottom: shade(paper, -0.08),
    flap: shade(paper, 0.05),
    edge: shade(paper, -0.28),
  };
}
