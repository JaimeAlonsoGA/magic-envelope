/**
 * Letter styles = small design systems. A style is a set of tokens (type, color, background, frame,
 * control shape, envelope). Every letter primitive reads these tokens through CSS variables, so adding
 * a style is data only. A letter can override some tokens (`card.custom`) on top of its style.
 */
import type { CSSProperties } from "react";
import { luminance } from "./color";

/* ───────────── Fonts ───────────── */

export const FONTS = {
  medieval: { label: "Medieval", css: "var(--font-medieval)", head: 1, body: 1 },
  fell: { label: "Old Style", css: "var(--font-fell)", head: 1, body: 1 },
  playfair: { label: "Elegant", css: "var(--font-playfair)", head: 1, body: 1 },
  kalam: { label: "Handwritten", css: "var(--font-kalam)", head: 1, body: 1 },
  inter: { label: "Clean", css: "var(--font-inter)", head: 0.92, body: 0.95 },
  grotesk: { label: "Grotesk", css: "var(--font-grotesk)", head: 0.95, body: 0.95 },
  monoton: { label: "Neon", css: "var(--font-monoton)", head: 0.85, body: 1, display: true },
  righteous: { label: "Groovy", css: "var(--font-righteous)", head: 1, body: 1 },
  pixel: { label: "Pixel", css: "var(--font-pixel)", head: 0.5, body: 0.62 },
  vt323: { label: "Terminal", css: "var(--font-vt323)", head: 1.2, body: 1.3 },
  cinzel: { label: "Roman", css: "var(--font-cinzel)", head: 0.9, body: 0.9 },
  fredoka: { label: "Rounded", css: "var(--font-fredoka)", head: 1, body: 1 },
  courier: { label: "Typewriter", css: "var(--font-courier)", head: 0.9, body: 0.95 },
  bebas: { label: "Poster", css: "var(--font-bebas)", head: 1.3, body: 1.2 },
} as const;
export type FontId = keyof typeof FONTS;
/** Display-only faces are for titles; secondary headings (dates, names, digits) fall back to the body face. */
const isDisplay = (f: FontId) => "display" in FONTS[f];
export const FONT_IDS = Object.keys(FONTS) as FontId[];

/* ───────────── Tokens ───────────── */

export const STYLE_GROUPS = ["Classic", "Elegant", "Modern", "Playful", "Retro"] as const;

export type Frame = "ornate" | "rule" | "none" | "glow" | "pixel" | "groovy" | "soft";
export type Shape = "pill" | "glass" | "solid" | "pixel";
export type Texture = "parchment" | "dots" | "grain" | "scanlines" | "none";

export type Style = {
  name: string;
  group: (typeof STYLE_GROUPS)[number];
  head: FontId; body: FontId; sign: FontId;
  paper: string; // solid paper color (envelope letter, fallbacks, custom override)
  bg?: string; // richer CSS background for the letter (gradients); dropped when paper is customized
  ink: string; accent: string; onAccent: string;
  wax: string; envelope: string;
  texture: Texture; frame: Frame; shape: Shape;
  headCase?: "upper" | "normal"; headWeight?: number; headTracking?: string;
  page?: string; // backdrop behind the letter on the guest page
};

