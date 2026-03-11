"use client";

import { ShieldAlert, ShieldCheck, ArrowRightCircle } from "lucide-react";
import { ConflictItem } from "@/lib/types";

function getSeverityStyle(severity: ConflictItem["severity"]) {
  switch (severity) {
    case "high":
      return {
        wrapper: "",
        wrapperStyle: { border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" },
        badge: "",
        badgeStyle: { background: "rgba(239,68,68,0.15)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.3)" },
        text: "",
        textStyle: { color: "#FCA5A5" },
      };
    case "medium":
      return {
        wrapper: "",
        wrapperStyle: { border: "1px solid rgba(251,191,36,0.3)", background: "rgba(251,191,36,0.05)" },
        badge: "",
        badgeStyle: { background: "rgba(251,191,36,0.15)", color: "#FDE68A", border: "1px solid rgba(251,191,36,0.3)" },
        text: "",
        textStyle: { color: "#FDE68A" },
      };
    case "low":
      return {
        wrapper: "",
        wrapperStyle: { border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.05)" },
        badge: "",
        badgeStyle: { background: "rgba(99,102,241,0.15)", color: "#A5B4FC", border: "1px solid rgba(99,102,241,0.3)" },
        text: "",
        textStyle: { color: "#A5B4FC" },
      };
    default:
      return {
        wrapper: "",
        wrapperStyle: { border: "1px solid rgba(34,197,94,0.25)", background: "rgba(34,197,94,0.04)" },
        badge: "",
        badgeStyle: { background: "rgba(34,197,94,0.12)", color: "#86EFAC", border: "1px solid rgba(34,197,94,0.3)" },
        text: "",
        textStyle: { color: "#86EFAC" },
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
    <section
      className="rounded-2xl p-5"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div className="mb-5 flex items-center gap-2">
        {hasRealConflict ? (
          <ShieldAlert size={18} style={{ color: "#F87171" }} />
        ) : (
          <ShieldCheck size={18} style={{ color: "#86EFAC" }} />
        )}
        <h2 className="text-[20px] font-semibold" style={{ color: "#F8FAFC" }}>
          Conflict Addressing Panel
        </h2>
      </div>

      {conflicts.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl py-8 text-center"
          style={{ border: "1px solid rgba(34,197,94,0.25)", background: "rgba(34,197,94,0.05)" }}
        >
          <ShieldCheck size={28} className="mb-3" style={{ color: "#86EFAC" }} />
          <p className="text-sm font-semibold" style={{ color: "#86EFAC" }}>No conflicts detected</p>
          <p className="mt-1 text-xs" style={{ color: "rgba(134,239,172,0.7)" }}>All your sources are consistent for this query.</p>
        </div>
      ) : (
        <div className="space-y-5">
        {conflicts.map((item, index) => {
          const styles = getSeverityStyle(item.severity);

          return (
            <div
              key={`${item.title}-${index}`}
              className="rounded-xl p-5"
              style={styles.wrapperStyle}
            >
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-base font-semibold" style={styles.textStyle}>
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm" style={{ color: "#94A3B8" }}>{item.note}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                    style={styles.badgeStyle}
                  >
                    Severity: {item.severity}
                  </span>

                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                    style={{ border: "1px solid rgba(255,255,255,0.12)", color: "#94A3B8", background: "rgba(255,255,255,0.05)" }}
                  >
                    {item.type}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {item.comparison.map((entry) => (
                  <div
                    key={`${entry.source}-${entry.value}`}
                    className="rounded-xl p-4"
                    style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748B" }}>
                      {entry.source}
                    </p>
                    <p className="mt-2 text-sm leading-6" style={{ color: "#CBD5E1" }}>
                      {entry.value}
                    </p>
                  </div>
                ))}
              </div>

              <div
                className="mt-4 rounded-xl p-4"
                style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
              >
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748B" }}>
                  Likely Latest Truth
                </p>
                <p className="mt-2 text-sm leading-6" style={{ color: "#CBD5E1" }}>
                  {item.likelyLatestTruth}
                </p>
              </div>

              <div
                className="mt-4 rounded-xl p-4"
                style={{ border: "1px solid rgba(99,102,241,0.25)", background: "rgba(99,102,241,0.06)" }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <ArrowRightCircle size={16} style={{ color: "#818CF8" }} />
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#818CF8" }}>
                    Recommended Next Action
                  </p>
                </div>
                <p className="text-sm leading-6" style={{ color: "#CBD5E1" }}>
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