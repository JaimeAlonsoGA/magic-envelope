"use client";

import { RADIUS, styleVars, type Resolved } from "@/lib/styles";

/** A small sheet of a style's paper with its type and colors: used by the wizard and the Style panel. */
export function StyleSwatch({ s, sample = "Aa", line, className = "" }: { s: Resolved; sample?: string; line?: string; className?: string }) {
  return (
    <div style={styleVars(s)} className={`relative flex flex-col items-center justify-center gap-1 overflow-hidden shadow-[0_1px_2px_rgb(0_0_0/.1),0_8px_20px_-10px_rgb(0_0_0/.35)] ${RADIUS[s.frame]} ${className}`}>
      {s.frame !== "none" && s.frame !== "glow" && s.frame !== "soft" && (
        <span className={`pointer-events-none absolute inset-1.5 ${s.frame === "groovy" ? "rounded-[14px] border-2" : s.frame === "pixel" ? "rounded-[3px] border-2" : "rounded-[2px] border"} border-[var(--c-accent)] opacity-70`} aria-hidden />
      )}
      {s.frame === "glow" && <span className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/15" aria-hidden />}
      <span className="relative leading-none"
        style={{ fontFamily: "var(--c-head)", color: "var(--c-accent)", fontWeight: "var(--c-head-weight)", letterSpacing: "var(--c-head-tracking)", textTransform: "var(--c-head-case)" as "none", fontSize: "calc(1.6em * var(--c-head-scale))" }}>
        {sample}
      </span>
      {line && <span className="relative px-2 text-center text-[.7em] opacity-80" style={{ fontFamily: "var(--c-body)", fontSize: "calc(.75em * var(--c-body-scale))" }}>{line}</span>}
      <span className="absolute bottom-2 right-2 h-3 w-3 rounded-full" style={{ background: s.wax }} aria-hidden />
    </div>
  );
}
