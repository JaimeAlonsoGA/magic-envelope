"use client";

import {
  Check, Copy, Download, FileSpreadsheet, ImageIcon, KeyRound, Link2, Loader2, Mail, MessageCircle,
  HelpCircle, RefreshCw, Send, Share2, WifiOff, X,
} from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState, type ReactNode } from "react";
import { composeLinks } from "@/lib/actions";
import { fileSlug, letterNote, listTitle } from "@/lib/blocks";
import { cardStyle } from "@/lib/envelope";
import { val } from "@/lib/fields";
import { useFlash, useOnline } from "@/lib/hooks";
import { useUI } from "@/lib/locale";
import type { Card, Draft, Guest, RsvpAnswer } from "@/lib/model";
import { copy, haptic, openOutbound, saveFile, share } from "@/lib/native";
import { Seal } from "../craft";
import { SketchButton, SketchLink } from "../sketch";
import { ThanksCard } from "./thanks-card";

/** Publishing is idempotent: same id + edit key overwrites the published copy (guest names included). */
export function usePublish(draft: Draft | undefined, save: (p: Partial<Draft>, touch?: boolean) => void) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const stale = !!draft && (!draft.publishedAt || draft.updatedAt > draft.publishedAt);

  const run = async () => {
    if (!draft || busy) return;
    setBusy(true);
    setErr(false);
    try {
      const r = await fetch("/api/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          card: draft.card, id: draft.publishedId, key: draft.editKey,
          guests: (draft.guests ?? []).filter((g) => g.name.trim()).map(({ id, name }) => ({ id, name: name.trim() })),
        }),
      });
      if (!r.ok) throw new Error(String(r.status));
      const { id, key, card } = await r.json();
      save({ publishedId: id, editKey: key, publishedAt: Date.now(), ...(card ? { card } : {}) }, false);
      haptic("success");
    } catch {
      setErr(true);
      haptic("warn");
    } finally {
      setBusy(false);
    }
  };
  return { busy, err, stale, run };
}
export type Publisher = ReturnType<typeof usePublish>;

const csvCell = (s: string) => `"${s.replaceAll('"', '""')}"`;

/**
 * How a guest's letter is delivered: WhatsApp, email, or the share sheet.
 * Email gets a short letter (subject, greeting, the link on its own line, a signature).
 * Chat gets one line plus the link. The message is copied first. On a desktop the compose
 * page opens in the browser. A phone uses the app. Resolves true when it was copied.
 */
async function deliver(guest: Guest, card: Card, link: string) {
  const note = letterNote(card, guest.name, link);
  const phone = val("phone", guest.phone);
  const email = val("email", guest.email);
  if (!phone && !email) return (await share({ title: note.subject, text: note.chat, url: link })) === "copied";
  const text = email && !phone ? note.email : note.chat;
  const copied = copy(text); // inside the click, before anything takes focus
  const links = composeLinks(phone ? "whatsapp" : "email", phone || email || "", text, note.subject);
  openOutbound(links.web, links.app);
  return copied;
}

