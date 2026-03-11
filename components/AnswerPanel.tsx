"use client";

import ReactMarkdown from "react-markdown";
import { QueryResponse } from "@/lib/types";

type Props = { response: QueryResponse | null; loading: boolean; error: string | null; compact?: boolean };

function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {[0.72, 1, 0.88, 0.64, 0.95, 0.78].map((w, i) => (
        <div key={i} className="skeleton" style={{ height: 13, width: `${w * 100}%`, animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  );
}

const TOOL_PILL: Record<string, string> = {
  csv: "pill pill-green", pdf: "pill pill-orange",
  txt: "pill pill-violet", email: "pill pill-red", whatsapp: "pill pill-teal",
};

export default function AnswerPanel({ response, loading, error, compact }: Props) {
  const tools = response?.toolUsed ?? [];

  return (
    <div className="bubble-ai" style={{ padding: compact ? "12px 15px" : "20px 22px" }}>
      {tools.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: compact ? 9 : 13 }}>
          {tools.map(t => {
            const k = t.replace("search_", "");
            return <span key={t} className={TOOL_PILL[k] ?? "pill pill-ghost"}>{k.toUpperCase()}</span>;
          })}
        </div>
      )}

      {loading && <Skeleton />}
      {error && <p style={{ fontSize: 12.5, color: "#FCA5A5" }}>{error}</p>}
      {!loading && !error && !response && (
        <p style={{ fontSize: 13, color: "var(--txt-3)" }}>Submit a query to see the answer.</p>
      )}

      {response && !loading && (
        <div className="anim-fade-in" style={{ fontSize: 13.5, lineHeight: 1.75, color: "var(--txt-2)" }}>
          <ReactMarkdown
            components={{
              p: ({ children }) => <p style={{ marginBottom: 10, color: "var(--txt-2)" }}>{children}</p>,
              strong: ({ children }) => <strong style={{ color: "var(--txt-1)", fontWeight: 600 }}>{children}</strong>,
              em: ({ children }) => <em style={{ color: "var(--txt-3)" }}>{children}</em>,
              li: ({ children }) => <li style={{ marginBottom: 4, color: "var(--txt-2)" }}>{children}</li>,
              ul: ({ children }) => <ul style={{ paddingLeft: 18, marginBottom: 10 }}>{children}</ul>,
              ol: ({ children }) => <ol style={{ paddingLeft: 18, marginBottom: 10 }}>{children}</ol>,
              h2: ({ children }) => <h2 style={{ color: "var(--txt-1)", fontWeight: 600, fontSize: 15, marginBottom: 7, marginTop: 14, fontFamily: "var(--font-display)" }}>{children}</h2>,
              h3: ({ children }) => <h3 style={{ color: "var(--txt-1)", fontWeight: 600, fontSize: 13.5, marginBottom: 5, marginTop: 10, fontFamily: "var(--font-display)" }}>{children}</h3>,
              code: ({ children }) => (
                <code style={{ color: "#A5B4FC", background: "rgba(99,102,241,0.12)", padding: "1px 6px", borderRadius: 4, fontSize: 12.5 }}>
                  {children}
                </code>
              ),
              blockquote: ({ children }) => (
                <blockquote style={{ borderLeft: "2px solid rgba(99,102,241,0.5)", paddingLeft: 12, color: "var(--txt-3)", margin: "10px 0" }}>
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
