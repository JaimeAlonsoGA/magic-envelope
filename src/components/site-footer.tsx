import { Bot, Coffee } from "lucide-react";
import Link from "next/link";
import { KINDS } from "@/lib/model";
import { KIND_LABEL } from "@/lib/ui";

export const COFFEE_URL = "https://buymeacoffee.com/jaimehuman";

/** Site footer: occasions (deep links into the wizard), agent access, support and credit. */
export function SiteFooter() {
  const link = "text-muted transition-colors hover:text-ink";
  return (
    <footer className="mt-24 w-full border-t border-dashed border-ink/15 pt-10 font-hand">
      <div className="grid gap-8 sm:grid-cols-3">
        <nav aria-label="Occasions">
          <h2 className="mb-2 text-lg">Make an invitation</h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
            {KINDS.map((k) => <li key={k}><Link className={link} href={`/for/${k}`}>{KIND_LABEL[k]}</Link></li>)}
          </ul>
        </nav>
        <nav aria-label="For agents and developers">
          <h2 className="mb-2 flex items-center gap-1.5 text-lg"><Bot size={18} /> For agents</h2>
          <ul className="space-y-1">
            <li><Link className={link} href="/developers">API &amp; MCP docs</Link></li>
            <li><a className={link} href="/llms.txt">llms.txt</a></li>
            <li><a className={link} href="/api/v1/openapi.json">OpenAPI</a></li>
          </ul>
        </nav>
        <div>
          <h2 className="mb-2 text-lg">Free, forever</h2>
          <p className="mb-3 text-muted">No account, no ads. If it made someone smile:</p>
          <a href={COFFEE_URL} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#ffdd00] px-4 py-2 text-[#1e1e1e] shadow-sm transition-transform hover:-translate-y-0.5 active:translate-y-0">
            <Coffee size={18} /> Buy me a coffee
          </a>
        </div>
      </div>
      <p className="mt-10 pb-4 text-center text-sm text-muted">
        Magic Envelope · made by <a className="underline decoration-dotted underline-offset-4 hover:text-ink" href="https://jaimealonso.dev" target="_blank" rel="noopener">Jaime Alonso</a>
      </p>
    </footer>
  );
}
