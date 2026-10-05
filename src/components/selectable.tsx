"use client";

import type { LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";

/**
 * One editing language for everything you can tap on a canvas (letter blocks, envelope slots):
 * dashed violet outline + faint tint when selected, dashed outline on hover, and an empty spot drawn
 * as a dashed placeholder in the canvas' own ink so it reads on light and dark paper alike.
 */
export const selectableClass = (on: boolean) =>
  `cursor-pointer rounded-md outline-2 outline-offset-0 transition-[outline-color,background-color] duration-150 ${
    on ? "outline-dashed" : "outline-transparent hover:outline-dashed"
  }`;

export const selectableStyle = (on: boolean): CSSProperties =>
  on ? { outlineColor: "var(--violet)", background: "color-mix(in srgb, var(--violet) 9%, transparent)" } : {};

/** Empty spot: dashed box with the thing's icon and name, in `color` (defaults to the letter's accent). */
export function Placeholder({ icon: I, label, color = "var(--c-accent)", note, compact }: { icon: LucideIcon; label: string; color?: string; note?: string; compact?: boolean }) {
  return (
    <div className={`flex h-full w-full items-center justify-center gap-1.5 rounded-md border border-dashed font-hand opacity-75 ${compact ? "px-1 text-xs" : "py-3.5"}`}
      style={{ borderColor: color, color }}>
      <I size={compact ? 13 : 17} strokeWidth={1.75} className="shrink-0" /> <span className="truncate">{label}</span>{note && <span className="opacity-80">· {note}</span>}
    </div>
  );
}