export function SendPanel({ draft, pub, origin, save, initialTab }: { draft: Draft; pub: Publisher; origin: string; save: (p: Partial<Draft>, touch?: boolean) => void; initialTab?: "link" | "image" }) {
  const ui = useUI();
  // opens on the output being previewed
  const [tab, setTab] = useState<"link" | "image">(initialTab ?? draft.view ?? "link");
  const [delivered, setDelivered] = useState(false);
  const online = useOnline();
  const card = draft.card;
  const guests = (draft.guests ?? []).filter((g) => g.name.trim());
  const sent = draft.sent ?? {};
  const base = draft.publishedId ? `${origin}/c/${draft.publishedId}` : "";
  const linkFor = (g?: Guest) => (g ? `${base}?g=${g.id}` : base);
  const markSent = (id: string) => save({ sent: { ...sent, [id]: Date.now() } }, false);

  if (!base) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        {pub.busy ? (
          <>
            <Seal value={card.seal} shape={card.sealShape} color={cardStyle(card).wax} size={64} />
            <span className="font-hand text-lg text-muted"><Loader2 className="mr-1 inline animate-spin" size={16} />{ui.publishing}</span>
          </>
        ) : (
          <>
            {!online && <span className="flex items-center gap-2 text-muted"><WifiOff size={16} /> {ui.offline}</span>}
            {pub.err && <p className="text-sm text-wax">{ui.error}</p>}
            <SketchButton tone="wax" size="lg" disabled={!online} onClick={pub.run}><Send size={18} /> {ui.publish}</SketchButton>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <div className="inline-flex rounded-full bg-ink/5 p-1" role="tablist">
          {(["link", "image"] as const).map((k) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-base transition-colors ${tab === k ? "bg-sheet shadow-sm" : "text-muted hover:text-ink"}`}>
              {k === "link" ? <Link2 size={16} /> : <ImageIcon size={16} />} {k === "link" ? ui.out.link : ui.out.image}
            </button>
          ))}
        </div>
        {pub.stale && (
          <SketchButton size="sm" tone="primary" className="ml-auto" disabled={pub.busy || !online} onClick={pub.run}>
            <RefreshCw size={15} className={pub.busy ? "animate-spin" : ""} /> {ui.update}
          </SketchButton>
        )}
      </div>
      {pub.err && <p className="text-sm text-wax">{ui.error}</p>}

      {/* any way of sending it (data-delivers) completes the story: then say thanks */}
      <div className="space-y-5" onClickCapture={(e) => (e.target as HTMLElement).closest("[data-delivers]") && setDelivered(true)}>
        {tab === "link" ? (
          guests.length ? <GuestLinks draft={draft} guests={guests} sent={sent} linkFor={linkFor} markSent={markSent} /> : <SingleLink draft={draft} url={base} />
        ) : (
          <Images draft={draft} guests={guests} markSent={markSent} />
        )}
      </div>
      {delivered && <ThanksCard />}
    </div>
  );
}

function SingleLink({ draft, url }: { draft: Draft; url: string }) {
  const ui = useUI();
  const [copied, flash] = useFlash();
  const [keyCopied, flashKey] = useFlash();
  const [qr, setQr] = useState("");
  const note = letterNote(draft.card, undefined, url);
  useEffect(() => {
    let live = true;
    QRCode.toDataURL(url, { margin: 1, width: 512 }).then((s) => live && setQr(s));
    return () => { live = false; };
  }, [url]);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      {qr && (
        <button type="button" onClick={async () => saveFile("magic-envelope-qr.png", await (await fetch(qr)).blob())}
          className="shrink-0 rounded-lg bg-white p-1 shadow-sm transition-transform hover:-translate-y-0.5" aria-label={ui.saveQr} title={ui.saveQr}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="" className="h-36 w-36" />
        </button>
      )}
      <div className="w-full min-w-0 flex-1 space-y-3">
        <button data-delivers type="button" onClick={() => copy(url).then((ok) => ok && flash())} className="field flex w-full items-center gap-2 text-left font-mono text-sm">
          <span className="truncate">{url.replace(/^https?:\/\//, "")}</span>
          {copied ? <Check size={16} className="ml-auto shrink-0 text-violet" /> : <Copy size={16} className="ml-auto shrink-0" />}
        </button>
        <div className="flex flex-wrap gap-2">
          <SketchButton data-delivers tone="wax" onClick={() => share({ title: note.subject, text: note.chat, url }).then((r) => r === "copied" && flash())}><Share2 size={18} /> {ui.share}</SketchButton>
          <SketchLink data-delivers external href={composeLinks("whatsapp", "", note.chat).web} onClick={(e) => { e.preventDefault(); const links = composeLinks("whatsapp", "", note.chat); openOutbound(links.web, links.app); }}><MessageCircle size={18} /> WhatsApp</SketchLink>
          <SketchLink data-delivers file href={`/api/v1/letters/${draft.publishedId}/image?download=1`} aria-label={ui.out.download} title={ui.out.download}><Download size={18} /> {ui.out.download}</SketchLink>
        </div>
        {draft.editKey && (
          <button type="button" onClick={() => copy(`${location.origin}/e/${draft.publishedId}#${draft.editKey}`).then((ok) => ok && flashKey())}
            className="inline-flex min-h-10 items-center gap-2 text-sm text-muted hover:text-ink">
            {keyCopied ? <Check size={16} /> : <KeyRound size={16} />} {keyCopied ? ui.copied : ui.editElsewhere}
          </button>
        )}
      </div>
    </div>
  );
}

const ANSWER_ICON: Record<RsvpAnswer, ReactNode> = { yes: <Check size={14} />, maybe: <HelpCircle size={14} />, no: <X size={14} /> };
const ANSWER_TONE: Record<RsvpAnswer, string> = { yes: "text-[#2f7d46]", maybe: "text-muted", no: "text-wax" };

/** What each guest answered with the letter's RSVP buttons (published letters only; fetched when the panel opens). */
function useAnswers(draft: Draft) {
  const [answers, setAnswers] = useState<Record<string, RsvpAnswer>>({});
  useEffect(() => {
    if (!draft.publishedId || !draft.editKey) return;
    const ac = new AbortController();
    fetch(`/api/card/${draft.publishedId}`, { headers: { "x-edit-key": draft.editKey }, signal: ac.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { rsvps?: { answers: { guestId: string | null; answer: RsvpAnswer }[] } } | null) =>
        d?.rsvps && setAnswers(Object.fromEntries(d.rsvps.answers.filter((a) => a.guestId).map((a) => [a.guestId!, a.answer]))))
      .catch(() => {});
    return () => ac.abort();
  }, [draft.publishedId, draft.editKey]);
  return answers;
}

/** One row per guest: their own link, sent from the channel we know for them, with sent tracking. */
function GuestLinks({ draft, guests, sent, linkFor, markSent }: {
  draft: Draft; guests: Guest[]; sent: Record<string, number>; linkFor: (g?: Guest) => string; markSent: (id: string) => void;
}) {
  const ui = useUI();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [allCopied, flashAll] = useFlash();
  const answers = useAnswers(draft);
  const done = guests.filter((g) => sent[g.id]).length;
  const flashGuest = (id: string) => { setCopiedId(id); setTimeout(() => setCopiedId(null), 1400); };
  const copyOne = (g: Guest) => copy(linkFor(g)).then((ok) => ok && flashGuest(g.id));
  const csv = () => saveFile(`${fileSlug(listTitle(draft.card))}-guests.csv`, new Blob(
    [["name,phone,email,link", ...guests.map((g) => [g.name, g.phone ?? "", g.email ?? "", linkFor(g)].map(csvCell).join(","))].join("\n")],
    { type: "text/csv" },
  ));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-auto text-sm text-muted">{ui.out.progress(done, guests.length)}</span>
        {guests.some((g) => !sent[g.id]) && (
          <SketchButton data-delivers size="sm" tone="wax" onClick={() => {
            const g = guests.find((x) => !sent[x.id])!;
            deliver(g, draft.card, linkFor(g)).then((copied) => copied && flashGuest(g.id));
            markSent(g.id);
          }}><Send size={15} /> {ui.out.sendNext}</SketchButton>
        )}
        <SketchButton data-delivers size="sm" onClick={() => copy(guests.map((g) => `${g.name}: ${linkFor(g)}`).join("\n")).then((ok) => ok && flashAll())}>
          {allCopied ? <Check size={15} /> : <Copy size={15} />} {ui.out.copyAll}
        </SketchButton>
        <SketchButton data-delivers size="sm" onClick={csv}><FileSpreadsheet size={15} /> CSV</SketchButton>
      </div>
      <ul className="divide-y divide-ink/10">
        {guests.map((g) => {
          const channel = val("phone", g.phone) ? <MessageCircle size={16} /> : val("email", g.email) ? <Mail size={16} /> : <Share2 size={16} />;
          return (
            <li key={g.id} className="flex items-center gap-1.5 py-1.5">
              <span className="min-w-0 flex-1 truncate text-lg">{g.name}</span>
              {answers[g.id]
                ? <span className={`flex items-center gap-1 text-sm ${ANSWER_TONE[answers[g.id]]}`}>{ANSWER_ICON[answers[g.id]]} {ui.rsvp[answers[g.id]]}</span>
                : sent[g.id] && <span className="flex items-center gap-1 text-sm text-violet"><Check size={14} /> {ui.out.sent}</span>}
              <button data-delivers type="button" aria-label={`${ui.copy} — ${g.name}`} title={ui.copy} onClick={() => copyOne(g)}
                className="grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-ink/5 hover:text-ink">
                {copiedId === g.id ? <Check size={16} /> : <Copy size={16} />}
              </button>
              <SketchButton data-delivers size="sm" tone={sent[g.id] ? "plain" : "wax"} onClick={() => { deliver(g, draft.card, linkFor(g)).then((copied) => copied && flashGuest(g.id)); markSent(g.id); }}>
                {channel} {ui.out.sendTo}
              </SketchButton>
            </li>
          );
        })}
      </ul>
      <details className="text-sm text-muted">
        <summary className="cursor-pointer select-none">{ui.out.generic}</summary>
        <div className="pt-3"><SingleLink draft={draft} url={linkFor()} /></div>
      </details>
    </div>
  );
}

