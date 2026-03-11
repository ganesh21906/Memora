"use client";

import { CheckCircle2, BadgeCheck, Wallet, ShieldCheck, Files, Info } from "lucide-react";
import { StructuredTruth } from "@/lib/types";

function isNA(v: string) {
  const s = v.trim().toLowerCase();
  return s === "n/a" || s === "na" || s === "none" || s === "";
}

export default function StructuredTruthPanel({ truth }: { truth: StructuredTruth }) {
  const fields = [
    { label: "Key Finding",   val: truth.decision,   icon: <BadgeCheck size={13} /> },
    { label: "Amount / Cost", val: truth.budget,     icon: <Wallet size={13} /> },
    { label: "Source / Person", val: truth.approvedBy, icon: <ShieldCheck size={13} /> },
    { label: "Status",        val: truth.status,     icon: <CheckCircle2 size={13} /> },
  ].filter(f => !isNA(f.val));

  const evidence = (truth.evidence ?? []).filter(e => e.trim().length > 0);
  const hasConflict = truth.conflicts && !isNA(truth.conflicts) && truth.conflicts.toLowerCase() !== "none";

  return (
    <div className="anim-float-up" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p className="sec-label" style={{ marginBottom: 2 }}>Extracted Facts</p>

      {/* Key fields — only non-N/A */}
      {fields.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: fields.length === 1 ? "1fr" : "1fr 1fr", gap: 8 }}>
          {fields.map(({ label, val, icon }) => (
            <div key={label} style={{ borderRadius: 10, padding: "11px 13px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, color: "#A5B4FC" }}>
                {icon}
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--txt-4)" }}>{label}</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--txt-1)", fontWeight: 500 }}>{val}</p>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontSize: 12, color: "var(--txt-4)" }}>No structured fields extracted for this query.</p>
        </div>
      )}

      {/* Evidence list as sentences */}
      {evidence.length > 0 && (
        <div style={{ borderRadius: 10, padding: "12px 13px", background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 9, color: "#A5B4FC" }}>
            <Files size={13} />
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--txt-4)" }}>
              Supporting Evidence ({evidence.length})
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {evidence.map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: "#6366F1", marginTop: 2 }}>{i + 1}</span>
                <p style={{ fontSize: 12.5, lineHeight: 1.6, color: "var(--txt-2)", margin: 0 }}>{e}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conflicts note */}
      {hasConflict && (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", borderRadius: 10, padding: "10px 13px", background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.2)" }}>
          <Info size={13} style={{ color: "#FCD34D", flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(252,211,77,0.6)", marginBottom: 4 }}>Note</p>
            <p style={{ fontSize: 12.5, color: "rgba(252,211,77,0.8)", lineHeight: 1.55 }}>{truth.conflicts}</p>
          </div>
        </div>
      )}
    </div>
  );
}
