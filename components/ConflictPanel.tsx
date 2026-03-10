"use client";

import { ShieldAlert, ShieldCheck, ArrowRightCircle } from "lucide-react";
import { ConflictItem } from "@/lib/types";

function getSeverityStyle(severity: ConflictItem["severity"]) {
  switch (severity) {
    case "high":
      return {
        wrapper: "border-red-200 bg-red-50",
        badge: "bg-red-100 text-red-800 border-red-200",
        text: "text-red-800",
      };
    case "medium":
      return {
        wrapper: "border-amber-200 bg-amber-50",
        badge: "bg-amber-100 text-amber-800 border-amber-200",
        text: "text-amber-800",
      };
    case "low":
      return {
        wrapper: "border-blue-200 bg-blue-50",
        badge: "bg-blue-100 text-blue-800 border-blue-200",
        text: "text-blue-800",
      };
    default:
      return {
        wrapper: "border-emerald-200 bg-emerald-50",
        badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
        text: "text-emerald-800",
      };
  }
}

export default function ConflictPanel({
  conflicts,
}: {
  conflicts: ConflictItem[];
}) {
  const hasRealConflict = conflicts.some(
    (item) => item.severity === "high" || item.severity === "medium"
  );

  return (
    <section className="glass soft-shadow rounded-3xl border border-white/80 p-6">
      <div className="mb-5 flex items-center gap-2">
        {hasRealConflict ? (
          <ShieldAlert size={18} className="text-slate-800" />
        ) : (
          <ShieldCheck size={18} className="text-slate-800" />
        )}
        <h2 className="text-lg font-semibold text-slate-900">
          Conflict Addressing Panel
        </h2>
      </div>

      {conflicts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 py-8 text-center">
          <ShieldCheck size={28} className="mb-3 text-emerald-500" />
          <p className="text-sm font-semibold text-emerald-700">No conflicts detected</p>
          <p className="mt-1 text-xs text-emerald-600">All your sources are consistent for this query.</p>
        </div>
      ) : (
        <div className="space-y-5">
        {conflicts.map((item, index) => {
          const styles = getSeverityStyle(item.severity);

          return (
            <div
              key={`${item.title}-${index}`}
              className={`rounded-3xl border p-5 ${styles.wrapper}`}
            >
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className={`text-base font-semibold ${styles.text}`}>
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-700">{item.note}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${styles.badge}`}
                  >
                    Severity: {item.severity}
                  </span>

                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                    {item.type}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {item.comparison.map((entry) => (
                  <div
                    key={`${entry.source}-${entry.value}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {entry.source}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-800">
                      {entry.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Likely Latest Truth
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-800">
                  {item.likelyLatestTruth}
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-900 p-4 text-white">
                <div className="mb-2 flex items-center gap-2">
                  <ArrowRightCircle size={16} />
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                    Recommended Next Action
                  </p>
                </div>
                <p className="text-sm leading-6 text-slate-100">
                  {item.recommendedAction}
                </p>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </section>
  );
}