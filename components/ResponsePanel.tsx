"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bot,
  Sparkles,
  SearchX,
  Copy,
  Download,
  Route,
} from "lucide-react";
import { QueryResponse, SourceType } from "@/lib/types";
import SourceCard from "./SourceCard";
import StructuredTruthPanel from "./StructuredTruthPanel";
import ConflictPanel from "./ConflictPanel";
import FollowUpSuggestions from "./FollowUpSuggestions";

type Props = {
  response: QueryResponse | null;
  error: string | null;
  currentQuery: string;
  onFollowUpSelect: (value: string) => void;
};

const FILTERS: Array<"all" | SourceType> = ["all", "text", "email", "pdf", "csv"];

export default function ResponsePanel({
  response,
  error,
  currentQuery,
  onFollowUpSelect,
}: Props) {
  const [activeFilter, setActiveFilter] = useState<"all" | SourceType>("all");

  useEffect(() => {
    setActiveFilter("all");
  }, [response]);

  const filteredSources = useMemo(() => {
    if (!response) return [];
    if (activeFilter === "all") return response.sources;
    return response.sources.filter((source) => source.type === activeFilter);
  }, [response, activeFilter]);

  function handleCopy() {
    if (!response) return;

    const text = [
      `Answer: ${response.answer}`,
      response.structuredTruth
        ? `Decision: ${response.structuredTruth.decision}
Budget: ${response.structuredTruth.budget}
Approved By: ${response.structuredTruth.approvedBy}
Status: ${response.structuredTruth.status}
Conflicts: ${response.structuredTruth.conflicts}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    navigator.clipboard.writeText(text);
  }

  function handleDownload() {
    if (!response) return;

    const content = [
      `Answer: ${response.answer}`,
      "",
      response.structuredTruth
        ? `Structured Truth
Decision: ${response.structuredTruth.decision}
Budget: ${response.structuredTruth.budget}
Approved By: ${response.structuredTruth.approvedBy}
Evidence: ${response.structuredTruth.evidence.join(", ")}
Status: ${response.structuredTruth.status}
Conflicts: ${response.structuredTruth.conflicts}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "assistant-result.txt";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  if (error) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-700">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-red-800">Something went wrong</h2>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </motion.section>
    );
  }

  if (!response) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass soft-shadow rounded-3xl border border-white/80 p-10"
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-white shadow-lg shadow-slate-900/15">
            <Bot size={24} />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Ready for your question</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
            Ask about transport, budget, invoices, meeting notes, catering, or any
            other event detail. The assistant will respond with grounded sources.
          </p>
        </div>
      </motion.section>
    );
  }

  if (response.status === "empty" || response.sources.length === 0) {
    return (
      <div className="space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass soft-shadow rounded-3xl border border-white/80 p-10"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-700">
              <SearchX size={24} />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">No relevant sources found</h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500">
              {response.answer}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {["transport", "budget", "invoice", "catering"].map((tip) => (
                <span
                  key={tip}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600"
                >
                  Try: {tip}
                </span>
              ))}
            </div>
          </div>
        </motion.section>

        <FollowUpSuggestions
          suggestions={response.followUpSuggestions ?? []}
          onSelect={onFollowUpSelect}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass soft-shadow rounded-3xl border border-white/80 p-6"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              <Sparkles size={13} />
              Answer
            </span>

            {response.toolUsed?.map((tool) => (
              <span
                key={tool}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
              >
                {tool}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Copy size={15} />
              Copy
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Download size={15} />
              Download
            </button>
          </div>
        </div>

        <p className="text-[15px] leading-8 text-slate-800">{response.answer}</p>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Sources searched: {response.toolUsed?.length ? response.toolUsed.join(", ") : "None"} ·{" "}
          Grounded with {response.sources.length} source{response.sources.length > 1 ? "s" : ""}
        </div>

        {(response.queryType || response.routerDecision || response.routerReason) && (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Route size={16} />
              Query Routing Explanation
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Query Type
                </p>
                <p className="mt-2 text-sm text-slate-800">
                  {response.queryType ?? "Not specified"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Router Chose
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {response.routerDecision && response.routerDecision.length > 0 ? (
                    response.routerDecision.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                      >
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">No routed source</span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Reason
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-800">
                  {response.routerReason ?? "No reason available"}
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.section>

      {response.structuredTruth ? (
        <StructuredTruthPanel truth={response.structuredTruth} />
      ) : null}

      {response.conflictsPanel ? (
        <ConflictPanel conflicts={response.conflictsPanel} />
      ) : null}

      <FollowUpSuggestions
        suggestions={response.followUpSuggestions ?? []}
        onSelect={onFollowUpSelect}
      />

      <motion.section
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Sources</h2>
            <p className="text-sm text-slate-500">
              {filteredSources.length} visible of {response.sources.length} total
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => {
              const isActive = activeFilter === filter;

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {filteredSources.map((source) => (
            <SourceCard key={source.id} source={source} query={currentQuery} />
          ))}
        </div>
      </motion.section>
    </div>
  );
}