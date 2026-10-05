"use client";

import { nanoid } from "nanoid";
import { useCallback, useSyncExternalStore } from "react";
import { guessLang } from "./i18n";
import { Card, LANGS, type Draft, type Lang, type PublicGuest } from "./model";

/* Drafts live in localStorage: no account needed. Changes in other tabs are picked up via the storage event. */

const KEY = "me:drafts";
const LANG_KEY = "me:lang";
const listeners = new Set<() => void>();
let cache: Draft[] | null = null;
let broken: unknown[] = []; // drafts that fail validation are kept untouched, never silently dropped

const emit = () => listeners.forEach((l) => l());

function read(): Draft[] {
  if (cache) return cache;
  cache = [];
  broken = [];
  try {
    for (const raw of JSON.parse(localStorage.getItem(KEY) ?? "[]") as Draft[]) {
      const card = Card.safeParse(raw?.card);
      if (card.success) cache.push({ ...raw, card: card.data });
      else broken.push(raw);
    }
  } catch {}
  return cache;
}

function write(next: Draft[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify([...next, ...broken]));
  } catch {
    /* quota or private mode: keep the in-memory copy */
  }
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    cache = null;
    l();
  };
  addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    removeEventListener("storage", onStorage);
  };
}

const EMPTY: Draft[] = [];
export const useDrafts = () => useSyncExternalStore(subscribe, read, () => EMPTY);

export function useDraft(id: string) {
  const draft = useDrafts().find((d) => d.id === id);
  const save = useCallback(
    (patch: Partial<Omit<Draft, "id">>, touch = true) =>
      write(read().map((d) => (d.id === id ? { ...d, ...patch, ...(touch ? { updatedAt: Date.now() } : {}) } : d))),
    [id],
  );
  return [draft, save] as const;
}

export function createDraft(card: Card, extra?: Partial<Draft>) {
  const id = nanoid(10);
  write([{ id, card, updatedAt: Date.now(), ...extra }, ...read()]);
  return id;
}

/** Copy of a draft, unpublished (e.g. "same party, next year"). */
export const duplicateDraft = (id: string) => {
  const src = read().find((d) => d.id === id);
  return src ? createDraft(structuredClone(src.card)) : null;
};

/** The guest used as the example in the editor and preview: the one picked in Guests, else the first. */
export const exampleGuest = (d: Draft) => {
  const guests = (d.guests ?? []).filter((g) => g.name.trim());
  return guests.find((g) => g.id === d.previewGuest) ?? guests[0];
};

export const deleteDraft = (id: string) => write(read().filter((d) => d.id !== id));

/** Import a published card + its edit key (edit link from another device). Reuses an existing local copy. */
/** Opens a published letter here. Guests come along with their ids, so their links stay the same. */
export function importDraft(publishedId: string, editKey: string, card: Card, guests: PublicGuest[] = []) {
  const existing = read().find((d) => d.publishedId === publishedId);
  if (existing) return existing.id;
  return createDraft(card, { publishedId, editKey, publishedAt: Date.now() + 1, guests });
}

/* ───────────── Last letter language (wizard default) ───────────── */

export function getLastLang(): Lang {
  try {
    const l = localStorage.getItem(LANG_KEY) as Lang | null;
    if (l && LANGS.includes(l)) return l;
  } catch {}
  return guessLang();
}

export function setLastLang(l: Lang) {
  try {
    localStorage.setItem(LANG_KEY, l);
  } catch {}
}
