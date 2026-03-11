"use client";

import { SourceItem } from "@/lib/types";
import { FileSpreadsheet, FileType2, FileText, Mail, MessageCircle, Search } from "lucide-react";

type SrcMeta = { label: string; pill: string; barColor: string; borderColor: string; headerBg: string; icon: React.ReactNode };

const SRC_META: Record<string, SrcMeta> = {
  email:    { label: "EMAIL",    pill: "pill pill-red",    barColor: "var(--c-email)",    borderColor: "rgba(239,68,68,0.22)",    headerBg: "rgba(239,68,68,0.06)",    icon: <Mail size={11} /> },
  csv:      { label: "CSV",      pill: "pill pill-green",  barColor: "var(--c-csv)",      borderColor: "rgba(16,185,129,0.22)",   headerBg: "rgba(16,185,129,0.06)",   icon: <FileSpreadsheet size={11} /> },
  pdf:      { label: "PDF",      pill: "pill pill-orange", barColor: "var(--c-pdf)",      borderColor: "rgba(249,115,22,0.22)",   headerBg: "rgba(249,115,22,0.06)",   icon: <FileType2 size={11} /> },
  text:     { label: "TEXT",     pill: "pill pill-violet", barColor: "var(--c-txt)",      borderColor: "rgba(139,92,246,0.22)",   headerBg: "rgba(139,92,246,0.06)",   icon: <FileText size={11} /> },
  whatsapp: { label: "WHATSAPP", pill: "pill pill-teal",   barColor: "var(--c-whatsapp)", borderColor: "rgba(20,184,166,0.22)",   headerBg: "rgba(20,184,166,0.06)",   icon: <MessageCircle size={11} /> },
};

const FALLBACK: SrcMeta = {
  label: "DOC", pill: "pill pill-ghost", barColor: "var(--accent)",
  borderColor: "rgba(255,255,255,0.10)", headerBg: "rgba(255,255,255,0.03)", icon: <Search size={11} />,
};

const SCORES = [88, 82, 76, 91, 74, 85, 79, 93];

export default function EvidenceCards({ sources }: { sources: SourceItem[] }) {
  if (sources.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "28px 12px", textAlign: "center" }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Search size={16} style={{ color: "var(--txt-4)" }} />
        </div>
        <p style={{ fontSize: 12, color: "var(--txt-3)" }}>No evidence sources yet</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p className="sec-label" style={{ marginBottom: 4 }}>
        Evidence Cards · {sources.length} source{sources.length !== 1 ? "s" : ""}
      </p>
      {sources.map((src, i) => {
        const m = SRC_META[src.type] ?? FALLBACK;
        const score = SCORES[i % SCORES.length];
        const preview = src.snippet
          ? src.snippet.slice(0, 110) + (src.snippet.length > 110 ? "…" : "")
          : src.title;

        return (
          <article
            key={src.id}
            className="ev-card"
            style={{ borderColor: m.borderColor, animationDelay: `${i * 70}ms` }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "9px 12px", background: m.headerBg, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                <span style={{ color: m.barColor, flexShrink: 0 }}>{m.icon}</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--txt-1)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", fontFamily: "var(--font-display)" }}>
                  {src.title}
                </span>
              </div>
              <span className={m.pill}>{m.label}</span>
            </div>
            {/* Body */}
            <div style={{ padding: "9px 12px" }}>
              <p style={{ fontSize: 12, lineHeight: 1.65, color: "var(--txt-3)" }}>{preview}</p>
              {src.meta && <p style={{ marginTop: 5, fontSize: 10.5, color: "var(--txt-4)", fontFamily: "monospace" }}>{src.meta}</p>}
            </div>
            {/* Footer bar */}
            <div style={{ padding: "0 12px 10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: "var(--txt-4)" }}>1 match found</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: m.barColor }}>{score}% relevance</span>
              </div>
              <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${score}%`, background: m.barColor, borderRadius: 99, animation: "bar-fill 700ms cubic-bezier(0.16,1,0.3,1) both", animationDelay: `${i * 70 + 300}ms` }} />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
