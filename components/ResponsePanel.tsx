"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Bot,
  Sparkles,
  SearchX,
  Copy,
  Download,
  Clock,
  CheckCircle2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
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

const TOOL_DISPLAY_NAME: Record<string, string> = {
  search_email: "Gmail",
  search_pdf: "PDF",
  search_txt: "Notes",
  search_csv: "CSV Data",
  search_attachments: "Attachments",
  search_whatsapp: "WhatsApp",
};

const TOOL_BADGE_STYLE: Record<string, string> = {
  search_email: "border-blue-200 bg-blue-50 text-blue-700",
  search_pdf: "border-red-200 bg-red-50 text-red-700",
  search_txt: "border-violet-200 bg-violet-50 text-violet-700",
  search_csv: "border-emerald-200 bg-emerald-50 text-emerald-700",
  search_attachments: "border-blue-200 bg-blue-50 text-blue-700",
  search_whatsapp: "border-green-200 bg-green-50 text-green-700",
};

// Framer Motion variants
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  show: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 500, damping: 22 } },
};

const answerVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const, delay: 0.25 } },
};

const cardContainerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

// Elapsed time count-up hook
function useCountUp(target: number, duration = 900) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    setCount(0);
    const steps = 30;
    const interval = duration / steps;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.round(current * 10) / 10);
      }
    }, interval);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

export default function ResponsePanel({
  response,
  error,
  currentQuery,
  onFollowUpSelect,
}: Props) {
  const [activeFilter, setActiveFilter] = useState<"all" | SourceType>("all");
  const [copied, setCopied] = useState(false);
  const elapsed = useCountUp(response?.elapsedSeconds ?? 0);

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
    navigator.clipboard.writeText(response.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (!response) return;
    const blob = new Blob([response.answer], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "memora-answer.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Error state ────────────────────────────────────────────────────────────
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

  // ── Initial / no query state ───────────────────────────────────────────────
  if (!response) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass soft-shadow rounded-3xl border border-white/80 p-10"
      >
        <div className="flex flex-col items-center text-center">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-white shadow-lg shadow-slate-900/15"
          >
            <Bot size={24} />
          </motion.div>
          <h2 className="text-xl font-semibold text-slate-900">Ready for your question</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
            Ask anything about your emails, notes, expenses, PDFs, CSV data, or WhatsApp chats.
            Memora searches all your sources and gives you a grounded answer.
          </p>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="mt-5 flex flex-wrap justify-center gap-2"
          >
            {["expenses", "health", "tasks", "friends", "goals"].map((tip) => (
              <motion.span
                key={tip}
                variants={badgeVariants}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600"
              >
                Try: {tip}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </motion.section>
    );
  }

  // ── No results state ───────────────────────────────────────────────────────
  if (response.status === "empty") {
    return (
      <div className="space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass soft-shadow rounded-3xl border border-white/80 p-10"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
              <SearchX size={24} />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">No relevant results found</h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500">{response.answer}</p>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="mt-5 flex flex-wrap justify-center gap-2"
            >
              {["groceries", "doctor", "Meena", "savings", "Coorg trip"].map((tip) => (
                <motion.button
                  key={tip}
                  variants={badgeVariants}
                  type="button"
                  onClick={() => onFollowUpSelect(tip)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Try: {tip}
                </motion.button>
              ))}
            </motion.div>
          </div>
        </motion.section>
        <FollowUpSuggestions
          suggestions={response.followUpSuggestions ?? []}
          onSelect={onFollowUpSelect}
        />
        <ConflictPanel conflicts={response.conflictsPanel ?? []} />
      </div>
    );
  }

  // ── Main answer ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Answer card */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="glass soft-shadow rounded-3xl border border-white/80 p-6"
      >
        {/* Header: Answer badge + tool badges + elapsed time */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-wrap items-center gap-2"
          >
            {/* Answer badge */}
            <motion.span
              variants={badgeVariants}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white"
            >
              <Sparkles size={11} />
              Answer
            </motion.span>

            {/* Tool badges — staggered pop-in */}
            {response.toolUsed?.map((tool) => (
              <motion.span
                key={tool}
                variants={badgeVariants}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                  TOOL_BADGE_STYLE[tool] ?? "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                {TOOL_DISPLAY_NAME[tool] ?? tool}
              </motion.span>
            ))}

            {/* Elapsed time counter */}
            {response.elapsedSeconds !== undefined && (
              <motion.span
                variants={badgeVariants}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500"
              >
                <Clock size={10} />
                {elapsed}s
              </motion.span>
            )}
          </motion.div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              onClick={handleCopy}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle2 size={14} className="text-green-600" />
                    Copied!
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Copy size={14} />
                    Copy
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <motion.button
              type="button"
              onClick={handleDownload}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <Download size={14} />
              Save
            </motion.button>
          </div>
        </div>

        {/* Answer text — fades in after badges */}
        <motion.div
          variants={answerVariants}
          initial="hidden"
          animate="show"
          className="prose prose-sm prose-slate max-w-none leading-7 [&_a]:text-indigo-600 [&_a]:no-underline hover:[&_a]:underline [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-slate-800 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_li]:my-0.5 [&_ol]:mt-2 [&_strong]:text-slate-900 [&_ul]:mt-2"
        >
          <ReactMarkdown>{response.answer}</ReactMarkdown>
        </motion.div>
      </motion.section>

      {response.structuredTruth ? <StructuredTruthPanel truth={response.structuredTruth} /> : null}
      <ConflictPanel conflicts={response.conflictsPanel ?? []} />

      <FollowUpSuggestions
        suggestions={response.followUpSuggestions ?? []}
        onSelect={onFollowUpSelect}
      />

      {/* Sources section */}
      <motion.section
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Sources Searched</h2>
            <p className="text-xs text-slate-500">
              {filteredSources.length} of {response.sources.length} shown
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-wrap gap-2"
          >
            {FILTERS.map((filter) => {
              const count =
                filter === "all"
                  ? response.sources.length
                  : response.sources.filter((s) => s.type === filter).length;
              if (count === 0 && filter !== "all") return null;
              return (
                <motion.button
                  key={filter}
                  variants={badgeVariants}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                    activeFilter === filter
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {filter} {filter !== "all" && `(${count})`}
                </motion.button>
              );
            })}
          </motion.div>
        </div>

        {/* Source cards — staggered slide up */}
        <motion.div
          variants={cardContainerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-4 md:grid-cols-2"
        >
          {filteredSources.map((source) => (
            <motion.div key={source.id} variants={cardVariants}>
              <SourceCard source={source} query={currentQuery} />
            </motion.div>
          ))}
        </motion.div>
      </motion.section>
    </div>
  );
}
