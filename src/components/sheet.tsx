"use client";

import { useUI } from "@/lib/locale";
import { Check } from "lucide-react";
import { useEffect, useEffectEvent, type ReactNode } from "react";
import { onBack } from "@/lib/native";
import { SketchBox } from "./sketch";

/** Bottom sheet. Closes on ✓, Escape and the Android back button. */
export function Sheet({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const ui = useUI();
  const close = useEffectEvent(onClose);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && close();
    addEventListener("keydown", k);
    const off = onBack(() => (close(), true));
    return () => { removeEventListener("keydown", k); off(); };
  }, []);
  return (
    <div className="no-print fixed inset-x-0 bottom-0 z-30 mx-auto max-w-2xl px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] sheet-in">
      <SketchBox seed="sheet" fill="var(--sheet)" fillStyle="solid" className="rounded-xl shadow-[0_-12px_40px_-12px_rgb(0_0_0/.35)]">
        <div className="max-h-[52dvh] overflow-y-auto overscroll-contain p-4 pr-14 sm:p-5 sm:pr-16">
          {children}
        </div>
        <button type="button" aria-label={ui.done} title={ui.done} onClick={onClose}
          className="absolute right-2 top-2 grid h-10 w-10 place-items-center rounded-lg text-violet hover:bg-ink/5 active:scale-90">
          <Check size={22} />
        </button>
      </SketchBox>
    </div>
  );
}
