"use client";

import { useRef, KeyboardEvent, useState } from "react";
import { Send, Loader2 } from "lucide-react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading?: boolean;
};

export default function QueryInput({ value, onChange, onSubmit, loading }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const canSend = !loading && !!value.trim();

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSubmit();
    }
  }

  return (
    <form
      onSubmit={e => { e.preventDefault(); if (canSend) onSubmit(); }}
      className="input-glass"
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}
    >
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKey}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={focused ? "" : "Ask Memora anything…"}
        disabled={loading}
        autoComplete="off"
        spellCheck={false}
        style={{
          flex: 1,
          background: "transparent",
          border: "none",
          outline: "none",
          fontSize: 14,
          color: "var(--txt-1)",
          caretColor: "var(--accent)",
        }}
        className={focused && !value ? "typing-cursor" : ""}
      />
      {/* Animated placeholder when focused + empty */}
      {focused && !value && (
        <span
          style={{
            position: "absolute",
            pointerEvents: "none",
            fontSize: 14,
            color: "var(--txt-4)",
            marginLeft: 14,
          }}
        />
      )}
      <button
        type="submit"
        disabled={!canSend}
        className={`send-btn ${canSend ? "ready" : "idle"}`}
      >
        {loading
          ? <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} />
          : <Send size={15} />
        }
      </button>
    </form>
  );
}
