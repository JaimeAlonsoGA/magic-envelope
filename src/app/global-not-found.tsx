import type { Metadata } from "next";
import { EmptyEnvelope } from "@/components/empty-envelope";
import { Document } from "./shell";

export const metadata: Metadata = { title: "Not found · Magic Envelope", robots: { index: false } };

/** URLs that match no route (two root layouts, so no single not-found can cover them). */
export default function GlobalNotFound() {
  return <Document lang="en"><EmptyEnvelope /></Document>;
}
