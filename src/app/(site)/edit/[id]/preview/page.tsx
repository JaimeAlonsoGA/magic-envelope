"use client";

import { ArrowLeft, Loader2, RotateCcw, Send } from "lucide-react";
import { use, useEffect, useState } from "react";
import { Reveal } from "@/components/card/reveal";
import { SendPanel, usePublish } from "@/components/editor/send-panel";
import { useLetterImages } from "@/components/export-stage";
import { Sheet } from "@/components/sheet";
import { SketchButton, SketchLink } from "@/components/sketch";
import { exampleGuest, useDraft } from "@/lib/drafts";
import { cardStyle } from "@/lib/envelope";
import { useOrigin } from "@/lib/hooks";
import { useUI } from "@/lib/locale";
import type { Card } from "@/lib/model";

/** The exact PNG that "Send → Image" produces, rendered live. */
function ImageResult({ card, shareUrl, guestName }: { card: Card; shareUrl: string; guestName?: string }) {
  const img = useLetterImages();
  const [src, setSrc] = useState<string | null>(null);
  const key = JSON.stringify([card, guestName, shareUrl]);
  useEffect(() => {
    let url: string | null = null;
    let live = true;
    const t = setTimeout(() => {
      img.render(card, shareUrl, guestName, "png").then((b) => {
        if (!live) return;
        url = URL.createObjectURL(b);
        setSrc(url);
      }).catch(() => {});
    }, 150);
    return () => { live = false; clearTimeout(t); if (url) URL.revokeObjectURL(url); };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto w-full max-w-[36rem]">
      {img.stage}
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="w-full shadow-[0_1px_2px_rgb(0_0_0/.08),0_24px_48px_-20px_rgb(0_0_0/.35)]" />
      ) : (
        <div className="grid aspect-[3/4] place-items-center text-muted"><Loader2 className="animate-spin" /></div>
      )}
    </div>
  );
}

/**
 * Preview = exactly what the guest receives, in the letter's format (chosen in the editor):
 *  - link: the envelope centred on screen, opened with one tap (replayable)
 *  - image: the very PNG that will be sent
 * For any guest, with Send right here.
 */
export default function PreviewPage({ params }: PageProps<"/edit/[id]/preview">) {
  const ui = useUI();
  const { id } = use(params);
  const [draft, save] = useDraft(id);
  const origin = useOrigin();
  const pub = usePublish(draft, save);
  const [sending, setSending] = useState(false);
  const [take, setTake] = useState(0); // replay counter for the envelope
  if (!draft) return null;

  const card = draft.card;
  const guest = exampleGuest(draft); // picked in Guests (first guest by default)
  const format = draft.view ?? "link";
  const shareUrl = draft.publishedId ? `${origin}/c/${draft.publishedId}${guest ? `?g=${guest.id}` : ""}` : origin;
  const page = format === "link" ? cardStyle(card).page : undefined;

  return (
    <div className="min-h-dvh" style={page ? { background: page } : undefined}>
      <header className="no-print fixed inset-x-0 top-0 z-40 flex items-center gap-2 px-3 pb-2 pt-[max(.5rem,env(safe-area-inset-top))]">
        <SketchLink href={`/edit/${id}`} size="icon" aria-label={ui.edit} title={ui.edit} className="bg-bg/90"><ArrowLeft size={20} /></SketchLink>
        <div className="flex-1" />
        {format === "link" && (
          <SketchButton size="icon" aria-label={ui.replay} title={ui.replay} className="bg-bg/90" onClick={() => setTake(take + 1)}><RotateCcw size={18} /></SketchButton>
        )}
        <SketchButton tone="wax" className="bg-bg/90" onClick={() => { setSending(true); if (pub.stale) pub.run(); }}>
          <Send size={18} /> <span className="max-[380px]:hidden">{ui.send}</span>
          {draft.publishedId && pub.stale && <span className="absolute -right-2.5 -top-2.5 h-3 w-3 rounded-full bg-wax ring-2 ring-bg" aria-hidden />}
        </SketchButton>
      </header>

      {format === "link" ? (
        // keyed: switching guest or pressing replay seals the envelope again
        <Reveal key={`${guest?.id ?? "-"}:${take}`} card={card} guestName={guest?.name} shareUrl={shareUrl} bare />
      ) : (
        <div className="px-3 pb-16 pt-20 sm:px-6"><ImageResult card={card} shareUrl={shareUrl} guestName={guest?.name} /></div>
      )}

      {sending && (
        <Sheet onClose={() => setSending(false)}>
          <SendPanel draft={draft} pub={pub} origin={origin} save={save} initialTab={format} />
        </Sheet>
      )}
    </div>
  );
}
