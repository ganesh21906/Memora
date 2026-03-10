"use client";

import { motion } from "framer-motion";
import { Activity, Clock3, Layers3 } from "lucide-react";

type Props = {
  totalQueries: number;
  recentQueries: string[];
  lastSourceTypes: string[];
};

export default function SessionSummary({
  totalQueries,
  recentQueries,
  lastSourceTypes,
}: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass soft-shadow w-full max-w-4xl rounded-3xl border border-white/80 p-5"
    >
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Session Summary</h2>
        <p className="mt-1 text-sm text-slate-500">
          Quick view of the current interaction session
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Activity size={16} />
            Total Queries
          </div>
          <p className="text-2xl font-semibold text-slate-900">{totalQueries}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Layers3 size={16} />
            Last Source Types
          </div>
          <div className="flex flex-wrap gap-2">
            {lastSourceTypes.length > 0 ? (
              lastSourceTypes.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                >
                  {item}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-500">No sources yet</span>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Clock3 size={16} />
            Latest Query
          </div>
          <p className="text-sm leading-6 text-slate-700">
            {recentQueries.length > 0 ? recentQueries[0] : "No query asked yet"}
          </p>
        </div>
      </div>
    </motion.section>
  );
}