"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Wand2, RotateCcw } from "lucide-react";

type Props = {
  query: string;
  setQuery: (value: string) => void;
  onSubmit: (query: string) => Promise<void>;
  onClear: () => void;
  loading: boolean;
};

const SAMPLE_PROMPTS = [
  "How much did I spend on groceries last month?",
  "Does Meena owe me money?",
  "What did the doctor say in January?",
  "What are my pending tasks for March?",
];

export default function ChatInput({
  query,
  setQuery,
  onSubmit,
  onClear,
  loading,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();

    const trimmed = query.trim();
    if (!trimmed || loading) return;

    await onSubmit(trimmed);
  }

  async function handleSamplePrompt(prompt: string) {
    setQuery(prompt);
    await onSubmit(prompt);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  }

  function handleClearClick() {
    onClear();
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass soft-shadow rounded-[28px] border border-white/80 p-6"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Sparkles size={16} />
          Ask your assistant
        </div>

        <textarea
          ref={textareaRef}
          rows={5}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Example: How much did I spend on food this month?"
          className="w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
        />

        <div className="flex flex-wrap gap-2">
          {SAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSamplePrompt(prompt)}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Wand2 size={13} />
              {prompt}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClearClick}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCcw size={16} />
            New Query
          </button>

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? "Searching..." : "Send Query"}
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </motion.div>
  );
}