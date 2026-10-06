"use client";

import Link from "next/link";
import rough from "roughjs";
import type { Options } from "roughjs/bin/core";
import {
  useId, useLayoutEffect, useMemo, useRef, useState,
  type ButtonHTMLAttributes, type HTMLAttributes, type MouseEventHandler, type ReactNode,
} from "react";
import { haptic } from "@/lib/native";

const gen = rough.generator();

function seedOf(s: string) {
  let h = 7;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 2_147_483_647;
  return h || 1;
}

/** Border-box size of an element, kept in sync with ResizeObserver. */
export function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, set] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.offsetWidth, h = el.offsetHeight;
      set((s) => (Math.abs(s.w - w) < 1 && Math.abs(s.h - h) < 1 ? s : { w, h }));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

type Shape = "rect" | "ellipse" | "pill";
type FrameProps = {
  w: number; h: number; shape?: Shape; seed: string; stroke?: string; fill?: string;
  strokeWidth?: number; roughness?: number; fillStyle?: Options["fillStyle"];
};

/** Hand-drawn outline (and optional fill) behind any content, Excalidraw style. Deterministic per seed. */
export function RoughFrame({
  w, h, shape = "rect", seed, stroke = "currentColor", fill, strokeWidth = 1.6, roughness = 1.3, fillStyle = "hachure",
}: FrameProps) {
  const paths = useMemo(() => {
    if (w < 4 || h < 4) return [];
    const o: Options = {
      seed: seedOf(seed), stroke, strokeWidth, roughness, bowing: 1.1,
      ...(fill ? { fill, fillStyle, fillWeight: 1.1, hachureGap: 5 } : {}),
    };
    const p = 2.5;
    const iw = w - p * 2, ih = h - p * 2;
    const d =
      shape === "ellipse" ? gen.ellipse(w / 2, h / 2, iw, ih, o)
        : shape === "pill" ? gen.path(pillPath(p, p, iw, ih), o)
          : gen.rectangle(p, p, iw, ih, o);
    return gen.toPaths(d);
  }, [w, h, shape, seed, stroke, fill, strokeWidth, roughness, fillStyle]);

  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 overflow-visible" width={w} height={h}>
      {paths.map((p, i) => (
        <path key={i} d={p.d} stroke={p.stroke} strokeWidth={p.strokeWidth} fill={p.fill ?? "none"} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

function pillPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(h / 2, w / 2);
  return `M${x + r},${y} L${x + w - r},${y} A${r},${r} 0 0 1 ${x + w - r},${y + h} L${x + r},${y + h} A${r},${r} 0 0 1 ${x + r},${y} Z`;
}

type BoxProps = HTMLAttributes<HTMLDivElement> & Omit<Partial<FrameProps>, "w" | "h">;

/** A div with a hand-drawn frame. */
export function SketchBox({ shape, seed, stroke, fill, strokeWidth, roughness, fillStyle, className = "", children, ...rest }: BoxProps) {
  const [ref, { w, h }] = useSize<HTMLDivElement>();
  const auto = useId();
  return (
    <div ref={ref} className={`relative ${className}`} {...rest}>
      <RoughFrame w={w} h={h} shape={shape} seed={seed ?? auto} stroke={stroke} fill={fill} fillStyle={fillStyle} strokeWidth={strokeWidth} roughness={roughness} />
      <div className="relative">{children}</div>
    </div>
  );
}

/* ───────────── Buttons & links ───────────── */

type Tone = "plain" | "primary" | "wax";
type Size = "md" | "sm" | "icon" | "lg";

const SIZE: Record<Size, string> = {
  sm: "min-h-9 px-3 py-1 text-base",
  md: "min-h-11 px-4 py-2 text-lg",
  lg: "min-h-14 px-6 py-3 text-xl",
  icon: "h-11 w-11 p-0",
};
const TONE: Record<Tone, { stroke: string; fill?: string }> = {
  plain: { stroke: "var(--ink)" },
  primary: { stroke: "var(--violet)", fill: "var(--violet-soft)" },
  wax: { stroke: "var(--wax)", fill: "var(--wax-soft)" },
};

type Common = { shape?: Shape; seed?: string; tone?: Tone; size?: Size; active?: boolean; children: ReactNode; className?: string };

function useSketch<T extends HTMLElement>({ shape = "rect", seed, tone = "plain", size = "md", active, className = "" }: Omit<Common, "children">) {
  const [ref, { w, h }] = useSize<T>();
  const auto = useId();
  const t = TONE[tone];
  const fill = active ? "var(--highlight)" : t.fill;
  const frame = <RoughFrame w={w} h={h} shape={shape} seed={seed ?? auto} stroke={t.stroke} fill={fill} fillStyle={active ? "solid" : "hachure"} />;
  const cls = `group/sb relative inline-flex select-none items-center justify-center gap-2 font-hand leading-none transition-[transform,background-color] duration-150 ease-out
    rounded-md hover:bg-ink/[.04] active:scale-[.97] disabled:pointer-events-none disabled:opacity-40
    focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-dashed focus-visible:outline-violet
    ${SIZE[size]} ${className}`;
  return { ref, frame, cls };
}

export function SketchButton({ shape, seed, tone, size, active, className, children, onClick, type = "button", ...rest }: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  const { ref, frame, cls } = useSketch<HTMLButtonElement>({ shape, seed, tone, size, active, className });
  return (
    <button ref={ref} type={type} className={cls} aria-pressed={rest.role ? undefined : active} onClick={(e) => { haptic(); onClick?.(e); }} {...rest}>
      {frame}
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </button>
  );
}

/** Same look as SketchButton, but a real link (internal → next/link, external → new tab). */
export function SketchLink({ href, external, file, onClick, shape, seed, tone, size, active, className, children, ...rest }: Common & { href: string; external?: boolean; file?: boolean; onClick?: MouseEventHandler<HTMLAnchorElement>; "aria-label"?: string; title?: string; "data-delivers"?: boolean }) {
  const { ref, frame, cls } = useSketch<HTMLAnchorElement>({ shape, seed, tone, size, active, className });
  const body = (<>{frame}<span className="relative inline-flex items-center gap-2">{children}</span></>);
  // file: same-origin download; the server's Content-Disposition sets the filename. external: leave the site.
  if (file || external) return <a ref={ref} href={href} className={cls} onClick={onClick} {...(file ? {} : { target: "_blank", rel: "noopener noreferrer" })} {...rest}>{body}</a>;
  return <Link ref={ref} href={href} className={cls} onClick={onClick} {...rest}>{body}</Link>;
}

/** A single hand-drawn stroke under/through content (wordmarks, emphasis). Deterministic per seed. */
export function RoughUnderline({ seed = "u", stroke = "currentColor", className = "" }: { seed?: string; stroke?: string; className?: string }) {
  const [ref, { w, h }] = useSize<HTMLSpanElement>();
  const paths = useMemo(() => {
    if (w < 4) return [];
    const y = h - 3;
    return gen.toPaths(gen.curve([[2, y], [w * 0.35, y - 2.5], [w * 0.7, y + 1], [w - 2, y - 1.5]], { seed: seedOf(seed), stroke, strokeWidth: 3, roughness: 1.2, bowing: 2 }));
  }, [w, h, seed, stroke]);
  return (
    <span ref={ref} className={`pointer-events-none absolute inset-x-0 -bottom-2 h-4 ${className}`} aria-hidden>
      <svg width={w} height={h} className="overflow-visible">{paths.map((p, i) => <path key={i} d={p.d} stroke={p.stroke} strokeWidth={p.strokeWidth} fill="none" strokeLinecap="round" />)}</svg>
    </span>
  );
}
