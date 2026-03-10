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
      className="glass soft-shadow rounded-3xl border border-white/80 p-6"
    >
      <div className="mb-5 flex items-center gap-2">
        <CheckCircle2 size={18} className="text-slate-800" />
        <h2 className="text-lg font-semibold text-slate-900">
          Structured Truth
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <BadgeCheck size={16} />
            Decision
          </div>
          <p className="text-sm leading-6 text-slate-800">{truth.decision}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Wallet size={16} />
            Budget
          </div>
          <p className="text-sm leading-6 text-slate-800">{truth.budget}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <ShieldCheck size={16} />
            Approved By
          </div>
          <p className="text-sm leading-6 text-slate-800">{truth.approvedBy}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <CheckCircle2 size={16} />
            Status
          </div>
          <p className="text-sm leading-6 text-slate-800">{truth.status}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Files size={16} />
          Evidence
        </div>
        <div className="flex flex-wrap gap-2">
          {truth.evidence.length > 0 ? (
            truth.evidence.map((item) => (
              <span
                key={item}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                {item}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-500">No evidence listed</span>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Conflicts: {truth.conflicts}
      </div>
    </motion.section>
  );
}