"use client";

import { CheckCircle2, BadgeCheck, Wallet, ShieldCheck, Files } from "lucide-react";
import { StructuredTruth } from "@/lib/types";

export default function StructuredTruthPanel({ truth }: { truth: StructuredTruth }) {
  const fields = [
    { label: "Decision",    val: truth.decision,    icon: <BadgeCheck size={13} /> },
    { label: "Budget",      val: truth.budget,       icon: <Wallet size={13} /> },
    { label: "Approved By", val: truth.approvedBy,  icon: <ShieldCheck size={13} /> },
    { label: "Status",      val: truth.status,       icon: <CheckCircle2 size={13} /> },
  ];

  return (
    <div className="space-y-2.5 anim-fade-up">
      <p className="section-label mb-3">Structured Truth</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {fields.map(({ label, val, icon }) => (
          <div key={label} style={{ borderRadius: 9, padding: "11px 12px", background: "rgba(102,155,188,0.04)", border: "1px solid rgba(102,155,188,0.12)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, color: "var(--accent-light)" }}>
              {icon}
              <span style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>{label}</span>
            </div>
            <p style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--text-secondary)" }}>{val}</p>
          </div>
        ))}
      </div>

      {/* Evidence */}
      <div style={{ borderRadius: 9, padding: "11px 12px", background: "rgba(102,155,188,0.04)", border: "1px solid rgba(102,155,188,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color: "var(--accent-light)" }}>
          <Files size={13} />
          <span style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>Evidence</span>
        </div>
        {truth.evidence.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {truth.evidence.map((e) => (
              <span key={e} className="badge badge-accent">{e}</span>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 12, color: "var(--text-ghost)" }}>No evidence listed</p>
        )}
      </div>

      <div style={{ borderRadius: 9, padding: "10px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.055)" }}>
        <span style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>Conflicts: </span>
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{truth.conflicts}</span>
      </div>
    </div>
  );
}
