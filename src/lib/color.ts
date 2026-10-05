/** Opaque color math. Craft elements (seal, envelope) shade with these — never with translucent overlays. */

const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toHex = (r: number, g: number, b: number) => `#${[r, g, b].map((c) => clamp(c).toString(16).padStart(2, "0")).join("")}`;

/** amount in [-1, 1]: negative mixes toward black, positive toward white. Always returns an opaque hex. */
export function shade(hex: string, amount: number) {
  const [r, g, b] = rgb(hex);
  const t = amount < 0 ? 0 : 255;
  const k = Math.abs(amount);
  return toHex(r + (t - r) * k, g + (t - g) * k, b + (t - b) * k);
}

/** Relative luminance (0 dark … 1 light). */
export function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
