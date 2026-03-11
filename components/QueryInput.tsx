"use client";

import { useRef, KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";

type QueryInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  examples?: string[];
  onExampleClick?: (query: string) => void;
};

export default function QueryInput({ value, onChange, onSubmit, loading }: QueryInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && value.trim()) onSubmit();
    }
  }

  const canSubmit = !loading && !!value.trim();

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (canSubmit) onSubmit(); }}
      className="input-bar flex items-center gap-3 px-4 py-2.5"
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Ask Memora anything…"
        disabled={loading}
        className="flex-1 bg-transparent text-[14px] leading-tight outline-none"
        style={{ color: "var(--text-primary)", caretColor: "var(--accent-light)" }}
        autoComplete="off"
        spellCheck={false}
      />
      <button
        type="submit"
        disabled={!canSubmit}
        className={`btn-send ${canSubmit ? "active" : "inactive"}`}
      >
        {loading
          ? <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} />
          : <Send size={14} />
        }
      </button>
    </form>
  );
}
