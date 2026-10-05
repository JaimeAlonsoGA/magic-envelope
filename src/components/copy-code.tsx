"use client";

import { Check, Copy } from "lucide-react";
import { useFlash } from "@/lib/hooks";
import { copy } from "@/lib/native";

/** A code sample with a copy button: examples are meant to be pasted, not retyped. */
export function CopyCode({ code, label }: { code: string; label?: string }) {
  const [copied, flash] = useFlash();
  return (
    <div className="group relative">
      {label && <div className="mb-1 font-mono text-xs text-muted">{label}</div>}
      <pre className="overflow-x-auto rounded-lg bg-ink/[.06] p-4 pr-12 font-mono text-sm leading-relaxed">{code}</pre>
      <button type="button" onClick={() => copy(code).then((ok) => ok && flash())} aria-label="Copy" title="Copy"
        className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-md bg-bg/80 text-muted hover:text-ink" style={label ? { top: "1.75rem" } : undefined}>
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  );
}
