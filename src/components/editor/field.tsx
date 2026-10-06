"use client";

import { UserPlus } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { FIELD, invalid, type FieldKind } from "@/lib/fields";
import { useUI } from "@/lib/locale";
import { NAME_TOKEN } from "@/lib/personalize";
import { SketchButton } from "../sketch";

/* ───────────── Shared inputs ───────────── */

/** Mutually exclusive options. Labels are words unless the icon is unambiguous. */
export function Choice<V extends string>({ value, options, onChange, label }: { value: V; options: [V, ReactNode, string?][]; onChange: (v: V) => void; label: string }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
      {options.map(([v, node, name]) => (
        <SketchButton key={v} seed={v} size="sm" active={value === v} onClick={() => onChange(v)} role="radio" aria-checked={value === v} aria-label={name} title={name}>
          {node}
        </SketchButton>
      ))}
    </div>
  );
}

type FieldProps = {
  kind?: FieldKind; value: string; onChange: (v: string) => void;
  label?: string; placeholder?: string; autoFocus?: boolean; maxLength?: number; error?: string | false;
  /** Offer inserting the guest's name ({name}) at the cursor. */
  guestName?: boolean;
};

/**
 * One input for every block. Input type, keyboard and validation come from the field kind (lib/fields.ts),
 * so a value the card would ignore is always flagged here, the same way, everywhere.
 */
export function Field({ kind = "text", value, onChange, label, placeholder, autoFocus, maxLength, error, guestName }: FieldProps) {
  const ui = useUI();
  const [touched, setTouched] = useState(false);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const insertName = () => {
    const el = ref.current;
    const at = el?.selectionStart ?? value.length, end = el?.selectionEnd ?? at;
    onChange(value.slice(0, at) + NAME_TOKEN + value.slice(end));
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(at + NAME_TOKEN.length, at + NAME_TOKEN.length); });
  };
  const spec = FIELD[kind];
  const message = error || (touched && invalid(kind, value) && spec.hint);
  const common = {
    value, placeholder, autoFocus, "aria-invalid": !!message || undefined, "aria-label": label ?? placeholder,
    onBlur: () => setTouched(true),
    className: `field text-lg ${message ? "!border-wax" : ""}`,
  };
  return (
    <label className="block">
      {label && <span className="mb-0.5 block text-sm text-muted">{label}</span>}
      {kind === "long" ? (
        <textarea ref={ref} {...common} className={`${common.className} min-h-28 resize-y`} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input ref={ref} {...common} {...spec.input} maxLength={maxLength ?? (kind === "url" ? 2048 : 200)} onChange={(e) => onChange(e.target.value)} />
      )}
      {message && <span className="mt-1 block text-sm text-wax" role="alert">{message}</span>}
      {guestName && (
        <button type="button" onClick={insertName} className="mt-2 inline-flex items-center gap-1 rounded-full bg-violet-soft/50 px-2.5 py-1 text-sm text-ink hover:bg-violet-soft">
          <UserPlus size={14} /> {ui.guests.insertName}
        </button>
      )}
    </label>
  );
}


/** On/off option, the same everywhere in the editor. */
export function Switch({ checked, onChange, children, className = "" }: { checked: boolean; onChange: (on: boolean) => void; children: ReactNode; className?: string }) {
  return (
    <label className={`flex cursor-pointer items-center gap-3 text-base ${className}`}>
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="relative h-6 w-11 shrink-0 rounded-full bg-ink/15 transition-colors peer-checked:bg-violet peer-focus-visible:outline-2 peer-focus-visible:outline-dashed peer-focus-visible:outline-offset-2 peer-focus-visible:outline-violet
        after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
      {children}
    </label>
  );
}
