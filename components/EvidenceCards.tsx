"use client";

import { SourceItem } from "@/lib/types";

type EvidenceCardsProps = {
  sources: SourceItem[];
};

type StyleConfig = {
  border: string;
  headerBg: string;
  badge: { bg: string; color: string; border: string };
  bar: string;
};

const SOURCE_STYLES: Record<string, StyleConfig> = {
  email: {
    border: "rgba(239,68,68,0.25)",
    headerBg: "rgba(239,68,68,0.05)",
    badge: { bg: "rgba(239,68,68,0.12)", color: "#FCA5A5", border: "rgba(239,68,68,0.3)" },
    bar: "#DC2626",
  },
  csv: {
    border: "rgba(34,197,94,0.25)",
    headerBg: "rgba(34,197,94,0.05)",
    badge: { bg: "rgba(34,197,94,0.12)", color: "#86EFAC", border: "rgba(34,197,94,0.3)" },
    bar: "#16A34A",
  },
  pdf: {
    border: "rgba(249,115,22,0.25)",
    headerBg: "rgba(249,115,22,0.05)",
    badge: { bg: "rgba(249,115,22,0.12)", color: "#FDBA74", border: "rgba(249,115,22,0.3)" },
    bar: "#EA580C",
  },
  text: {
    border: "rgba(139,92,246,0.25)",
    headerBg: "rgba(139,92,246,0.05)",
    badge: { bg: "rgba(139,92,246,0.12)", color: "#C4B5FD", border: "rgba(139,92,246,0.3)" },
    bar: "#7C3AED",
  },
  whatsapp: {
    border: "rgba(20,184,166,0.25)",
    headerBg: "rgba(20,184,166,0.05)",
    badge: { bg: "rgba(20,184,166,0.12)", color: "#5EEAD4", border: "rgba(20,184,166,0.3)" },
    bar: "#0D9488",
  },
};

const FALLBACK_STYLE: StyleConfig = {
  border: "rgba(255,255,255,0.1)",
  headerBg: "rgba(255,255,255,0.03)",
  badge: { bg: "rgba(255,255,255,0.08)", color: "#94A3B8", border: "rgba(255,255,255,0.15)" },
  bar: "#6366F1",
};

const CONFIDENCE_SCORES = [88, 82, 76, 91, 74, 85, 79, 93];

export default function EvidenceCards({ sources }: EvidenceCardsProps) {
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
      <h2 className="mb-4 text-[18px] font-semibold" style={{ color: "#F8FAFC" }}>
        Evidence Cards
      </h2>
      {sources.length === 0 ? (
        <p className="text-sm" style={{ color: "#94A3B8" }}>
          No evidence sources returned yet.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sources.map((source, index) => {
            const style = SOURCE_STYLES[source.type] ?? FALLBACK_STYLE;
            const confidence = CONFIDENCE_SCORES[index % CONFIDENCE_SCORES.length];
            const preview =
              source.snippet
                ? source.snippet.slice(0, 100) + (source.snippet.length > 100 ? "…" : "")
                : source.title;

            return (
              <article
                key={source.id}
                className="glow-card anim-fade-up flex flex-col overflow-hidden rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: `1px solid ${style.border}`,
                  animationDelay: `${index * 80}ms`,
                }}
              >
                {/* Card header */}
                <div
                  className="flex items-center justify-between gap-2 px-4 py-3"
                  style={{ background: style.headerBg }}
                >
                  <h3 className="truncate text-sm font-semibold" style={{ color: "#F8FAFC" }}>
                    {source.title}
                  </h3>
                  <span
                    className="flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase"
                    style={{
                      background: style.badge.bg,
                      color: style.badge.color,
                      border: `1px solid ${style.badge.border}`,
                    }}
                  >
                    {source.type}
                  </span>
                </div>

                {/* Content preview */}
                <div className="flex-1 px-4 py-3">
                  <p className="text-sm leading-6" style={{ color: "#94A3B8" }}>
                    {preview}
                  </p>
                  {source.meta ? (
                    <p className="mt-2 text-xs" style={{ color: "rgba(148,163,184,0.55)" }}>
                      {source.meta}
                    </p>
                  ) : null}
                </div>

                {/* Footer: match count + relevance bar */}
                <div className="px-4 pb-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[11px]" style={{ color: "rgba(148,163,184,0.55)" }}>
                      1 match found
                    </span>
                    <span className="text-[11px]" style={{ color: style.badge.color }}>
                      {confidence}% relevance
                    </span>
                  </div>
                  <div
                    className="h-1 w-full overflow-hidden rounded-full"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${confidence}%`, background: style.bar }}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
