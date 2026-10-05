"use client";

import {
  Check, Copy, Download, FileSpreadsheet, ImageIcon, KeyRound, Link2, Loader2, Mail, MessageCircle, Printer,
  RefreshCw, Send, Share2, WifiOff,
} from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { cardTitle } from "@/lib/blocks";
import { val } from "@/lib/fields";
import { useFlash, useOnline } from "@/lib/hooks";
import type { Draft, Guest } from "@/lib/model";
import { copy, haptic, saveFile, share, shareFile } from "@/lib/native";
import { UI } from "@/lib/ui";
import { cardStyle } from "../card/card-view";
import { Seal } from "../craft";
import { slug, useLetterImages } from "../export-stage";
import { SketchButton, SketchLink } from "../sketch";

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
      const { id, key } = await r.json();
      save({ publishedId: id, editKey: key, publishedAt: Date.now() }, false);
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

const O = UI.out;
const csvCell = (s: string) => `"${s.replaceAll('"', '""')}"`;

/** How a guest's letter is delivered: their phone (WhatsApp), their email, or the system share sheet. */
function deliver(guest: Guest, title: string, link: string) {
  const text = `${title}\n${link}`;
  const phone = val("phone", guest.phone);
  const email = val("email", guest.email);
  if (phone) return window.open(`https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  if (email) return window.open(`mailto:${email}?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text)}`, "_blank");
  return share({ title, text: title, url: link });
}

export function SendPanel({ draft, pub, origin, save, initialTab }: { draft: Draft; pub: Publisher; origin: string; save: (p: Partial<Draft>, touch?: boolean) => void; initialTab?: "link" | "image" }) {
  // opens on the output being previewed
  const [tab, setTab] = useState<"link" | "image">(initialTab ?? draft.view ?? "link");
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
            <span className="font-hand text-lg text-muted"><Loader2 className="mr-1 inline animate-spin" size={16} />{UI.publishing}</span>
          </>
        ) : (
          <>
            {!online && <span className="flex items-center gap-2 text-muted"><WifiOff size={16} /> {UI.offline}</span>}
            {pub.err && <p className="text-sm text-wax">{UI.error}</p>}
            <SketchButton tone="wax" size="lg" disabled={!online} onClick={pub.run}><Send size={18} /> {UI.publish}</SketchButton>
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
              {k === "link" ? <Link2 size={16} /> : <ImageIcon size={16} />} {k === "link" ? O.link : O.image}
            </button>
          ))}
        </div>
        {pub.stale && (
          <SketchButton size="sm" tone="primary" className="ml-auto" disabled={pub.busy || !online} onClick={pub.run}>
            <RefreshCw size={15} className={pub.busy ? "animate-spin" : ""} /> {UI.update}
          </SketchButton>
        )}
      </div>
      {pub.err && <p className="text-sm text-wax">{UI.error}</p>}

      {tab === "link" ? (
        guests.length ? <GuestLinks draft={draft} guests={guests} sent={sent} linkFor={linkFor} markSent={markSent} /> : <SingleLink draft={draft} url={base} />
      ) : (
        <Images draft={draft} guests={guests} linkFor={linkFor} markSent={markSent} />
      )}
    </div>
  );
}

function SingleLink({ draft, url }: { draft: Draft; url: string }) {
  const [copied, flash] = useFlash();
  const [keyCopied, flashKey] = useFlash();
  const [qr, setQr] = useState("");
  const title = cardTitle(draft.card);
  useEffect(() => {
    let live = true;
    QRCode.toDataURL(url, { margin: 1, width: 512 }).then((s) => live && setQr(s));
    return () => { live = false; };
  }, [url]);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      {qr && (
        <button type="button" onClick={async () => saveFile("magic-envelope-qr.png", await (await fetch(qr)).blob())}
          className="shrink-0 rounded-lg bg-white p-1 shadow-sm transition-transform hover:-translate-y-0.5" aria-label="Save QR code" title="Save QR code">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="" className="h-36 w-36" />
        </button>
      )}
      <div className="w-full min-w-0 flex-1 space-y-3">
        <button type="button" onClick={() => copy(url).then((ok) => ok && flash())} className="field flex w-full items-center gap-2 text-left font-mono text-sm">
          <span className="truncate">{url.replace(/^https?:\/\//, "")}</span>
          {copied ? <Check size={16} className="ml-auto shrink-0 text-violet" /> : <Copy size={16} className="ml-auto shrink-0" />}
        </button>
        <div className="flex flex-wrap gap-2">
          <SketchButton tone="wax" onClick={() => share({ title, text: title, url }).then((r) => r === "copied" && flash())}><Share2 size={18} /> {UI.share}</SketchButton>
          <SketchLink external href={`https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`}><MessageCircle size={18} /> WhatsApp</SketchLink>
          <SketchLink external href={`${url}?print=1`} size="icon" aria-label={UI.print} title={UI.print}><Printer size={18} /></SketchLink>
        </div>
        {draft.editKey && (
          <button type="button" onClick={() => copy(`${location.origin}/e/${draft.publishedId}#${draft.editKey}`).then((ok) => ok && flashKey())}
            className="inline-flex min-h-10 items-center gap-2 text-sm text-muted hover:text-ink">
            {keyCopied ? <Check size={16} /> : <KeyRound size={16} />} {keyCopied ? UI.copied : UI.editElsewhere}
          </button>
        )}
      </div>
    </div>
  );
}

