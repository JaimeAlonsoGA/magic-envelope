"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { SketchLink } from "@/components/sketch";
import { importDraft } from "@/lib/drafts";

/** /e/<id>#<editKey> → pulls the card into this device's drafts and opens the editor. */
export default function ImportPage({ params }: PageProps<"/e/[id]">) {
  const { id } = use(params);
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const key = location.hash.slice(1);
    const ac = new AbortController();
    fetch(`/api/card/${id}`, { headers: { "x-edit-key": key }, signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(({ card, guests }) => router.replace(`/edit/${importDraft(id, key, card, guests)}`))
      .catch(() => !ac.signal.aborted && setFailed(true));
    return () => ac.abort();
  }, [id, router]);

  return (
    <div className="grid min-h-dvh place-items-center">
      {failed ? <SketchLink href="/" size="lg">✉ ✕</SketchLink> : <div className="text-6xl text-muted">✉</div>}
    </div>
  );
}
