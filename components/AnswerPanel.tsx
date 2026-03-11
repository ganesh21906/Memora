"use client";

import ReactMarkdown from "react-markdown";
import { QueryResponse } from "@/lib/types";

type AnswerPanelProps = {
  response: QueryResponse | null;
  loading: boolean;
  error: string | null;
  compact?: boolean;
};

function Skeleton() {
  return (
    <div className="space-y-2.5 pt-0.5" aria-label="Generating answer…">
      <div className="skeleton" style={{ height: 14, width: "72%" }} />
      <div className="skeleton" style={{ height: 14, width: "100%" }} />
      <div className="skeleton" style={{ height: 14, width: "88%" }} />
      <div className="skeleton" style={{ height: 14, width: "64%" }} />
      <div className="skeleton" style={{ height: 14, width: "95%", marginTop: 16 }} />
      <div className="skeleton" style={{ height: 14, width: "80%" }} />
    </div>
  );
}

const TOOL_COLORS: Record<string, string> = {
  csv: "badge-green", pdf: "badge-orange", txt: "badge-violet",
  email: "badge-red", whatsapp: "badge-teal",
};

export default function AnswerPanel({ response, loading, error, compact }: AnswerPanelProps) {
  const tools = response?.toolUsed ?? [];

  return (
    <div
      className="bubble-ai"
      style={{ padding: compact ? "12px 14px" : "20px 22px" }}
    >
      {/* Tool pills */}
      {tools.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: compact ? 8 : 12 }}>
          {tools.map((t) => {
            const key = t.replace("search_", "");
            return (
              <span key={t} className={`badge ${TOOL_COLORS[key] ?? "badge-ghost"}`}>
                {key.toUpperCase()}
              </span>
            );
          })}
        </div>
      )}

      {loading && <Skeleton />}

      {error && (
        <p style={{ fontSize: 12.5, color: "#FCA5A5" }}>{error}</p>
      )}

      {!loading && !error && !response && (
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Submit a query to see the answer.</p>
      )}

      {response && !loading && (
        <div className="anim-fade-in" style={{ fontSize: 13.5, lineHeight: 1.75, color: "var(--text-secondary)" }}>
          <ReactMarkdown
            components={{
              p: ({ children }) => <p style={{ marginBottom: 10, color: "var(--text-secondary)" }}>{children}</p>,
              strong: ({ children }) => <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>{children}</strong>,
              em: ({ children }) => <em style={{ color: "var(--text-muted)" }}>{children}</em>,
              li: ({ children }) => <li style={{ marginBottom: 4, color: "var(--text-secondary)" }}>{children}</li>,
              ul: ({ children }) => <ul style={{ paddingLeft: 18, marginBottom: 10 }}>{children}</ul>,
              ol: ({ children }) => <ol style={{ paddingLeft: 18, marginBottom: 10 }}>{children}</ol>,
              h1: ({ children }) => <h1 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 18, marginBottom: 10, marginTop: 18 }}>{children}</h1>,
              h2: ({ children }) => <h2 style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 15, marginBottom: 7, marginTop: 14 }}>{children}</h2>,
              h3: ({ children }) => <h3 style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 13.5, marginBottom: 5, marginTop: 10 }}>{children}</h3>,
              code: ({ children }) => (
                <code style={{ color: "var(--accent-light)", background: "rgba(91,110,245,0.1)", padding: "1px 5px", borderRadius: 4, fontSize: 12.5, fontFamily: "var(--font-mono)" }}>
                  {children}
                </code>
              ),
              blockquote: ({ children }) => (
                <blockquote style={{ borderLeft: "2px solid var(--accent)", paddingLeft: 12, color: "var(--text-muted)", margin: "10px 0" }}>
                  {children}
                </blockquote>
              ),
            }}
          >
            {response.answer}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