/** One row per guest: their own link, sent from the channel we know for them, with sent tracking. */
function GuestLinks({ draft, guests, sent, linkFor, markSent }: {
  draft: Draft; guests: Guest[]; sent: Record<string, number>; linkFor: (g?: Guest) => string; markSent: (id: string) => void;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [allCopied, flashAll] = useFlash();
  const done = guests.filter((g) => sent[g.id]).length;
  const copyOne = (g: Guest) => copy(linkFor(g)).then((ok) => { if (ok) { setCopiedId(g.id); setTimeout(() => setCopiedId(null), 1400); } });
  const csv = () => saveFile(`${slug(cardTitle(draft.card))}-guests.csv`, new Blob(
    [["name,phone,email,link", ...guests.map((g) => [g.name, g.phone ?? "", g.email ?? "", linkFor(g)].map(csvCell).join(","))].join("\n")],
    { type: "text/csv" },
  ));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-auto text-sm text-muted">{O.progress(done, guests.length)}</span>
        <SketchButton size="sm" onClick={() => copy(guests.map((g) => `${g.name}: ${linkFor(g)}`).join("\n")).then((ok) => ok && flashAll())}>
          {allCopied ? <Check size={15} /> : <Copy size={15} />} {O.copyAll}
        </SketchButton>
        <SketchButton size="sm" onClick={csv}><FileSpreadsheet size={15} /> CSV</SketchButton>
      </div>
      <ul className="divide-y divide-ink/10">
        {guests.map((g) => {
          const title = cardTitle(draft.card, g.name);
          const channel = val("phone", g.phone) ? <MessageCircle size={16} /> : val("email", g.email) ? <Mail size={16} /> : <Share2 size={16} />;
          return (
            <li key={g.id} className="flex items-center gap-1.5 py-1.5">
              <span className="min-w-0 flex-1 truncate text-lg">{g.name}</span>
              {sent[g.id] && <span className="flex items-center gap-1 text-sm text-violet"><Check size={14} /> {O.sent}</span>}
              <button type="button" aria-label={`${UI.copy} — ${g.name}`} title={UI.copy} onClick={() => copyOne(g)}
                className="grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-ink/5 hover:text-ink">
                {copiedId === g.id ? <Check size={16} /> : <Copy size={16} />}
              </button>
              <SketchButton size="sm" tone={sent[g.id] ? "plain" : "wax"} onClick={() => { deliver(g, title, linkFor(g)); markSent(g.id); }}>
                {channel} {O.sendTo}
              </SketchButton>
            </li>
          );
        })}
      </ul>
      <details className="text-sm text-muted">
        <summary className="cursor-pointer select-none">{O.generic}</summary>
        <div className="pt-3"><SingleLink draft={draft} url={linkFor()} /></div>
      </details>
    </div>
  );
}

/** Flat PNGs: one generic image, one per guest, or all of them zipped. */
function Images({ draft, guests, linkFor, markSent }: { draft: Draft; guests: Guest[]; linkFor: (g?: Guest) => string; markSent: (id: string) => void }) {
  const img = useLetterImages();
  const [progress, setProgress] = useState<number | null>(null);
  const [err, setErr] = useState(false);
  const card = draft.card;
  const title = cardTitle(card);

  const one = async (g?: Guest) => {
    setErr(false);
    try {
      const blob = await img.render(card, linkFor(g), g?.name);
      await shareFile(`${slug(g?.name ?? title)}.png`, blob, cardTitle(card, g?.name));
      if (g) markSent(g.id);
    } catch {
      setErr(true);
    }
  };
  const all = async () => {
    setErr(false);
    setProgress(0);
    try {
      const zip = await img.renderZip(card, guests.map((g) => ({ name: g.name, shareUrl: linkFor(g) })), setProgress);
      await saveFile(`${slug(title)}.zip`, zip);
    } catch {
      setErr(true);
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="space-y-4">
      {img.stage}
      <p className="text-sm text-muted">{O.imageNote}</p>
      <div className="flex flex-wrap gap-2">
        {guests.length > 0 && (
          <SketchButton tone="wax" disabled={img.busy || progress !== null} onClick={all}>
            {progress !== null ? <><Loader2 size={16} className="animate-spin" /> {O.rendering(progress, guests.length)}</> : <><Download size={18} /> {O.zip(guests.length)}</>}
          </SketchButton>
        )}
        <SketchButton tone={guests.length ? "plain" : "wax"} disabled={img.busy || progress !== null} onClick={() => one()}>
          {img.busy && progress === null ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={18} />} {guests.length ? O.generic : O.download}
        </SketchButton>
        <SketchLink external href={`${linkFor()}?print=1`} size="icon" aria-label={UI.print} title={UI.print}><Printer size={18} /></SketchLink>
      </div>
      {guests.length > 0 && (
        <ul className="divide-y divide-ink/10">
          {guests.map((g) => (
            <li key={g.id} className="flex items-center gap-2 py-1.5">
              <span className="min-w-0 flex-1 truncate text-lg">{g.name}</span>
              {draft.sent?.[g.id] && <Check size={15} className="text-violet" aria-label={O.sent} />}
              <SketchButton size="sm" disabled={img.busy || progress !== null} onClick={() => one(g)}><Share2 size={15} /> {O.shareImage}</SketchButton>
            </li>
          ))}
        </ul>
      )}
      {err && <p className="text-sm text-wax">{UI.error}</p>}
    </div>
  );
}