/** One PNG per guest, named for them. Many guests come as one ZIP, named for the letter — not for the fallback name. */
function Images({ draft, guests, markSent }: { draft: Draft; guests: Guest[]; markSent: (id: string) => void }) {
  const ui = useUI();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const id = draft.publishedId!;
  const file = (g?: Guest) => `/api/v1/letters/${id}/image?download=1${g ? `&g=${g.id}` : ""}`;

  const all = async () => {
    setErr(false);
    setBusy(true);
    try {
      const r = await fetch(`/api/v1/letters/${id}/images.zip`, { headers: { authorization: `Bearer ${draft.editKey}` } });
      if (!r.ok) throw new Error(String(r.status));
      const name = /filename="([^"]+)"/.exec(r.headers.get("content-disposition") ?? "")?.[1] ?? `${fileSlug(listTitle(draft.card))}.zip`;
      await saveFile(name, await r.blob());
    } catch {
      setErr(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{ui.out.imageNote}</p>
      <div className="flex flex-wrap gap-2">
        {guests.length > 0 && (
          <SketchButton data-delivers tone="wax" disabled={busy} onClick={all}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={18} />} {ui.out.zip(guests.length)}
          </SketchButton>
        )}
        <SketchLink data-delivers file href={file()} tone={guests.length ? "plain" : "wax"}>
          <ImageIcon size={18} /> {guests.length ? ui.out.generic : ui.out.download}
        </SketchLink>
      </div>
      {guests.length > 0 && (
        <ul className="divide-y divide-ink/10">
          {guests.map((g) => (
            <li key={g.id} className="flex items-center gap-2 py-1.5">
              <span className="min-w-0 flex-1 truncate text-lg">{g.name}</span>
              {draft.sent?.[g.id] && <Check size={15} className="text-violet" aria-label={ui.out.sent} />}
              <SketchLink file href={file(g)} size="sm" onClick={() => markSent(g.id)}><Download size={15} /> {ui.out.download}</SketchLink>
            </li>
          ))}
        </ul>
      )}
      {err && <p className="text-sm text-wax">{ui.error}</p>}
    </div>
  );
}