export const STYLES = {
  parchment: {
    name: "Parchment", group: "Classic", head: "medieval", body: "fell", sign: "kalam",
    paper: "#f6ecd3", ink: "#3b2a1a", accent: "#7a3b16", onAccent: "#f6ecd3", wax: "#a3172b", envelope: "#e7d3a7",
    texture: "parchment", frame: "ornate", shape: "pill",
  },
  midnight: {
    name: "Midnight", group: "Classic", head: "medieval", body: "fell", sign: "kalam",
    paper: "#151a2e", ink: "#ece6d6", accent: "#e3b55b", onAccent: "#151a2e", wax: "#b8862b", envelope: "#262d4b",
    texture: "dots", frame: "ornate", shape: "pill", page: "#0d1020",
  },
  romance: {
    name: "Romance", group: "Classic", head: "playfair", body: "fell", sign: "kalam",
    paper: "#fff4f2", ink: "#4a2230", accent: "#b03a5f", onAccent: "#fff4f2", wax: "#c2456b", envelope: "#f3d3d6",
    texture: "none", frame: "rule", shape: "pill",
  },
  botanical: {
    name: "Botanical", group: "Classic", head: "playfair", body: "fell", sign: "kalam",
    paper: "#eef3e6", ink: "#1f3324", accent: "#356b3c", onAccent: "#eef3e6", wax: "#5b3a1e", envelope: "#cfdcbf",
    texture: "parchment", frame: "rule", shape: "pill",
  },
  notebook: {
    name: "Notebook", group: "Modern", head: "kalam", body: "kalam", sign: "kalam",
    paper: "#fdfcf7", ink: "#1d2b45", accent: "#2560c9", onAccent: "#fdfcf7", wax: "#2f6fde", envelope: "#cfe0f7",
    texture: "dots", frame: "none", shape: "pill",
  },
  minimal: {
    name: "Minimal", group: "Modern", head: "grotesk", body: "inter", sign: "kalam",
    paper: "#ffffff", ink: "#141414", accent: "#141414", onAccent: "#ffffff", wax: "#141414", envelope: "#ecebe6",
    texture: "none", frame: "none", shape: "solid", headWeight: 600, headTracking: "-0.02em",
  },
  launch: {
    name: "Launch", group: "Modern", head: "inter", body: "inter", sign: "inter",
    paper: "#0d0d14",
    bg: "radial-gradient(90% 55% at 0% 0%, #3a1f7a 0%, transparent 60%), radial-gradient(80% 50% at 100% 100%, #0b4a6e 0%, transparent 60%), #0d0d14",
    ink: "#ececf3", accent: "#c4b5fd", onAccent: "#0d0d14", wax: "#7c3aed", envelope: "#1d1d29",
    texture: "grain", frame: "glow", shape: "glass", headWeight: 650, headTracking: "-0.03em",
    page: "radial-gradient(70% 45% at 50% 0%, #1d1240 0%, #07070b 70%)",
  },
  groovy: {
    name: "Groovy 80s", group: "Retro", head: "monoton", body: "righteous", sign: "righteous",
    paper: "#3b0a52",
    bg: "radial-gradient(120% 70% at 50% 110%, #ffb347 0%, #ff3d7f 30%, transparent 60%), linear-gradient(180deg, #1f0533 0%, #4a0e6b 45%, #8e1f8c 100%)",
    ink: "#fff3e0", accent: "#ffe45e", onAccent: "#2b0a3d", wax: "#ff3d7f", envelope: "#ff9a5a",
    texture: "grain", frame: "groovy", shape: "solid", headCase: "upper", page: "#16041f",
  },
  deco: {
    name: "Gatsby", group: "Elegant", head: "cinzel", body: "playfair", sign: "playfair",
    paper: "#111012", bg: "radial-gradient(80% 50% at 50% 0%, #2a2318 0%, transparent 70%), #111012",
    ink: "#efe6d2", accent: "#d4b26a", onAccent: "#111012", wax: "#b8963f", envelope: "#1f1d1a",
    texture: "grain", frame: "ornate", shape: "pill", headCase: "upper", headTracking: "0.08em", page: "#0a0a0a",
  },
  ivory: {
    name: "Ivory", group: "Elegant", head: "cinzel", body: "playfair", sign: "playfair",
    paper: "#fbf9f4", ink: "#2b2724", accent: "#8c6d46", onAccent: "#fbf9f4", wax: "#6b4f2f", envelope: "#ece5d8",
    texture: "grain", frame: "rule", shape: "pill", headTracking: "0.06em",
  },
  brutal: {
    name: "Brutal", group: "Modern", head: "bebas", body: "grotesk", sign: "grotesk",
    paper: "#f1f1ec", ink: "#0a0a0a", accent: "#ff3b00", onAccent: "#ffffff", wax: "#ff3b00", envelope: "#e1e1da",
    texture: "none", frame: "none", shape: "pixel", headCase: "upper", headTracking: "0.01em",
  },
  bubblegum: {
    name: "Bubblegum", group: "Playful", head: "fredoka", body: "fredoka", sign: "fredoka",
    paper: "#ffe3ef", bg: "linear-gradient(160deg, #ffd6e8 0%, #e2dcff 55%, #d9f7ec 100%)",
    ink: "#3b2a5a", accent: "#ff4f9a", onAccent: "#ffffff", wax: "#ff4f9a", envelope: "#ffc2dc",
    texture: "none", frame: "soft", shape: "solid", headWeight: 600,
  },
  confetti: {
    name: "Confetti", group: "Playful", head: "fredoka", body: "fredoka", sign: "fredoka",
    paper: "#fffdf7",
    bg: [
      ["#ff5a36", "12% 18%"], ["#2b59ff", "78% 10%"], ["#ffc21a", "40% 70%"], ["#17b890", "88% 62%"], ["#b04dff", "22% 90%"],
    ].map(([c, at]) => `radial-gradient(circle at ${at}, ${c} 0 3px, transparent 3.5px) 0 0 / 150px 150px`).join(", ") + ", #fffdf7",
    ink: "#1f2340", accent: "#2b59ff", onAccent: "#ffffff", wax: "#ff5a36", envelope: "#ffe08a",
    texture: "none", frame: "soft", shape: "solid", headWeight: 600,
  },
  typewriter: {
    name: "Typewriter", group: "Retro", head: "courier", body: "courier", sign: "courier",
    paper: "#f3eee3", ink: "#1f1f1f", accent: "#a3261f", onAccent: "#f3eee3", wax: "#a3261f", envelope: "#e3d9c4",
    texture: "parchment", frame: "rule", shape: "pill", headWeight: 700,
  },
  pocket: {
    name: "Pocket 8-bit", group: "Retro", head: "pixel", body: "vt323", sign: "vt323",
    paper: "#9bbc0f", ink: "#0f380f", accent: "#306230", onAccent: "#9bbc0f", wax: "#306230", envelope: "#8bac0f",
    texture: "scanlines", frame: "pixel", shape: "pixel", headCase: "upper", page: "#c9c9c3",
  },
} satisfies Record<string, Style>;

