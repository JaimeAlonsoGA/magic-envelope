"use client";

/**
 * One API for native (Capacitor iOS/Android) and the browser.
 * Every function degrades gracefully: native plugin → Web API → simple fallback.
 */
import { App } from "@capacitor/app";
import { Camera } from "@capacitor/camera";
import { Clipboard } from "@capacitor/clipboard";
import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { Share } from "@capacitor/share";

export const isNative = () => Capacitor.isNativePlatform();

/* ───────────── Haptics ───────────── */

export function haptic(kind: "tap" | "success" | "warn" = "tap") {
  if (isNative()) {
    if (kind === "tap") Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    else Haptics.notification({ type: kind === "success" ? NotificationType.Success : NotificationType.Warning }).catch(() => {});
  } else if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(kind === "tap" ? 8 : kind === "success" ? [10, 40, 20] : [30, 30, 30]);
  }
}

/* ───────────── Clipboard ───────────── */

export async function copy(text: string) {
  try {
    if (isNative()) await Clipboard.write({ string: text });
    else await navigator.clipboard.writeText(text);
    haptic("success");
    return true;
  } catch {
    return false;
  }
}

/* ───────────── Share ───────────── */

/**
 * Phones and tablets have a share sheet people expect; desktops don't (Windows/macOS dialogs are
 * often empty or fail), so there sharing means copying — done right away, inside the click.
 */
const hasShareSheet = () => isNative() || (!!navigator.share && matchMedia("(pointer: coarse)").matches);

/** Returns "shared" | "copied" | "failed". Copies the link where there's no share sheet. */
export async function share(opts: { title: string; text?: string; url: string }) {
  if (!hasShareSheet()) return (await copy(opts.url)) ? ("copied" as const) : ("failed" as const);
  try {
    if (isNative()) await Share.share({ ...opts, dialogTitle: opts.title });
    else await navigator.share(opts);
    return "shared" as const;
  } catch (e) {
    if ((e as Error)?.name === "AbortError" || /cancel/i.test(String(e))) return "shared" as const;
  }
  return (await copy(opts.url)) ? ("copied" as const) : ("failed" as const);
}

/**
 * Opens a mail/WhatsApp link without leaving a blank tab behind: mailto goes through the current
 * page (nothing happens if no mail app is set up), web links open in a new tab.
 */
export function openLink(href: string) {
  if (/^(mailto|sms|tel):/.test(href)) {
    const a = Object.assign(document.createElement("a"), { href });
    a.click();
  } else window.open(href, "_blank", "noopener");
}

/* ───────────── Files (QR png, calendar .ics) ───────────── */

const toBase64 = (blob: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(",")[1] ?? "");
    r.onerror = rej;
    r.readAsDataURL(blob);
  });

/** Save/download a file. Native: write to cache and open the share sheet (Save to Files, Calendar…). */
export async function saveFile(name: string, blob: Blob) {
  if (isNative()) {
    const { uri } = await Filesystem.writeFile({ path: name, data: await toBase64(blob), directory: Directory.Cache });
    await Share.share({ files: [uri] }).catch(() => {});
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Hand a file to the user: share sheet when files can be shared (mobile: WhatsApp, Photos…), else download. */
export async function shareFile(name: string, blob: Blob, title?: string) {
  if (isNative()) return saveFile(name, blob);
  const file = new File([blob], name, { type: blob.type });
  // Share sheet on phones/tablets (WhatsApp, Photos…); on desktops people expect a download.
  if (hasShareSheet() && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return;
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
    }
  }
  return saveFile(name, blob);
}

/* ───────────── Photos ───────────── */

function pickWithInput(capture: boolean): Promise<File | null> {
  return new Promise((res) => {
    const input = Object.assign(document.createElement("input"), { type: "file", accept: "image/*" });
    if (capture) input.setAttribute("capture", "environment");
    input.onchange = () => res(input.files?.[0] ?? null);
    input.oncancel = () => res(null);
    input.click();
  });
}

/** Camera or gallery. Native uses the system pickers; web uses a file input (camera on mobile). */
export async function pickPhoto(source: "camera" | "gallery"): Promise<File | null> {
  if (!isNative()) return pickWithInput(source === "camera");
  try {
    const r =
      source === "camera"
        ? await Camera.takePhoto({ quality: 85, targetWidth: 1600, correctOrientation: true })
        : (await Camera.chooseFromGallery({ allowMultipleSelection: false })).results[0];
    if (!r?.webPath) return null;
    const blob = await (await fetch(r.webPath)).blob();
    return new File([blob], "photo.jpg", { type: blob.type || "image/jpeg" });
  } catch {
    return null; // cancelled or permission denied
  }
}

/* ───────────── App shell: back button & deep links ───────────── */

type BackHandler = () => boolean; // return true when handled
const backStack: BackHandler[] = [];

/** Register a handler for the Android back button (e.g. close a sheet). Returns an unregister fn. */
export function onBack(fn: BackHandler) {
  backStack.push(fn);
  return () => {
    const i = backStack.lastIndexOf(fn);
    if (i >= 0) backStack.splice(i, 1);
  };
}

let shellReady = false;
export function initNativeShell(navigate: (path: string) => void) {
  if (shellReady || !isNative()) return;
  shellReady = true;
  App.addListener("backButton", ({ canGoBack }) => {
    for (let i = backStack.length - 1; i >= 0; i--) if (backStack[i]()) return;
    if (canGoBack) history.back();
    else App.exitApp();
  });
  // https://magic-envelope.com/c/abc → open inside the app
  App.addListener("appUrlOpen", ({ url }) => {
    try {
      const u = new URL(url);
      navigate(u.pathname + u.search + u.hash);
    } catch {}
  });
}
