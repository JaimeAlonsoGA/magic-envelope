"use client";

import { ArrowDown, ArrowUp, CopyPlus, Eye, Home, Mail, Palette, Plus, Send, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useEffectEvent, useRef, useState, type ReactNode } from "react";
import { BLOCK_ICON, PALETTE, newBlock } from "@/lib/blocks";
import { exampleGuest, useDraft } from "@/lib/drafts";
import { useOrigin } from "@/lib/hooks";
import { useUI } from "@/lib/locale";
import { type Block, type BlockType, type Card, type Guest } from "@/lib/model";
import { haptic } from "@/lib/native";
import { AssistantNote } from "../assistant";
import { CardView } from "../card/card-view";
import { FormatToggle } from "../preview-controls";
import { Sheet } from "../sheet";
import { SketchButton, SketchLink } from "../sketch";
import { BlockEditor } from "./block-editor";
import { GuestsPanel } from "./guests-panel";
import { SendPanel, usePublish } from "./send-panel";
import { EnvelopeCanvas, EnvelopeTargetEditor, type EnvTarget } from "./envelope-editor";
import { StylePanel } from "./style-panel";

type Panel = "add" | "theme" | "guests" | "share" | null;

/** Undo stack. Rapid edits (typing) within 800ms coalesce into one step. */
function useHistory(card: Card | undefined, apply: (c: Card) => void) {
  const stack = useRef<Card[]>([]);
  const last = useRef(0);
  const [size, setSize] = useState(0);
  const commit = (next: Card) => {
    if (!card) return;
    const now = Date.now();
    if (now - last.current > 800) {
      stack.current = [...stack.current.slice(-49), card];
      setSize(stack.current.length);
    }
    last.current = now;
    apply(next);
  };
  const undo = () => {
    const prev = stack.current.pop();
    if (!prev) return;
    setSize(stack.current.length);
    last.current = 0;
    haptic();
    apply(prev);
  };
  return { commit, undo, canUndo: size > 0 };
}

