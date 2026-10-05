"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const noop = () => () => {};

/** false during SSR and hydration, true afterwards. */
export const useHydrated = () => useSyncExternalStore(noop, () => true, () => false);

export const useOrigin = () => useSyncExternalStore(noop, () => location.origin, () => "");

const onlineSub = (l: () => void) => {
  addEventListener("online", l);
  addEventListener("offline", l);
  return () => {
    removeEventListener("online", l);
    removeEventListener("offline", l);
  };
};
export const useOnline = () => useSyncExternalStore(onlineSub, () => navigator.onLine, () => true);

/** A boolean that turns itself off after `ms` (for "copied!" ticks, armed delete buttons…). */
export function useFlash(ms = 1600) {
  const [on, setOn] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(t.current), []);
  const fire = () => {
    setOn(true);
    clearTimeout(t.current);
    t.current = setTimeout(() => setOn(false), ms);
  };
  return [on, fire, () => setOn(false)] as const;
}
