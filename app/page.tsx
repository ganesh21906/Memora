"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  BarChart3,
  Brain,
  ChevronDown,
  Database,
  FileSpreadsheet,
  FileText,
  FileType2,
  History,
  LogOut,
  Mail,
  MessageCircle,
  MessageSquareText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import QueryInput from "@/components/QueryInput";
import FileUploader, { SourceStats } from "@/components/FileUploader";
import AnswerPanel from "@/components/AnswerPanel";
import EvidenceCards from "@/components/EvidenceCards";
import ConflictPanel from "@/components/ConflictPanel";
import StructuredTruthPanel from "@/components/StructuredTruthPanel";
import { QueryResponse } from "@/lib/types";

type InsightTab = "evidence" | "conflicts" | "truth" | "summary";
type LeftTab = "sources" | "history";

type UsageData = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  requests: number;
  model: string;
  daily_token_limit: number;
  daily_request_limit: number;
};

const EXAMPLE_QUERIES = [
  "How much did I spend on groceries last month?",
  "What did the doctor say in January?",
  "Does Meena owe me money?",
  "What is my current weight?",
  "Summarize my Q1 2026 progress",
];

const INSIGHT_TABS: { key: InsightTab; label: string; icon: React.ReactNode }[] = [
  { key: "evidence", label: "Evidence", icon: <Database size={13} /> },
  { key: "conflicts", label: "Conflicts", icon: <AlertTriangle size={13} /> },
  { key: "truth", label: "Truth", icon: <CheckCircle2 size={13} /> },
  { key: "summary", label: "Summary", icon: <BarChart3 size={13} /> },
];

const DATA_SOURCES = [
  { name: "PDF Documents", tool: "search_pdf", color: "#EA580C", bg: "rgba(249,115,22,0.10)", bdr: "rgba(249,115,22,0.25)", icon: <FileType2 size={13} /> },
  { name: "CSV Files", tool: "search_csv", color: "#16A34A", bg: "rgba(34,197,94,0.10)", bdr: "rgba(34,197,94,0.25)", icon: <FileSpreadsheet size={13} /> },
  { name: "Text & Notes", tool: "search_txt", color: "#7C3AED", bg: "rgba(139,92,246,0.10)", bdr: "rgba(139,92,246,0.25)", icon: <FileText size={13} /> },
  { name: "Gmail / Email", tool: "search_email", color: "#DC2626", bg: "rgba(239,68,68,0.10)", bdr: "rgba(239,68,68,0.25)", icon: <Mail size={13} /> },
  { name: "WhatsApp", tool: "search_whatsapp", color: "#0D9488", bg: "rgba(20,184,166,0.10)", bdr: "rgba(20,184,166,0.25)", icon: <MessageCircle size={13} /> },
];

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/* ── Thinking animation ─────────────────────────────────── */
const SCAN_STEPS = [
  "Scanning documents…",
  "Checking emails…",
  "Analyzing notes…",
  "Comparing sources…",
  "Synthesizing answer…",
];

