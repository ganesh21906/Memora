"use client";

import { motion } from "framer-motion";
import { Wand2 } from "lucide-react";

type Props = {
  suggestions: string[];
  onSelect: (value: string) => void;
};

export default function FollowUpSuggestions({
  suggestions,
  onSelect,
}: Props) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass soft-shadow rounded-3xl border border-white/80 p-5"
    >
      <div className="mb-4 flex items-center gap-2">
        <Wand2 size={16} className="text-slate-700" />
        <h3 className="text-sm font-semibold text-slate-900">
          Suggested Follow-ups
        </h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onSelect(item)}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {item}
          </button>
        ))}
      </div>
    </motion.section>
  );
}
