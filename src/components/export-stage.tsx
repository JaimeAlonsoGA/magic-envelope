"use client";

import { getFontEmbedCSS, toBlob } from "html-to-image";
import JSZip from "jszip";
import { useEffect, useRef, useState } from "react";
import type { Card } from "@/lib/model";
import { FONTS, type FontId } from "@/lib/styles";
import { CardView, cardStyle } from "./card/card-view";

type Job = { card: Card; guestName?: string; shareUrl: string; resolve: (b: Blob) => void; reject: (e: unknown) => void };

const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));

/**
 * @font-face CSS for exactly the faces a letter uses. html-to-image can't see fonts set through CSS
 * variables, so we resolve the style's faces ourselves and let it embed those. Cached per font set.
 */
const fontCache = new Map<string, Promise<string>>();
function fontsFor(card: Card) {
  const s = cardStyle(card);
  const ids = [...new Set<FontId>([s.head, s.body, s.sign])].sort();
  const key = ids.join(",");
  if (!fontCache.has(key)) {
    const root = getComputedStyle(document.documentElement);
    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed;left:-9999px;top:0";
    for (const id of ids) {
      const span = document.createElement("span");
      span.style.fontFamily = root.getPropertyValue(FONTS[id].css.slice(4, -1)); // "var(--font-x)" → resolved family list
      span.textContent = "Aa";
      probe.append(span);
    }
    document.body.append(probe);
    fontCache.set(key, getFontEmbedCSS(probe).finally(() => probe.remove()));
  }
  return fontCache.get(key)!;
}

export const slug = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "letter";

/**
 * Renders letters to PNG. A hidden stage mounts the letter in its *flat* variant (no buttons, maps or
 * live counters), waits for fonts/images, and rasterizes it at 2×. Fonts are embedded once per session.
 */
export function useLetterImages() {
  const [job, setJob] = useState<Job | null>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!job) return;
    let alive = true;
    (async () => {
      try {
        await document.fonts.ready;
        await frame(); await frame();
        const el = stage.current!.querySelector("article")!;
        await Promise.all([...el.querySelectorAll("img")].map((i) => i.decode().catch(() => {})));
        await new Promise((r) => setTimeout(r, 120)); // QR codes render asynchronously
        const fontEmbedCSS = await fontsFor(job.card);
        // the letter is centred with auto margins on screen; the capture must start at its own edge
        const blob = await toBlob(el, { pixelRatio: 2, fontEmbedCSS, cacheBust: true, style: { margin: "0" } });
        if (!blob) throw new Error("render");
        job.resolve(blob);
      } catch (e) {
        job.reject(e);
      } finally {
        if (alive) setJob(null);
      }
    })();
    return () => { alive = false; };
  }, [job]);

  /** One PNG. Calls are serialized by awaiting them. */
  const render = (card: Card, shareUrl: string, guestName?: string) =>
    new Promise<Blob>((resolve, reject) => setJob({ card, guestName, shareUrl, resolve, reject }));

  /** Many PNGs (one per guest) in a ZIP. */
  const renderZip = async (card: Card, items: { name?: string; shareUrl: string }[], onProgress?: (done: number) => void) => {
    const zip = new JSZip();
    const used = new Set<string>();
    for (const [i, it] of items.entries()) {
      let file = slug(it.name ?? "letter");
      while (used.has(file)) file += "-2";
      used.add(file);
      zip.file(`${file}.png`, await render(card, it.shareUrl, it.name));
      onProgress?.(i + 1);
    }
    return zip.generateAsync({ type: "blob" });
  };

  const stageEl = job && (
    <div aria-hidden className="pointer-events-none fixed left-[-12000px] top-0 w-[600px]" ref={stage}>
      <CardView card={job.card} shareUrl={job.shareUrl} guestName={job.guestName} flat className="!shadow-none" />
    </div>
  );

  return { stage: stageEl, render, renderZip, busy: !!job };
}
