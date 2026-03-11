"use client";

import { ShieldAlert, ShieldCheck, ArrowRight } from "lucide-react";
import { ConflictItem } from "@/lib/types";

const SEV: Record<string, { wrap: React.CSSProperties; pill: string }> = {
  high:   { wrap: { border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.05)" },   pill: "pill pill-red" },
  medium: { wrap: { border: "1px solid rgba(245,158,11,0.25)", background: "rgba(245,158,11,0.05)" }, pill: "pill pill-orange" },
  low:    { wrap: { border: "1px solid rgba(99,102,241,0.25)", background: "rgba(99,102,241,0.05)" }, pill: "pill pill-accent" },
  none:   { wrap: { border: "1px solid rgba(16,185,129,0.22)", background: "rgba(16,185,129,0.04)" }, pill: "pill pill-green" },
};

export default function ConflictPanel({ conflicts }: { conflicts: ConflictItem[] }) {
  if (conflicts.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "28px 12px", textAlign: "center" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ShieldCheck size={18} style={{ color: "#10B981" }} />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#6EE7B7", fontFamily: "var(--font-display)" }}>No conflicts detected</p>
          <p style={{ fontSize: 11.5, color: "var(--txt-3)", marginTop: 3 }}>All sources are consistent</p>
        </div>
      </div>
    );
  }

  const hasReal = conflicts.some(c => c.severity === "high" || c.severity === "medium");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
        {hasReal
          ? <ShieldAlert size={13} style={{ color: "#FCA5A5", flexShrink: 0 }} />
          : <ShieldCheck size={13} style={{ color: "#6EE7B7", flexShrink: 0 }} />
        }
        <span className="sec-label">{conflicts.length} conflict{conflicts.length !== 1 ? "s" : ""}</span>
      </div>

      {conflicts.map((item, i) => {
        const s = SEV[item.severity] ?? SEV.none;
        return (
          <div key={`${item.title}-${i}`} style={{ ...s.wrap, borderRadius: 12, padding: 13 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--txt-1)", marginBottom: 3, fontFamily: "var(--font-display)" }}>{item.title}</p>
                <p style={{ fontSize: 12, color: "var(--txt-3)" }}>{item.note}</p>
              </div>
              <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                <span className={s.pill}>{item.severity}</span>
                <span className="pill pill-ghost">{item.type}</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 7 }}>
              {item.comparison.map(e => (
                <div key={`${e.source}`} style={{ borderRadius: 8, padding: "9px 10px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--txt-4)", marginBottom: 4 }}>{e.source}</p>
                  <p style={{ fontSize: 12, lineHeight: 1.6, color: "var(--txt-2)" }}>{e.value}</p>
                </div>
              ))}
            </div>
            <div style={{ borderRadius: 8, padding: "9px 10px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 7 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--txt-4)", marginBottom: 4 }}>Likely Latest Truth</p>
              <p style={{ fontSize: 12, color: "var(--txt-2)", lineHeight: 1.6 }}>{item.likelyLatestTruth}</p>
            </div>
            <div style={{ borderRadius: 8, padding: "9px 10px", background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.20)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <ArrowRight size={11} style={{ color: "#A5B4FC", flexShrink: 0 }} />
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#A5B4FC" }}>Recommended Action</p>
              </div>
              <p style={{ fontSize: 12, color: "var(--txt-2)", lineHeight: 1.6 }}>{item.recommendedAction}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