function ThinkingIndicator() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % SCAN_STEPS.length), 900);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block h-2 w-2 rounded-full"
            style={{
              background: "#6366F1",
              animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <span className="text-[13px]" style={{ color: "#818CF8" }}>
        {SCAN_STEPS[step]}
      </span>
    </div>
  );
}

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Array<{ q: string; r: QueryResponse; time: string }>>([]);
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalQueries, setTotalQueries] = useState(0);
  const [recentQueries, setRecentQueries] = useState<{ q: string; t: string }[]>([]);
  const [insightTab, setInsightTab] = useState<InsightTab>("evidence");
  const [leftTab, setLeftTab] = useState<LeftTab>("sources");
  const [sourceStats, setSourceStats] = useState<SourceStats>({ pdf: 0, txt: 0, csv: 0, total: 0 });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showUsage, setShowUsage] = useState(false);
  const [activeUser, setActiveUser] = useState({ name: "Demo User", email: "demo@memora.ai" });
  const [usageData, setUsageData] = useState<UsageData>({
    prompt_tokens: 0, completion_tokens: 0, total_tokens: 0,
    requests: 0, model: "llama-3.3-70b-versatile",
    daily_token_limit: 500_000, daily_request_limit: 14_400,
  });

  const menuRef = useRef<HTMLDivElement>(null);
  const usageRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem("demo-auth-user");
    if (!raw) return;
    try {
      const p = JSON.parse(raw) as { name?: string; email?: string };
      setActiveUser({ name: p.name ?? "Demo User", email: p.email ?? "demo@memora.ai" });
    } catch { /**/ }
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    if (showUserMenu) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showUserMenu]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (usageRef.current && !usageRef.current.contains(e.target as Node)) setShowUsage(false);
    };
    if (showUsage) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showUsage]);

  useEffect(() => {
    fetch("/api/usage").then((r) => r.ok ? r.json() : null).then((d) => d && setUsageData(d as UsageData)).catch(() => {});
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function submitQuery(nextQuery?: string) {
    const q = (nextQuery ?? query).trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setQuery("");
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      if (!res.ok) {
        const p = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(p.error ?? "Query failed");
      }
      const data = (await res.json()) as QueryResponse;
      const ts = formatTime(new Date());
      setMessages((prev) => [...prev, { q, r: data, time: ts }]);
      setResponse(data);
      setTotalQueries((prev) => prev + 1);
      setRecentQueries((prev) => [{ q, t: ts }, ...prev.filter((x) => x.q !== q)].slice(0, 10));
      setInsightTab("evidence");
      try { const ur = await fetch("/api/usage"); if (ur.ok) setUsageData(await ur.json() as UsageData); } catch { /**/ }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    if (typeof window !== "undefined") localStorage.removeItem("demo-auth-user");
    setShowUserMenu(false);
  }

  const sourceUsed = new Set(response?.toolUsed ?? []);

  function renderInsightContent() {
    switch (insightTab) {
      case "evidence": return <EvidenceCards sources={response?.sources ?? []} />;
      case "conflicts": return <ConflictPanel conflicts={response?.conflictsPanel ?? []} />;
      case "truth":
        return response?.structuredTruth
          ? <StructuredTruthPanel truth={response.structuredTruth} />
          : (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <CheckCircle2 size={28} style={{ color: "#1E293B" }} />
              <p className="text-[13px]" style={{ color: "#334155" }}>Ask a question to extract structured facts</p>
            </div>
          );
      case "summary":
        return (
          <div className="space-y-3">
            {[
              { label: "Total Queries", val: totalQueries },
              { label: "Files Indexed", val: sourceStats.total },
              { label: "Sources Used", val: (response?.toolUsed ?? []).length || 0 },
              { label: "Tokens Used", val: formatTokens(usageData.total_tokens) },
            ].map(({ label, val }) => (
              <div key={label} className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-[12px]" style={{ color: "#475569" }}>{label}</span>
                <span className="text-[14px] font-semibold" style={{ color: "#818CF8" }}>{val}</span>
              </div>
            ))}
            {(response?.toolUsed ?? []).length > 0 && (
              <div className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="mb-2 text-[11px] uppercase tracking-wider" style={{ color: "#334155" }}>Sources Searched</p>
                <div className="flex flex-wrap gap-1.5">
                  {(response?.toolUsed ?? []).map((t) => (
                    <span key={t} className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={{ background: "rgba(99,102,241,0.12)", color: "#818CF8", border: "1px solid rgba(99,102,241,0.25)" }}>
                      {t.replace("search_", "").toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0B0F1A 0%, #0F172A 55%, #020617 100%)" }}>

      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "radial-gradient(ellipse 1000px 600px at 25% -10%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse 700px 500px at 85% 110%, rgba(139,92,246,0.05) 0%, transparent 60%)" }} />

      {/* ── TOPBAR ──────────────────────────────────────────── */}
      <header className="relative z-20 flex flex-shrink-0 items-center justify-between px-5"
        style={{ height: "52px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(11,15,26,0.90)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>

        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: "linear-gradient(135deg,#6366f1,#818cf8)", boxShadow: "0 0 14px rgba(99,102,241,0.45)" }}>
            <Brain size={13} color="#fff" />
          </div>
          <span className="text-[17px] font-bold tracking-tight" style={{ color: "#F1F5F9", letterSpacing: "-0.4px" }}>
            Memora <span className="gradient-text">AI</span>
          </span>
          <span className="ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: "rgba(99,102,241,0.15)", color: "#818CF8", border: "1px solid rgba(99,102,241,0.25)" }}>
            Personal Executive
          </span>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Status */}
          <div className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 sm:flex"
            style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.18)" }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#22C55E", boxShadow: "0 0 5px #22C55E" }} />
            <span className="text-[11px] font-medium" style={{ color: "#86EFAC" }}>Online</span>
          </div>

          {/* API usage pill */}
          <div ref={usageRef} className="relative hidden sm:block">
            <button type="button" onClick={() => setShowUsage((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all duration-150"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}>
              <Activity size={12} style={{ color: "#818CF8" }} />
              <span className="text-[11px] font-medium" style={{ color: "#64748B" }}>{formatTokens(usageData.total_tokens)} tokens</span>
            </button>

            {showUsage && (
              <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl"
                style={{ background: "rgba(11,15,26,0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 50px rgba(0,0,0,0.7)" }}>
                <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[13px] font-semibold" style={{ color: "#F1F5F9" }}>API Usage · Session</p>
                  <p className="text-[11px]" style={{ color: "#334155" }}>{usageData.model}</p>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <div className="mb-1.5 flex justify-between">
                      <span className="text-[11px]" style={{ color: "#475569" }}>Tokens</span>
                      <span className="text-[12px] font-semibold" style={{ color: "#818CF8" }}>
                        {formatTokens(usageData.total_tokens)}<span style={{ color: "#334155" }}> / {formatTokens(usageData.daily_token_limit)}</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (usageData.total_tokens / usageData.daily_token_limit) * 100)}%`, background: usageData.total_tokens / usageData.daily_token_limit > 0.8 ? "#EF4444" : usageData.total_tokens / usageData.daily_token_limit > 0.5 ? "#F59E0B" : "linear-gradient(90deg,#6366f1,#818cf8)" }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ label: "Prompt", val: usageData.prompt_tokens }, { label: "Response", val: usageData.completion_tokens }].map(({ label, val }) => (
                      <div key={label} className="rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <p className="text-[10px] uppercase tracking-wide" style={{ color: "#334155" }}>{label}</p>
                        <p className="mt-0.5 text-[13px] font-semibold" style={{ color: "#94A3B8" }}>{formatTokens(val)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <span className="text-[12px]" style={{ color: "#475569" }}>Requests</span>
                    <span className="text-[12px] font-semibold" style={{ color: "#94A3B8" }}>{usageData.requests} / {usageData.daily_request_limit.toLocaleString()}</span>
                  </div>
                  <p className="text-center text-[10px]" style={{ color: "#1E293B" }}>Groq free tier · resets daily</p>
                </div>
              </div>
            )}
          </div>

          {/* Avatar */}
          <div ref={menuRef} className="relative">
            <button type="button" onClick={() => setShowUserMenu((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all duration-150"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#CBD5E1" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}>
              <div className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
                style={{ background: "linear-gradient(135deg,#6366f1,#818cf8)", color: "#fff" }}>
                {activeUser.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden text-[12px] font-medium sm:inline">{activeUser.name}</span>
              <ChevronDown size={10} style={{ color: "#475569" }} />
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl"
                style={{ background: "rgba(11,15,26,0.97)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 50px rgba(0,0,0,0.7)" }}>
                <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[13px] font-semibold" style={{ color: "#F1F5F9" }}>{activeUser.name}</p>
                  <p className="text-[11px]" style={{ color: "#475569" }}>{activeUser.email}</p>
                </div>
                <div className="p-1.5">
                  <button type="button" onClick={handleLogout}
                    className="inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px]"
                    style={{ color: "#F87171" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                    <LogOut size={12} /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── 3-COLUMN BODY ───────────────────────────────────── */}
      <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">

        {/* ── LEFT: Data Hub (260px) ───────────────────────── */}
        <aside className="hidden w-[260px] flex-shrink-0 flex-col overflow-hidden lg:flex"
          style={{ background: "rgba(9,13,22,0.75)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>

          {/* Tab toggle */}
          <div className="flex-shrink-0 px-4 pt-4 pb-2">
            <div className="flex rounded-lg p-0.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {(["sources", "history"] as LeftTab[]).map((t) => (
                <button key={t} type="button" onClick={() => setLeftTab(t)}
                  className="flex-1 rounded-md py-1.5 text-[12px] font-medium capitalize transition-all duration-150"
                  style={leftTab === t ? { background: "rgba(99,102,241,0.20)", color: "#818CF8" } : { background: "transparent", color: "#3B4A60" }}>
                  {t === "sources" ? "Data Hub" : "History"}
                </button>
              ))}
            </div>
          </div>

          {/* Left panel content — scrollable */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
            {leftTab === "sources" ? (
              <>
                {/* File uploader */}
                <FileUploader compact onStatsChange={setSourceStats} />

                {/* Source status */}
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="px-3 py-2.5" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#334155" }}>Connected Sources</p>
                  </div>
                  <div className="divide-y" style={{ background: "rgba(255,255,255,0.015)", borderColor: "rgba(255,255,255,0.04)" }}>
                    {DATA_SOURCES.map((src) => {
                      const active = sourceUsed.has(src.tool);
                      return (
                        <div key={src.name} className="flex items-center gap-2.5 px-3 py-2.5 transition-all duration-200"
                          style={{ background: active ? src.bg : "transparent" }}>
                          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md"
                            style={{ background: active ? `${src.color}22` : "rgba(255,255,255,0.04)", color: active ? src.color : "#334155", border: `1px solid ${active ? src.bdr : "rgba(255,255,255,0.06)"}` }}>
                            {src.icon}
                          </div>
                          <span className="flex-1 text-[12px] font-medium truncate" style={{ color: active ? "#CBD5E1" : "#3B4A60" }}>{src.name}</span>
                          {active
                            ? <span className="flex-shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase" style={{ background: `${src.color}22`, color: src.color }}>Used</span>
                            : <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: "#1E293B" }} />
                          }
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Queries", val: totalQueries, color: "#818CF8" },
                    { label: "Files", val: sourceStats.total, color: "#818CF8" },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="rounded-xl px-3 py-3 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-[10px] uppercase tracking-wide" style={{ color: "#334155" }}>{label}</p>
                      <p className="mt-1 text-[18px] font-bold" style={{ color }}>{val}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* History tab */
              <div className="space-y-1.5">
                {recentQueries.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <History size={24} style={{ color: "#1E293B" }} />
                    <p className="text-[12px]" style={{ color: "#334155" }}>Your query history will appear here</p>
                  </div>
                ) : (
                  recentQueries.map(({ q, t }) => (
                    <button key={q} type="button" onClick={() => void submitQuery(q)}
                      className="glow-card w-full rounded-xl px-3 py-3 text-left"
                      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <p className="truncate text-[12px] font-medium leading-snug" style={{ color: "#94A3B8" }}>{q}</p>
                      <p className="mt-1 text-[10px]" style={{ color: "#334155" }}>{t}</p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* User card pinned to bottom */}
          <div className="flex-shrink-0 px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                style={{ background: "linear-gradient(135deg,#6366f1,#818cf8)", color: "#fff" }}>
                {activeUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold" style={{ color: "#CBD5E1" }}>{activeUser.name}</p>
                <p className="truncate text-[10px]" style={{ color: "#334155" }}>{activeUser.email}</p>
              </div>
              <button type="button" onClick={handleLogout} className="rounded-lg p-1.5" style={{ color: "#334155" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#F87171"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#334155"; }}>
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </aside>

        {/* ── CENTER: AI Workspace ────────────────────────── */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">

          {/* Chat history — scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto flex max-w-[780px] flex-col gap-0 px-6 py-6">

              {/* Welcome state */}
              {messages.length === 0 && !loading && (
                <div className="flex flex-col items-center gap-6 py-8 text-center anim-fade-up">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl"
                    style={{ background: "linear-gradient(135deg,#6366f1,#818cf8)", boxShadow: "0 0 40px rgba(99,102,241,0.35)" }}>
                    <Brain size={28} color="#fff" />
                  </div>
                  <div>
                    <h1 className="text-[26px] font-bold" style={{ color: "#F1F5F9", letterSpacing: "-0.5px" }}>
                      What would you like Memora AI to remember or analyze?
                    </h1>
                    <p className="mt-2 text-[15px]" style={{ color: "#475569" }}>
                      Ask questions about your emails, documents, notes, chats, and data files.
                    </p>
                  </div>

                  {/* Starter prompts */}
                  <div className="w-full max-w-[600px]">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#334155" }}>Try asking:</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {EXAMPLE_QUERIES.map((eq) => (
                        <button key={eq} type="button" onClick={() => void submitQuery(eq)}
                          className="glow-card rounded-xl px-4 py-3 text-left text-[13px] font-medium"
                          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", color: "#64748B" }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "#94A3B8"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "#64748B"; }}>
                          <span className="mr-2" style={{ color: "#6366F1" }}>→</span>{eq}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Message thread */}
              {messages.map(({ q, r, time }, idx) => (
                <div key={idx} className="mb-6 space-y-3 anim-fade-up">
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="max-w-[75%] rounded-2xl rounded-br-sm px-4 py-3"
                      style={{ background: "rgba(99,102,241,0.18)", border: "1px solid rgba(99,102,241,0.28)" }}>
                      <p className="text-[14px] leading-relaxed" style={{ color: "#E2E8F0" }}>{q}</p>
                      <p className="mt-1 text-right text-[10px]" style={{ color: "#475569" }}>{time}</p>
                    </div>
                  </div>
                  {/* AI response */}
                  <div className="flex gap-3">
                    <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                      style={{ background: "linear-gradient(135deg,#6366f1,#818cf8)", boxShadow: "0 0 10px rgba(99,102,241,0.3)" }}>
                      <Brain size={13} color="#fff" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <AnswerPanel response={r} loading={false} error={null} compact />
                    </div>
                  </div>
                </div>
              ))}

              {/* AI thinking state */}
              {loading && (
                <div className="mb-6 flex gap-3 anim-fade-up">
                  <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{ background: "linear-gradient(135deg,#6366f1,#818cf8)" }}>
                    <Brain size={13} color="#fff" />
                  </div>
                  <div className="flex-1 rounded-2xl rounded-tl-sm px-4 py-4"
                    style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>
                    <ThinkingIndicator />
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-4 rounded-xl px-4 py-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <p className="text-[13px]" style={{ color: "#FCA5A5" }}>{error}</p>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </div>

          {/* ── COMMAND BAR (pinned bottom) ─────────────────── */}
          <div className="flex-shrink-0 px-6 pb-5 pt-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(9,13,22,0.70)", backdropFilter: "blur(16px)" }}>
            <div className="mx-auto max-w-[780px]">
              <QueryInput
                value={query}
                onChange={setQuery}
                onSubmit={() => void submitQuery()}
                loading={loading}
                examples={EXAMPLE_QUERIES}
                onExampleClick={(q) => void submitQuery(q)}
              />
            </div>
          </div>
        </main>

        {/* ── RIGHT: Insights panel (320px, xl+) ──────────── */}
        <aside className="hidden w-[320px] flex-shrink-0 flex-col overflow-hidden xl:flex"
          style={{ background: "rgba(9,13,22,0.75)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderLeft: "1px solid rgba(255,255,255,0.05)" }}>

          {/* Header */}
          <div className="flex flex-shrink-0 items-center gap-2 px-4 py-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <MessageSquareText size={14} style={{ color: "#6366F1" }} />
            <span className="text-[13px] font-semibold" style={{ color: "#64748B" }}>Insights &amp; Verification</span>
          </div>

          {/* Tabs */}
          <div className="flex flex-shrink-0 gap-0.5 p-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            {INSIGHT_TABS.map(({ key, label, icon }) => (
              <button key={key} type="button" onClick={() => setInsightTab(key)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-medium transition-all duration-150"
                style={insightTab === key
                  ? { background: "rgba(99,102,241,0.18)", color: "#818CF8" }
                  : { background: "transparent", color: "#2D3D55" }}
                onMouseEnter={(e) => { if (insightTab !== key) e.currentTarget.style.color = "#475569"; }}
                onMouseLeave={(e) => { if (insightTab !== key) e.currentTarget.style.color = "#2D3D55"; }}>
                {icon}<span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Content — scrollable */}
          <div className="flex-1 overflow-y-auto p-4">
            {!response && !loading ? (
              <div className="flex flex-col items-center gap-4 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.12)" }}>
                  <Sparkles size={22} style={{ color: "#1E293B" }} />
                </div>
                <p className="text-[13px] leading-relaxed" style={{ color: "#2D3D55" }}>
                  Evidence, conflicts, and structured facts will appear here after your first query.
                </p>
              </div>
            ) : (
              renderInsightContent()
            )}
          </div>

          {/* Conflict/source count badges */}
          {response && (
            <div className="flex flex-shrink-0 gap-2 px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex-1 rounded-lg px-3 py-2 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p className="text-[10px] uppercase tracking-wide" style={{ color: "#334155" }}>Sources</p>
                <p className="mt-0.5 text-[16px] font-bold" style={{ color: "#818CF8" }}>{response.sources?.length ?? 0}</p>
              </div>
              <div className="flex-1 rounded-lg px-3 py-2 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p className="text-[10px] uppercase tracking-wide" style={{ color: "#334155" }}>Conflicts</p>
                <p className="mt-0.5 text-[16px] font-bold" style={{ color: (response.conflictsPanel ?? []).length > 0 ? "#F59E0B" : "#334155" }}>
                  {(response.conflictsPanel ?? []).length}
                </p>
              </div>
              <div className="flex-1 rounded-lg px-3 py-2 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p className="text-[10px] uppercase tracking-wide" style={{ color: "#334155" }}>Tools</p>
                <p className="mt-0.5 text-[16px] font-bold" style={{ color: "#818CF8" }}>{(response.toolUsed ?? []).length}</p>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* bounce keyframe */}
      <style>{`@keyframes bounce { 0%, 80%, 100% { transform: translateY(0); opacity: 0.4; } 40% { transform: translateY(-6px); opacity: 1; } }`}</style>
    </div>
  );
}
