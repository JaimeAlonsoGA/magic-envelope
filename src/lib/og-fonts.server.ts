import "server-only";
import type { FontId } from "./styles";

/** Google Fonts families behind the app's font ids (the same faces next/font loads in the layout). */
const FAMILY: Record<FontId, string> = {
  medieval: "MedievalSharp", fell: "IM Fell English", playfair: "Playfair Display", kalam: "Kalam", inter: "Inter",
  grotesk: "Space Grotesk", monoton: "Monoton", righteous: "Righteous", pixel: "Press Start 2P", vt323: "VT323",
  cinzel: "Cinzel", fredoka: "Fredoka", courier: "Courier Prime", bebas: "Bebas Neue",
};

/**
 * One font, subset to the text being drawn, as TTF for next/og (Google serves TTF to clients that
 * don't ask for WOFF2). Cached by fetch; null when unavailable so the image still renders.
 */
export async function ogFont(font: FontId, text: string) {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(FAMILY[font])}&text=${encodeURIComponent(text)}`, { cache: "force-cache" })).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return { name: font, data: await (await fetch(url, { cache: "force-cache" })).arrayBuffer(), style: "normal" as const, weight: 400 as const };
  } catch {
    return null;
  }
}
