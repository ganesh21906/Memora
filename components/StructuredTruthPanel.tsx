"use client";

import { CheckCircle2, BadgeCheck, Wallet, ShieldCheck, Files } from "lucide-react";
import { StructuredTruth } from "@/lib/types";

export default function StructuredTruthPanel({ truth }: { truth: StructuredTruth }) {
  const fields = [
    { label: "Decision", val: truth.decision, icon: <BadgeCheck size={13} /> },
    { label: "Budget", val: truth.budget, icon: <Wallet size={13} /> },
    { label: "Approved By", val: truth.approvedBy, icon: <ShieldCheck size={13} /> },
    { label: "Status", val: truth.status, icon: <CheckCircle2 size={13} /> },
  ];

  return (
    <div className="anim-float-up" style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      <p className="sec-label" style={{ marginBottom: 3 }}>Structured Truth</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {fields.map(({ label, val, icon }) => (
          <div key={label} style={{ borderRadius: 10, padding: "11px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, color: "#A5B4FC" }}>
              {icon}
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--txt-4)" }}>{label}</span>
            </div>
            <p style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--txt-2)" }}>{val}</p>
          </div>
        ))}
      </div>
      <div style={{ borderRadius: 10, padding: "11px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color: "#A5B4FC" }}>
          <Files size={13} />
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--txt-4)" }}>Evidence</span>
        </div>
        {truth.evidence.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {truth.evidence.map(e => <span key={e} className="pill pill-accent">{e}</span>)}
          </div>
        ) : (
          <p style={{ fontSize: 12, color: "var(--txt-4)" }}>No evidence listed</p>
        )}
      </div>
      <div style={{ borderRadius: 10, padding: "9px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--txt-3)" }}>Conflicts: </span>
        <span style={{ fontSize: 12, color: "var(--txt-2)" }}>{truth.conflicts}</span>
      </div>
    </div>
  );
}
