"use client";

import { ImageIcon, Link2 } from "lucide-react";
import type { ReactNode } from "react";
import type { Draft } from "@/lib/model";
import { UI } from "@/lib/ui";

type Save = (p: Partial<Draft>, touch?: boolean) => void;

/** A small segmented control. */
function Segmented<V extends string>({ value, options, onChange, label }: { value: V; options: [V, ReactNode, string][]; onChange: (v: V) => void; label: string }) {
  return (
    <div className="inline-flex rounded-full bg-ink/5 p-1" role="tablist" aria-label={label}>
      {options.map(([v, icon, text]) => (
        <button key={v} type="button" role="tab" aria-selected={value === v} onClick={() => onChange(v)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition-colors ${value === v ? "bg-sheet text-ink shadow-sm" : "text-muted hover:text-ink"}`}>
          {icon} {text}
        </button>
      ))}
    </div>
  );
}

/**
 * The letter's format: an interactive link (with its envelope) or a flat image. Stored on the draft:
 * it drives the editor canvas, the preview and the default of the Send panel.
 */
export function FormatToggle({ draft, save }: { draft: Draft; save: Save }) {
  return (
    <Segmented label="Format" value={draft.view ?? "link"} onChange={(view) => save({ view }, false)}
      options={[["link", <Link2 key="l" size={14} />, UI.view.link], ["image", <ImageIcon key="i" size={14} />, UI.view.image]]} />
  );
}
