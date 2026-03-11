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

export default function QueryInput({
  value,
  onChange,
  onSubmit,
  loading,
}: QueryInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && value.trim()) onSubmit();
    }
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (!loading && value.trim()) onSubmit(); }}
      className="relative flex items-center gap-2 rounded-2xl px-4 py-3"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.10)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 0 0 0 rgba(99,102,241,0)",
        transition: "box-shadow 0.2s ease",
      }}
      onFocusCapture={(e) => { (e.currentTarget as HTMLFormElement).style.boxShadow = "0 0 0 2px rgba(99,102,241,0.30)"; (e.currentTarget as HTMLFormElement).style.borderColor = "rgba(99,102,241,0.40)"; }}
      onBlurCapture={(e) => { (e.currentTarget as HTMLFormElement).style.boxShadow = "0 0 0 0 rgba(99,102,241,0)"; (e.currentTarget as HTMLFormElement).style.borderColor = "rgba(255,255,255,0.10)"; }}
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Ask Memora anything…"
        disabled={loading}
        className="flex-1 bg-transparent text-[15px] leading-tight outline-none placeholder:text-[#2D3D55]"
        style={{ color: "#E2E8F0", caretColor: "#818CF8" }}
        autoComplete="off"
        spellCheck={false}
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-200"
        style={!loading && value.trim()
          ? { background: "linear-gradient(135deg,#6366f1,#818cf8)", boxShadow: "0 0 14px rgba(99,102,241,0.35)", color: "#fff" }
          : { background: "rgba(255,255,255,0.05)", color: "#2D3D55" }}
      >
        {loading
          ? <Loader2 size={15} className="animate-spin" />
          : <Send size={15} />
        }
      </button>
    </form>
  );
}