export function Editor({ id }: { id: string }) {
  const ui = useUI();
  const [draft, save] = useDraft(id);
  const [selected, setSelected] = useState<string | null>(null); // a letter block
  const [canvasPick, setCanvas] = useState<"letter" | "envelope">("letter");
  const [envTarget, setEnvTarget] = useState<EnvTarget | null>(null); // an envelope slot or the seal
  const [panel, setPanel] = useState<Panel>(null);
  const origin = useOrigin();
  const pub = usePublish(draft, save);
  const history = useHistory(draft?.card, (card) => save({ card }));

  const close = useCallback(() => { setSelected(null); setPanel(null); setEnvTarget(null); }, []);
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
    if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey && !typing) { e.preventDefault(); history.undo(); }
  });
  useEffect(() => {
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  if (!draft) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <SketchLink href="/" size="lg"><Home size={20} /> ✉</SketchLink>
      </div>
    );
  }

  const card = draft.card;
  const setCard = (patch: Partial<Card>) => history.commit({ ...card, ...patch });
  const setBlocks = (blocks: Block[]) => setCard({ blocks });
  const guests = draft.guests ?? [];
  const setGuests = (g: Guest[]) => save({ guests: g });
  // How the letter is previewed (link/image, as which guest) is a draft preference shared with the preview page.
  const view = draft.view ?? "link";
  const previewGuest = exampleGuest(draft); // the example guest everything is shown for
  const setPreviewId = (g: string | null) => save({ previewGuest: g ?? undefined }, false);
  const previewId = previewGuest?.id ?? null;
  const sel = card.blocks.find((b) => b.id === selected) ?? null;
  const idx = sel ? card.blocks.indexOf(sel) : -1;
  const shareUrl = draft.publishedId ? `${origin}/c/${draft.publishedId}` : origin;

  const patchBlock = (patch: Partial<Block>) =>
    setBlocks(card.blocks.map((b) => (b.id === selected ? ({ ...b, ...patch } as Block) : b)));
  const move = (dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= card.blocks.length) return;
    const next = [...card.blocks];
    [next[idx], next[j]] = [next[j], next[idx]];
    setBlocks(next);
  };
  const add = (type: BlockType) => {
    const b = newBlock(type);
    const next = [...card.blocks];
    const sig = next.findIndex((x) => x.type === "signature");
    // After the selected block, else just above the signature, else at the end.
    const at = idx >= 0 ? idx + 1 : sig >= 0 && type !== "signature" ? sig : next.length;
    next.splice(at, 0, b);
    setBlocks(next);
    setPanel(null);
    setSelected(b.id);
  };
  const duplicate = () => {
    if (!sel) return;
    const c = { ...structuredClone(sel), id: newBlock(sel.type).id };
    const next = [...card.blocks];
    next.splice(idx + 1, 0, c);
    setBlocks(next);
    setSelected(c.id);
  };
  const remove = () => {
    if (!sel) return;
    setBlocks(card.blocks.filter((b) => b.id !== sel.id));
    setSelected(null);
    haptic("warn");
  };
  const openPanel = (p: Panel) => { setSelected(null); setEnvTarget(null); setPanel(shown === p ? null : p); };
  // envelopes only exist for link letters
  const canvas = view === "link" ? canvasPick : "letter";
  // An empty letter always offers the block palette: there is nothing else to do yet.
  const shown: Panel = panel ?? (!sel && !envTarget && card.blocks.length === 0 && (view !== "link" || canvasPick === "letter") ? "add" : null);

  const SelIcon = sel ? BLOCK_ICON[sel.type] : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="no-print sticky top-0 z-20 flex items-center gap-2 bg-bg/85 px-3 pb-2 pt-[max(.5rem,env(safe-area-inset-top))] backdrop-blur">
        <SketchLink href="/" size="icon" aria-label={ui.home}><Home size={20} /></SketchLink>
        <div className="flex-1" />
        <SketchButton aria-label={ui.guests.title} title={ui.guests.title} active={shown === "guests"} onClick={() => openPanel("guests")} className="!px-3">
          <Users size={19} />{guests.length > 0 && <span className="text-base tabular-nums">{guests.length}</span>}
        </SketchButton>
        <SketchButton size="icon" aria-label={ui.theme} title={ui.theme} active={shown === "theme"} onClick={() => openPanel("theme")}><Palette size={20} /></SketchButton>
        {/* the envelope is a second canvas, only for link letters */}
        <SketchButton size="icon" aria-label={ui.envelope} title={view === "link" ? ui.envelope : ui.envelopesForLinks} disabled={view !== "link"}
          active={canvas === "envelope"} onClick={() => { close(); setCanvas(canvas === "envelope" ? "letter" : "envelope"); }}>
          <Mail size={20} />
        </SketchButton>
        <SketchLink href={`/edit/${id}/preview`} size="icon" aria-label={ui.preview} title={ui.preview}><Eye size={20} /></SketchLink>
        <SketchButton tone="wax" onClick={() => { openPanel("share"); if (pub.stale) pub.run(); }}>
          <Send size={18} /> <span className="max-[360px]:hidden">{ui.send}</span>
          {draft.publishedId && pub.stale && <span className="absolute -right-2.5 -top-2.5 h-3 w-3 rounded-full bg-wax ring-2 ring-bg" aria-hidden />}
        </SketchButton>
      </header>

      <main className="flex-1 px-3 pb-[60dvh] pt-2 sm:pb-48" onClick={(e) => e.target === e.currentTarget && close()}>
        {/* preview as the guest sees it: the interactive link or the flat image */}
        <AssistantNote draftId={draft.id} />
        <div className="mb-4 flex justify-center"><FormatToggle draft={draft} save={save} /></div>
        {canvas === "envelope" ? (
          <EnvelopeCanvas card={card} guestName={previewGuest?.name} selected={envTarget} onSelect={(t) => { setPanel(null); setSelected(null); setEnvTarget(t); }} />
        ) : (
        <CardView card={card} shareUrl={shareUrl} selected={selected} onSelect={(bid) => { setPanel(null); setSelected(bid); }}
          flat={view === "image"} guestName={previewGuest?.name} />
        )}
        {canvas === "letter" && (
          <div className="mt-6 flex justify-center">
            <SketchButton shape="ellipse" tone="primary" size="icon" className="!h-16 !w-16" aria-label={ui.add} active={shown === "add"} onClick={() => openPanel("add")}>
              <Plus size={28} />
            </SketchButton>
          </div>
        )}
      </main>

      {(sel || shown || envTarget) && (
        <Sheet onClose={close}>
          {envTarget && <EnvelopeTargetEditor key={envTarget} target={envTarget} card={card} setCard={setCard} />}
          {sel && SelIcon && (
            <>
              <div className="mb-3 flex items-center gap-0.5">
                <SelIcon size={20} className="mr-1.5 shrink-0 text-violet" />
                <span className="mr-auto truncate font-hand text-lg text-muted">{ui.blocks[sel.type]}</span>
                <IconBtn label={ui.moveUp} onClick={() => move(-1)} disabled={idx === 0}><ArrowUp size={18} /></IconBtn>
                <IconBtn label={ui.moveDown} onClick={() => move(1)} disabled={idx === card.blocks.length - 1}><ArrowDown size={18} /></IconBtn>
                <IconBtn label={ui.duplicate} onClick={duplicate}><CopyPlus size={18} /></IconBtn>
                <IconBtn label={ui.delete} onClick={remove} danger><Trash2 size={18} /></IconBtn>
              </div>
              <BlockEditor key={sel.id} b={sel} set={patchBlock} card={card} />
            </>
          )}
          {shown === "add" && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {PALETTE.map((type) => {
                const I = BLOCK_ICON[type];
                return (
                  <SketchButton key={type} seed={type} className="!flex-col !py-3" onClick={() => add(type)}>
                    <span className="flex flex-col items-center gap-1.5"><I size={24} /><span className="text-sm">{ui.blocks[type]}</span></span>
                  </SketchButton>
                );
              })}
            </div>
          )}
          {shown === "theme" && <StylePanel card={card} setCard={setCard} link={view === "link"} />}
          {shown === "guests" && <GuestsPanel draft={draft} setGuests={setGuests} setCard={setCard} previewId={previewId} setPreviewId={setPreviewId} />}
          {shown === "share" && <SendPanel draft={draft} pub={pub} origin={origin} save={save} />}
        </Sheet>
      )}
    </div>
  );
}

function IconBtn({ children, label, onClick, disabled, danger }: { children: ReactNode; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick}
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg transition hover:bg-ink/5 active:scale-90 disabled:opacity-25 ${danger ? "text-wax" : ""}`}>
      {children}
    </button>
  );
}