export type StyleId = keyof typeof STYLES;
export const STYLE_IDS = Object.keys(STYLES) as StyleId[];

/* ───────────── Customization ───────────── */

export type Custom = { accent?: string; paper?: string; ink?: string; envelope?: string; head?: FontId; body?: FontId };

export type Resolved = Style & { id: StyleId; dark: boolean };

/** Style tokens with the letter's overrides applied. The only way components read a style. */
export function resolveStyle(id: StyleId, custom?: Custom): Resolved {
  const base: Style = STYLES[id];
  const s: Style = {
    ...base,
    ...(custom?.accent ? { accent: custom.accent, wax: custom.accent } : {}),
    ...(custom?.ink ? { ink: custom.ink } : {}),
    ...(custom?.paper ? { paper: custom.paper, bg: undefined } : {}),
    ...(custom?.envelope ? { envelope: custom.envelope } : {}),
    ...(custom?.head ? { head: custom.head } : {}),
    ...(custom?.body ? { body: custom.body } : {}),
  };
  if (custom?.accent) s.onAccent = luminance(custom.accent) > 0.45 ? "#141414" : "#ffffff";
  return { ...s, id, dark: luminance(s.paper) < 0.3 };
}

/** CSS variables consumed by every letter primitive. */
export function styleVars(s: Resolved): CSSProperties {
  return {
    "--c-paper": s.paper, "--c-ink": s.ink, "--c-accent": s.accent, "--c-on-accent": s.onAccent, "--c-wax": s.wax,
    "--c-head": FONTS[s.head].css, "--c-body": FONTS[s.body].css, "--c-sign": FONTS[s.sign].css,
    "--c-sub": FONTS[isDisplay(s.head) ? s.body : s.head].css,
    "--c-sub-scale": isDisplay(s.head) ? FONTS[s.body].body : FONTS[s.head].head,
    "--c-head-scale": FONTS[s.head].head, "--c-body-scale": FONTS[s.body].body,
    "--c-head-weight": s.headWeight ?? 400, "--c-head-tracking": s.headTracking ?? "normal",
    "--c-head-case": s.headCase === "upper" ? "uppercase" : "none",
    background: s.bg ?? s.paper, color: s.ink, colorScheme: s.dark ? "dark" : "light",
    fontFamily: FONTS[s.body].css, // anything without an explicit face inherits the letter's text face
  } as CSSProperties;
}

/* ───────────── Control shapes (actions & boxes inside a letter) ───────────── */

export const SHAPE: Record<Shape, { action: string; box: string }> = {
  pill: {
    action: "rounded-full border border-[var(--c-accent)] hover:bg-[color-mix(in_srgb,var(--c-accent)_10%,transparent)]",
    box: "rounded-sm border border-[var(--c-accent)]",
  },
  glass: {
    action: "rounded-full border border-white/15 bg-white/[.07] backdrop-blur hover:bg-white/[.12]",
    box: "rounded-2xl border border-white/10 bg-white/[.05] backdrop-blur",
  },
  solid: {
    action: "rounded-full bg-[var(--c-accent)] text-[var(--c-on-accent)] hover:brightness-110",
    box: "rounded-2xl border-2 border-[var(--c-accent)]",
  },
  pixel: {
    action: "rounded-[3px] border-2 border-[var(--c-ink)] shadow-[3px_3px_0_var(--c-ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_var(--c-ink)]",
    box: "rounded-[3px] border-2 border-[var(--c-ink)] shadow-[3px_3px_0_var(--c-ink)]",
  },
};

/** Letter corner radius per frame. */
export const RADIUS: Record<Frame, string> = {
  ornate: "rounded-[3px]", rule: "rounded-[3px]", none: "rounded-[3px]", glow: "rounded-[28px]", pixel: "rounded-[5px]", groovy: "rounded-[40px]", soft: "rounded-[28px]",
};
