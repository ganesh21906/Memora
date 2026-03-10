"use client";

import { motion } from "framer-motion";
import { FileText, Mail, Table2, FileBadge2 } from "lucide-react";
import { SourceItem, SourceType } from "@/lib/types";

function getBadgeStyles(type: SourceType) {
  switch (type) {
    case "pdf":
      return "bg-red-50 text-red-700 border-red-200";
    case "email":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "csv":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "text":
      return "bg-violet-50 text-violet-700 border-violet-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

function getIcon(type: SourceType) {
  switch (type) {
    case "pdf":
      return <FileBadge2 size={16} />;
    case "email":
      return <Mail size={16} />;
    case "csv":
      return <Table2 size={16} />;
    case "text":
      return <FileText size={16} />;
    default:
      return <FileText size={16} />;
  }
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getQueryTerms(query: string) {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 2);
}

function highlightText(text: string, query: string) {
  const terms = Array.from(new Set(getQueryTerms(query)));
  if (terms.length === 0) return text;

  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    const isMatch = terms.some((term) => term.toLowerCase() === part.toLowerCase());

    if (isMatch) {
      return (
        <mark
          key={`${part}-${index}`}
          className="rounded bg-amber-100 px-1 text-slate-900"
        >
          {part}
        </mark>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

export default function SourceCard({
  source,
  query,
}: {
  source: SourceItem;
  query: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="glass soft-shadow rounded-3xl border border-white/80 p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            {getIcon(source.type)}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{source.title}</h3>
            {source.meta ? (
              <p className="mt-1 text-xs text-slate-500">{source.meta}</p>
            ) : null}
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${getBadgeStyles(
            source.type
          )}`}
        >
          {source.type}
        </span>
      </div>

      <p className="text-sm leading-7 text-slate-700">
        {highlightText(source.snippet, query)}
      </p>
    </motion.div>
  );
}