"use client";

import { ShieldAlert, ShieldCheck, ArrowRight } from "lucide-react";
import { ConflictItem } from "@/lib/types";

const SEV_STYLES = {
  high:   { wrap: { border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.04)" }, badge: "badge badge-red",    dot: "#EF4444" },
  medium: { wrap: { border: "1px solid rgba(245,158,11,0.25)", background: "rgba(245,158,11,0.04)" }, badge: "badge badge-amber", dot: "#F59E0B" },
  low:    { wrap: { border: "1px solid rgba(193,18,31,0.25)", background: "rgba(193,18,31,0.04)" }, badge: "badge badge-accent", dot: "var(--accent)" },
  none:   { wrap: { border: "1px solid rgba(34,197,94,0.22)", background: "rgba(34,197,94,0.04)" }, badge: "badge badge-green",  dot: "var(--green)" },
};

export default function ConflictPanel({ conflicts }: { conflicts: ConflictItem[] }) {
  const hasReal = conflicts.some(c => c.severity === "high" || c.severity === "medium");

  if (conflicts.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "32px 16px", textAlign: "center" }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ShieldCheck size={18} style={{ color: "var(--green)" }} />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#4ADE80" }}>No conflicts detected</p>
          <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 3 }}>All sources are consistent</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
        {hasReal
          ? <ShieldAlert size={14} style={{ color: "#FCA5A5", flexShrink: 0 }} />
          : <ShieldCheck size={14} style={{ color: "#4ADE80", flexShrink: 0 }} />
        }
        <span className="section-label">{conflicts.length} conflict{conflicts.length !== 1 ? "s" : ""} found</span>
      </div>

      {conflicts.map((item, i) => {
        const sev = SEV_STYLES[item.severity] ?? SEV_STYLES.none;
        return (
          <div key={`${item.title}-${i}`} className="conflict-card" style={sev.wrap}>
            {/* Title row */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 3 }}>{item.title}</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.note}</p>
              </div>
              <div style={{ display: "flex", gap: 5, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <span className={sev.badge}>{item.severity}</span>
                <span className="badge badge-ghost">{item.type}</span>
              </div>
            </div>

            {/* Comparison */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              {item.comparison.map((entry) => (
                <div key={`${entry.source}-${entry.value}`}
                  style={{ borderRadius: 7, padding: "10px 11px", background: "rgba(102,155,188,0.04)", border: "1px solid rgba(102,155,188,0.12)" }}>
                  <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 5 }}>{entry.source}</p>
                  <p style={{ fontSize: 12, lineHeight: 1.6, color: "var(--text-secondary)" }}>{entry.value}</p>
                </div>
              ))}
            </div>

            {/* Truth */}
            <div style={{ borderRadius: 7, padding: "9px 11px", background: "rgba(102,155,188,0.04)", border: "1px solid rgba(102,155,188,0.12)", marginBottom: 8 }}>
              <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 5 }}>Likely Latest Truth</p>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{item.likelyLatestTruth}</p>
            </div>

            {/* Action */}
            <div style={{ borderRadius: 7, padding: "9px 11px", background: "rgba(193,18,31,0.06)", border: "1px solid rgba(193,18,31,0.18)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <ArrowRight size={12} style={{ color: "var(--accent-light)", flexShrink: 0 }} />
                <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--accent-light)" }}>Recommended Action</p>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{item.recommendedAction}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
