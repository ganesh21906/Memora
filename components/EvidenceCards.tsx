"use client";

import { SourceItem } from "@/lib/types";
import { FileSpreadsheet, FileType2, FileText, Mail, MessageCircle, Search } from "lucide-react";

type EvidenceCardsProps = { sources: SourceItem[] };

type SourceMeta = {
  label: string;
  badgeClass: string;
  barColor: string;
  borderColor: string;
  headerBg: string;
  icon: React.ReactNode;
};

const SOURCE_META: Record<string, SourceMeta> = {
  email:    { label: "EMAIL",    badgeClass: "badge badge-red",    barColor: "#EF4444", borderColor: "rgba(239,68,68,0.22)",    headerBg: "rgba(239,68,68,0.05)",    icon: <Mail size={11} /> },
  csv:      { label: "CSV",      badgeClass: "badge badge-green",  barColor: "#22C55E", borderColor: "rgba(34,197,94,0.22)",    headerBg: "rgba(34,197,94,0.05)",    icon: <FileSpreadsheet size={11} /> },
  pdf:      { label: "PDF",      badgeClass: "badge badge-orange", barColor: "#F97316", borderColor: "rgba(249,115,22,0.22)",   headerBg: "rgba(249,115,22,0.05)",   icon: <FileType2 size={11} /> },
  text:     { label: "TEXT",     badgeClass: "badge badge-violet", barColor: "#8B5CF6", borderColor: "rgba(139,92,246,0.22)",   headerBg: "rgba(139,92,246,0.05)",   icon: <FileText size={11} /> },
  whatsapp: { label: "WHATSAPP", badgeClass: "badge badge-teal",   barColor: "#14B8A6", borderColor: "rgba(20,184,166,0.22)",   headerBg: "rgba(20,184,166,0.05)",   icon: <MessageCircle size={11} /> },
};

const FALLBACK: SourceMeta = {
  label: "DOC", badgeClass: "badge badge-ghost", barColor: "var(--accent)",
  borderColor: "rgba(255,255,255,0.1)", headerBg: "rgba(255,255,255,0.03)",
  icon: <Search size={11} />,
};

const SCORES = [88, 82, 76, 91, 74, 85, 79, 93];

export default function EvidenceCards({ sources }: EvidenceCardsProps) {
  if (sources.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "32px 16px", textAlign: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Search size={16} style={{ color: "var(--text-ghost)" }} />
        </div>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>No evidence sources yet</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p className="section-label" style={{ marginBottom: 4 }}>Evidence Cards · {sources.length} source{sources.length !== 1 ? "s" : ""}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sources.map((source, i) => {
          const meta = SOURCE_META[source.type] ?? FALLBACK;
          const score = SCORES[i % SCORES.length];
          const preview = source.snippet
            ? source.snippet.slice(0, 110) + (source.snippet.length > 110 ? "…" : "")
            : source.title;

          return (
            <article
              key={source.id}
              className="evidence-card"
              style={{ borderColor: meta.borderColor, animationDelay: `${i * 70}ms` }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "8px 12px", background: meta.headerBg, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, overflow: "hidden" }}>
                  <span style={{ color: meta.barColor, flexShrink: 0 }}>{meta.icon}</span>
                  <span className="truncate" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)" }}>
                    {source.title}
                  </span>
                </div>
                <span className={meta.badgeClass}>{meta.label}</span>
              </div>

              {/* Body */}
              <div style={{ padding: "8px 12px" }}>
                <p style={{ fontSize: 12, lineHeight: 1.65, color: "var(--text-secondary)" }}>{preview}</p>
                {source.meta && (
                  <p style={{ marginTop: 5, fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{source.meta}</p>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: "0 12px 10px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>1 match found</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: meta.barColor }}>{score}% relevance</span>
                </div>
                <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                  <div
                    className="evidence-bar"
                    style={{ height: "100%", width: `${score}%`, background: meta.barColor, borderRadius: 99, animationDelay: `${i * 70 + 200}ms` }}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
