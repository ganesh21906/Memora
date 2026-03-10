import Link from "next/link";
import { Sparkles, Database } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/15">
            <Sparkles size={18} />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-950">
              Memora AI
            </h1>
            <p className="text-sm text-slate-500">
              Search across notes, emails, PDFs, and CSVs
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Assistant
          </Link>
          <Link
            href="/demo-data"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Database size={16} />
            Demo Data
          </Link>
        </nav>
      </div>
    </header>
  );
}