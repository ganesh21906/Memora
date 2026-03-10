"use client";

import { motion } from "framer-motion";
import { Search, FileSearch } from "lucide-react";

export default function LoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass soft-shadow rounded-3xl border border-white/60 p-6"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
          <Search size={18} className="animate-pulse" />
        </div>
        <div>
          <p className="text-base font-semibold text-slate-900">Searching sources...</p>
          <p className="text-sm text-slate-500">
            Looking through available files and structured data
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {[
          "Scanning notes and meeting records",
          "Checking PDF content and budget references",
          "Reading email-style confirmations",
        ].map((item, index) => (
          <motion.div
            key={item}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.15 }}
            className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <FileSearch size={15} />
            </div>
            <p className="text-sm text-slate-700">{item}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}