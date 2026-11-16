import Link from "next/link";

/** The 404: an unknown URL, or a letter its sender deleted. The way out is to make one. */
export function EmptyEnvelope() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-6 px-6 text-center font-hand">
      <p className="text-6xl" aria-hidden>✉</p>
      <h1 className="text-4xl font-bold">This envelope is empty</h1>
      <p className="text-lg text-muted">The link may be mistyped, or whoever sent the letter deleted it.</p>
      <Link href="/" className="rounded-full bg-wax px-6 py-3 text-xl text-on-wax shadow-sm transition-transform hover:-translate-y-0.5">Magic Envelope</Link>
    </main>
  );
}
