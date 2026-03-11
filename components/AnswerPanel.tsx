"use client";

import ReactMarkdown from "react-markdown";
import { QueryResponse } from "@/lib/types";

type AnswerPanelProps = {
  response: QueryResponse | null;
  loading: boolean;
  error: string | null;
  compact?: boolean;
};

function SkeletonLoader() {
  return (
    <div className="space-y-3 pt-1" aria-label="Generating answer…">
      <div className="skeleton-shimmer h-4 w-3/4" />
      <div className="skeleton-shimmer h-4 w-full" />
      <div className="skeleton-shimmer h-4 w-5/6" />
      <div className="skeleton-shimmer h-4 w-2/3" />
      <div className="skeleton-shimmer mt-5 h-4 w-full" />
      <div className="skeleton-shimmer h-4 w-4/5" />
    </div>
  );
}

export default function AnswerPanel({ response, loading, error, compact }: AnswerPanelProps) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl"
      style={{
        padding: compact ? "14px 16px" : "24px",
        background: compact ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.03)",
        border: compact ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(99,102,241,0.22)",
        borderLeft: compact ? "3px solid rgba(99,102,241,0.35)" : "4px solid #6366F1",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: compact ? "none" : "0 4px 40px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {!compact && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[18px] font-semibold" style={{ color: "#F8FAFC" }}>
            AI Answer
          </h2>
          <div className="flex flex-wrap gap-2">
            {(response?.toolUsed ?? []).map((tool) => (
              <span
                key={tool}
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  border: "1px solid rgba(99,102,241,0.3)",
                  background: "rgba(99,102,241,0.08)",
                  color: "#818CF8",
                }}
              >
                {tool.replace("search_", "").toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      )}
      {compact && (response?.toolUsed ?? []).length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {(response?.toolUsed ?? []).map((tool) => (
            <span
              key={tool}
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{
                border: "1px solid rgba(99,102,241,0.2)",
                background: "rgba(99,102,241,0.07)",
                color: "#6366F1",
              }}
            >
              {tool.replace("search_", "")}
            </span>
          ))}
        </div>
      )}

      {loading ? <SkeletonLoader /> : null}
      {error ? (
        <p className="text-sm" style={{ color: "#F87171" }}>
          {error}
        </p>
      ) : null}
      {!loading && !error && !response ? (
        <p className="text-sm" style={{ color: "#94A3B8" }}>
          Submit a query to see a synthesized answer.
        </p>
      ) : null}

      {response && !loading ? (
        <div className="answer-enter anim-fade-up text-sm leading-7" style={{ maxWidth: "680px", color: "#CBD5E1" }}>
          <ReactMarkdown
            components={{
              p: ({ children }) => (
                <p style={{ marginBottom: "12px", color: "#CBD5E1" }}>{children}</p>
              ),
              strong: ({ children }) => (
                <strong style={{ color: "#F8FAFC", fontWeight: 600 }}>{children}</strong>
              ),
              em: ({ children }) => <em style={{ color: "#94A3B8" }}>{children}</em>,
              li: ({ children }) => (
                <li style={{ marginBottom: "4px", color: "#CBD5E1" }}>{children}</li>
              ),
              ul: ({ children }) => (
                <ul style={{ paddingLeft: "20px", marginBottom: "12px" }}>{children}</ul>
              ),
              ol: ({ children }) => (
                <ol style={{ paddingLeft: "20px", marginBottom: "12px" }}>{children}</ol>
              ),
              h1: ({ children }) => (
                <h1
                  style={{
                    color: "#F8FAFC",
                    fontWeight: 700,
                    fontSize: "22px",
                    marginBottom: "12px",
                    marginTop: "20px",
                  }}
                >
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2
                  style={{
                    color: "#F8FAFC",
                    fontWeight: 600,
                    fontSize: "18px",
                    marginBottom: "8px",
                    marginTop: "16px",
                  }}
                >
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3
                  style={{
                    color: "#F8FAFC",
                    fontWeight: 600,
                    fontSize: "15px",
                    marginBottom: "6px",
                    marginTop: "12px",
                  }}
                >
                  {children}
                </h3>
              ),
              code: ({ children }) => (
                <code
                  style={{
                    color: "#818CF8",
                    background: "rgba(99,102,241,0.1)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "13px",
                  }}
                >
                  {children}
                </code>
              ),
              blockquote: ({ children }) => (
                <blockquote
                  style={{
                    borderLeft: "3px solid rgba(99,102,241,0.5)",
                    paddingLeft: "16px",
                    color: "#94A3B8",
                    margin: "12px 0",
                  }}
                >
                  {children}
                </blockquote>
              ),
            }}
          >
            {response.answer}
          </ReactMarkdown>
        </div>
      ) : null}
    </section>
  );
}
