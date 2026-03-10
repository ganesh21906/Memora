"use client";

import { motion } from "framer-motion";
import { History } from "lucide-react";

type Props = {
  queries: string[];
  onSelect: (query: string) => void;
};

export default function RecentQueries({ queries, onSelect }: Props) {
  if (queries.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass soft-shadow rounded-3xl border border-white/80 p-5"
    >
      <div className="mb-4 flex items-center gap-2">
        <History size={16} className="text-slate-700" />
        <h3 className="text-sm font-semibold text-slate-900">Recent Queries</h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {queries.map((item, index) => (
          <button
            key={`${item}-${index}`}
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