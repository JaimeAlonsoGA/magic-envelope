/**
 * Seal marks: solid silhouettes on a 24×24 grid, centred and of even visual weight, so they press
 * into wax like a real die (stroked line icons look flat in wax). Each returns plain SVG shapes
 * painted with `fill` — the seal draws them three times (shadow, lit lip, recess).
 */
import type { ReactNode } from "react";
import type { SealIcon } from "@/lib/craft";

const poly = (pts: [number, number][]) => `M${pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join("L")}Z`;

/** n-pointed star around (cx, cy). */
const starPath = (n: number, cx: number, cy: number, R: number, r: number) =>
  poly(Array.from({ length: n * 2 }, (_, i) => {
    const a = (i * Math.PI) / n - Math.PI / 2;
    const rad = i % 2 ? r : R;
    return [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
  }));

/** Rotated copies of one shape around (cx, cy). */
const around = (n: number, cx: number, cy: number, el: (k: number) => ReactNode, offset = 0) =>
  Array.from({ length: n }, (_, k) => <g key={k} transform={`rotate(${offset + (360 / n) * k} ${cx} ${cy})`}>{el(k)}</g>);

export const SEAL_ICON: Record<SealIcon, (fill: string) => ReactNode> = {
  heart: (f) => <path fill={f} d="M12 21.2C11.3 20.7 2 14.6 2 8.6 2 5.5 4.4 3 7.4 3c1.9 0 3.5 1 4.6 2.5C13.1 4 14.7 3 16.6 3 19.6 3 22 5.5 22 8.6c0 6-9.3 12.1-10 12.6Z" />,

  // engagement ring: a band with a cut stone on top
  ring: (f) => (
    <g fill={f}>
      <path fillRule="evenodd" d="M12 7.8a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm0 2.1a4.9 4.9 0 1 0 0 9.8 4.9 4.9 0 0 0 0-9.8Z" />
      <path d={poly([[9, 5], [10.4, 2.6], [13.6, 2.6], [15, 5], [12, 9]])} />
    </g>
  ),

  cake: (f) => (
    <g fill={f}>
      <rect x="3.5" y="14" width="17" height="7.5" rx="1.4" />
      <rect x="6" y="9" width="12" height="5.6" rx="1.2" />
      <rect x="11.2" y="5" width="1.6" height="4.2" rx=".5" />
      <path d="M12 1.4c1.3 1.5 1.5 2.5 1 3.1-.5.6-1.5.6-2 0-.5-.6-.3-1.6 1-3.1Z" />
    </g>
  ),

  // two flutes clinking
  cheers: (f) => {
    const flute = <path d="M-2.4 0h4.8l-.6 6.4a1.9 1.9 0 0 1-1.3 1.6v5.6H2.2v1.5h-4.4V13.6h1.7V8a1.9 1.9 0 0 1-1.3-1.6Z" />;
    return (
      <g fill={f}>
        <g transform="translate(8.6 4.5) rotate(-14)">{flute}</g>
        <g transform="translate(15.4 4.5) rotate(14)">{flute}</g>
        <path d={starPath(4, 12, 2.6, 2.2, .7)} />
      </g>
    );
  },

  balloon: (f) => (
    <g fill={f}>
      <ellipse cx="12" cy="9.2" rx="6.4" ry="7.4" />
      <path d="M10.9 16.3h2.2l-1.1 1.7Z" />
      <path d="M11.7 18c-1 1.7 1 2.6 0 4.6h.7c1-2-1-2.9 0-4.6Z" />
    </g>
  ),

  // box and lid split by the ribbon, with a bow
  gift: (f) => (
    <g fill={f}>
      <rect x="4" y="11.5" width="7.2" height="9.5" rx=".9" /><rect x="12.8" y="11.5" width="7.2" height="9.5" rx=".9" />
      <rect x="3" y="7.8" width="8.2" height="3" rx=".7" /><rect x="12.8" y="7.8" width="8.2" height="3" rx=".7" />
      <path d="M12 7.6C9.7 3.5 5.8 3.7 6 5.9c.2 1.7 3.4 1.8 6 1.7Zm0 0c2.3-4.1 6.2-3.9 6-1.7-.2 1.7-3.4 1.8-6 1.7Z" />
    </g>
  ),

  // graduation cap with tassel
  cap: (f) => (
    <g fill={f}>
      <path d={poly([[12, 3.2], [23, 8.6], [12, 14], [1, 8.6]])} />
      <path d="M5.6 11.2v4.3c0 1.9 2.9 3.4 6.4 3.4s6.4-1.5 6.4-3.4v-4.3L12 14.4Z" />
      <rect x="20.1" y="8.6" width="1.3" height="7" rx=".5" /><ellipse cx="20.75" cy="16.4" rx="1.3" ry="1.6" />
    </g>
  ),

  // beamed eighth notes
  note: (f) => (
    <g fill={f}>
      <ellipse cx="6.6" cy="18" rx="3.1" ry="2.4" transform="rotate(-18 6.6 18)" />
      <ellipse cx="16.6" cy="15.8" rx="3.1" ry="2.4" transform="rotate(-18 16.6 15.8)" />
      <rect x="8.4" y="5.4" width="1.6" height="12.4" /><rect x="18.4" y="3.2" width="1.6" height="12.4" />
      <path d={poly([[8.4, 5.4], [20, 2.8], [20, 5.6], [8.4, 8.2]])} />
    </g>
  ),

  star: (f) => <path fill={f} d={starPath(5, 12, 12.8, 10.4, 4.3)} />,

  sparkle: (f) => <path fill={f} d="M12 1.8c.9 6.3 3.9 9.3 10.2 10.2-6.3.9-9.3 3.9-10.2 10.2-.9-6.3-3.9-9.3-10.2-10.2C8.1 11.1 11.1 8.1 12 1.8Z" />,

  moon: (f) => <path fill={f} d="M13.2 2.4a7.4 7.4 0 0 0 8.4 9.6A9.8 9.8 0 1 1 13.2 2.4Z" />,

  sun: (f) => (
    <g fill={f}>
      <circle cx="12" cy="12" r="4.6" />
      {around(8, 12, 12, () => <rect x="11.1" y="1.4" width="1.8" height="4.4" rx=".9" />)}
    </g>
  ),

  // six petals around a separate heart
  flower: (f) => (
    <g fill={f}>
      {around(6, 12, 12, () => <ellipse cx="12" cy="5.6" rx="2.9" ry="3.9" />)}
      <circle cx="12" cy="12" r="2.4" />
    </g>
  ),

  // olive branch
  olive: (f) => (
    <g fill={f}>
      <path d="M5.2 21.3C7.5 15 11.6 8.6 18.8 3l.9 1C12.9 9.5 9 15.6 6.6 21.8Z" />
      {[[9.4, 15.2, -70], [7.2, 12.2, 25], [12.5, 10.5, -65], [10.6, 7.8, 30], [15.6, 6.4, -60], [14.6, 3.6, 35]].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx="1.5" ry="3.2" transform={`rotate(${r} ${x} ${y})`} />
      ))}
    </g>
  ),

  snowflake: (f) => (
    <g fill={f}>
      {around(6, 12, 12, () => (
        <g>
          <rect x="11.2" y="1.6" width="1.6" height="10.4" rx=".8" />
          <rect x="11.2" y="3.2" width="1.4" height="4.2" rx=".7" transform="rotate(42 12 5.6)" />
          <rect x="11.4" y="3.2" width="1.4" height="4.2" rx=".7" transform="rotate(-42 12 5.6)" />
        </g>
      ))}
    </g>
  ),

  tree: (f) => (
    <g fill={f}>
      <path d={poly([[12, 1.8], [16.8, 8.2], [14.7, 8.2], [18.9, 13.8], [16.3, 13.8], [20.6, 19.4], [3.4, 19.4], [7.7, 13.8], [5.1, 13.8], [9.3, 8.2], [7.2, 8.2]])} />
      <rect x="10.7" y="19.4" width="2.6" height="3" rx=".5" />
    </g>
  ),

  crown: (f) => (
    <g fill={f}>
      <path d={poly([[2.6, 7.6], [7.3, 11.4], [12, 4.8], [16.7, 11.4], [21.4, 7.6], [19.5, 17.4], [4.5, 17.4]])} />
      <rect x="4.5" y="18.5" width="15" height="2.4" rx=".8" />
      <circle cx="2.6" cy="6.4" r="1.4" /><circle cx="12" cy="3.4" r="1.4" /><circle cx="21.4" cy="6.4" r="1.4" />
    </g>
  ),
};
