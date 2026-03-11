"use client";

import { motion } from "framer-motion";
import { CheckCircle2, BadgeCheck, Wallet, ShieldCheck, Files } from "lucide-react";
import { StructuredTruth } from "@/lib/types";

export default function StructuredTruthPanel({
  truth,
}: {
  truth: StructuredTruth;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div className="mb-5 flex items-center gap-2">
        <CheckCircle2 size={18} style={{ color: "#86EFAC" }} />
        <h2 className="text-[18px] font-semibold" style={{ color: "#F8FAFC" }}>
          Structured Truth
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div
          className="rounded-xl p-4"
          style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
        >
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold" style={{ color: "#94A3B8" }}>
            <BadgeCheck size={16} style={{ color: "#818CF8" }} />
            Decision
          </div>
          <p className="text-sm leading-6" style={{ color: "#CBD5E1" }}>{truth.decision}</p>
        </div>

        <div
          className="rounded-xl p-4"
          style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
        >
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold" style={{ color: "#94A3B8" }}>
            <Wallet size={16} style={{ color: "#818CF8" }} />
            Budget
          </div>
          <p className="text-sm leading-6" style={{ color: "#CBD5E1" }}>{truth.budget}</p>
        </div>

        <div
          className="rounded-xl p-4"
          style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
        >
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold" style={{ color: "#94A3B8" }}>
            <ShieldCheck size={16} style={{ color: "#818CF8" }} />
            Approved By
          </div>
          <p className="text-sm leading-6" style={{ color: "#CBD5E1" }}>{truth.approvedBy}</p>
        </div>

        <div
          className="rounded-xl p-4"
          style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
        >
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold" style={{ color: "#94A3B8" }}>
            <CheckCircle2 size={16} style={{ color: "#818CF8" }} />
            Status
          </div>
          <p className="text-sm leading-6" style={{ color: "#CBD5E1" }}>{truth.status}</p>
        </div>
      </div>

      <div
        className="mt-4 rounded-xl p-4"
        style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
      >
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold" style={{ color: "#94A3B8" }}>
          <Files size={16} style={{ color: "#818CF8" }} />
          Evidence
        </div>
        <div className="flex flex-wrap gap-2">
          {truth.evidence.length > 0 ? (
            truth.evidence.map((item) => (
              <span
                key={item}
                className="rounded-full px-3 py-1.5 text-xs font-medium"
                style={{ border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.08)", color: "#A5B4FC" }}
              >
                {item}
              </span>
            ))
          ) : (
            <span className="text-sm" style={{ color: "#64748B" }}>No evidence listed</span>
          )}
        </div>
      </div>

      <div
        className="mt-4 rounded-xl px-4 py-3 text-sm"
        style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#94A3B8" }}
      >
        Conflicts: {truth.conflicts}
      </div>
    </motion.section>
  );
}