"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { initNativeShell, isNative } from "@/lib/native";

/** Wires Capacitor app events (Android back, deep links). No-op in the browser. */
export function NativeShell() {
  const router = useRouter();
  useEffect(() => {
    initNativeShell((path) => router.push(path));
    if (isNative()) document.documentElement.dataset.native = "true";
  }, [router]);
  return null;
}
