"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity, BarChart3, Brain, ChevronDown, Database,
  FileSpreadsheet, FileText, FileType2, History, LogOut,
  Mail, MessageCircle, MessageSquareText, Sparkles,
  CheckCircle2, AlertTriangle,
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
  prompt_tokens: number; completion_tokens: number; total_tokens: number;
  requests: number; model: string; daily_token_limit: number; daily_request_limit: number;
};

const EXAMPLES = [
  "How much did I spend on groceries last month?",
  "What did the doctor say in January?",
  "Does Meena owe me money?",
  "What is my current weight?",
  "Summarize my Q1 2026 progress",
];

const INSIGHT_TABS: { key: InsightTab; label: string; icon: React.ReactNode }[] = [
  { key: "evidence",  label: "Evidence",  icon: <Database size={12} /> },
  { key: "conflicts", label: "Conflicts", icon: <AlertTriangle size={12} /> },
  { key: "truth",     label: "Truth",     icon: <CheckCircle2 size={12} /> },
  { key: "summary",   label: "Summary",   icon: <BarChart3 size={12} /> },
];

const DATA_SOURCES = [
  { name: "PDF Documents", tool: "search_pdf",      color: "var(--c-pdf)",      bg: "rgba(249,115,22,0.08)", bdr: "rgba(249,115,22,0.2)",  icon: <FileType2 size={12} /> },
  { name: "CSV Files",     tool: "search_csv",      color: "var(--c-csv)",      bg: "rgba(16,185,129,0.08)", bdr: "rgba(16,185,129,0.2)",  icon: <FileSpreadsheet size={12} /> },
  { name: "Text & Notes",  tool: "search_txt",      color: "var(--c-txt)",      bg: "rgba(139,92,246,0.08)", bdr: "rgba(139,92,246,0.2)",  icon: <FileText size={12} /> },
  { name: "Gmail / Email", tool: "search_email",    color: "var(--c-email)",    bg: "rgba(239,68,68,0.08)",  bdr: "rgba(239,68,68,0.2)",   icon: <Mail size={12} /> },
  { name: "WhatsApp",      tool: "search_whatsapp", color: "var(--c-whatsapp)", bg: "rgba(20,184,166,0.08)", bdr: "rgba(20,184,166,0.2)",  icon: <MessageCircle size={12} /> },
];

function fmtTime(d: Date) { return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
function fmtTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

const SCAN_STEPS = ["Scanning documents…", "Checking emails…", "Analyzing notes…", "Comparing sources…", "Synthesizing answer…"];

function ThinkingDots() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % SCAN_STEPS.length), 900);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
      <div style={{ display: "flex", gap: 4 }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "var(--accent)",
            display: "inline-block",
            animation: `bounce-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <span style={{ fontSize: 12.5, color: "#A5B4FC" }}>{SCAN_STEPS[step]}</span>
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
  const [mounted, setMounted] = useState(false);

  const menuRef  = useRef<HTMLDivElement>(null);
  const usageRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("demo-auth-user");
      if (raw) {
        const p = JSON.parse(raw) as { name?: string; email?: string };
        setActiveUser({ name: p.name ?? "Demo User", email: p.email ?? "demo@memora.ai" });
      }
    } catch { /**/ }
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowUserMenu(false); };
    if (showUserMenu) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showUserMenu]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (usageRef.current && !usageRef.current.contains(e.target as Node)) setShowUsage(false); };
    if (showUsage) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showUsage]);

  useEffect(() => {
    fetch("/api/usage").then(r => r.ok ? r.json() : null).then(d => d && setUsageData(d as UsageData)).catch(() => {});
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function submitQuery(nextQuery?: string) {
    const q = (nextQuery ?? query).trim();
    if (!q) return;
    setLoading(true); setError(null); setQuery("");
    try {
      const res = await fetch("/api/query", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      if (!res.ok) {
        const p = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(p.error ?? "Query failed");
      }
      const data = (await res.json()) as QueryResponse;
      const ts = fmtTime(new Date());
      setMessages(prev => [...prev, { q, r: data, time: ts }]);
      setResponse(data);
      setTotalQueries(prev => prev + 1);
      setRecentQueries(prev => [{ q, t: ts }, ...prev.filter(x => x.q !== q)].slice(0, 10));
      setInsightTab("evidence");
      try { const ur = await fetch("/api/usage"); if (ur.ok) setUsageData(await ur.json() as UsageData); } catch { /**/ }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally { setLoading(false); }
  }

  function handleLogout() {
    if (typeof window !== "undefined") localStorage.removeItem("demo-auth-user");
    setShowUserMenu(false);
  }

  const sourceUsed = new Set(response?.toolUsed ?? []);
  const tokenPct = Math.min(100, (usageData.total_tokens / usageData.daily_token_limit) * 100);
  const tokenBarColor = tokenPct > 80 ? "var(--c-email)" : tokenPct > 50 ? "#F59E0B" : "var(--accent)";

  function renderInsight() {
    switch (insightTab) {
      case "evidence":  return <EvidenceCards sources={response?.sources ?? []} />;
      case "conflicts": return <ConflictPanel conflicts={response?.conflictsPanel ?? []} />;
      case "truth":
        return response?.structuredTruth
          ? <StructuredTruthPanel truth={response.structuredTruth} />
          : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "32px 12px", textAlign: "center" }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle2 size={16} style={{ color: "var(--txt-4)" }} />
              </div>
              <p style={{ fontSize: 12, color: "var(--txt-3)" }}>Ask a question to extract structured facts</p>
            </div>
          );
      case "summary":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p className="sec-label" style={{ marginBottom: 3 }}>Session Overview</p>
            {[
              { label: "Total Queries", val: totalQueries },
              { label: "Files Indexed", val: sourceStats.total },
              { label: "Sources Used",  val: (response?.toolUsed ?? []).length },
              { label: "Tokens Used",   val: fmtTokens(usageData.total_tokens) },
            ].map(({ label, val }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <span style={{ fontSize: 12.5, color: "var(--txt-3)" }}>{label}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#A5B4FC", fontFamily: "monospace" }}>{val}</span>
              </div>
            ))}
            {(response?.toolUsed ?? []).length > 0 && (
              <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="sec-label" style={{ marginBottom: 8 }}>Sources Searched</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {(response?.toolUsed ?? []).map(t => (
                    <span key={t} className="pill pill-accent">{t.replace("search_", "").toUpperCase()}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
    }
  }

  if (!mounted) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "var(--space-1)", position: "relative" }}>

      {/* ── AURORA BACKGROUND ─────────────────────────────── */}
      <div className="aurora-bg" aria-hidden>
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
        <div className="aurora-blob aurora-blob-4" />
      </div>

      {/* ── TOPBAR ────────────────────────────────────────── */}
      <header
        className="topbar-glass anim-fade-in"
        style={{ position: "relative", zIndex: 20, height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", flexShrink: 0 }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 11 }} className="anim-float-up d-0">
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, #6366F1, #A78BFA)",
            boxShadow: "0 0 16px rgba(99,102,241,0.5), 0 0 4px rgba(167,139,250,0.3)",
          }}>
            <Brain size={14} color="#fff" />
          </div>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.04em", fontFamily: "var(--font-display)", color: "var(--txt-1)" }}>
            Memora <span className="grad-text">AI</span>
          </span>
          <span className="pill pill-accent" style={{ marginLeft: 2 }}>Personal Executive</span>
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }} className="anim-float-up d-1">
          {/* Online */}
          <div className="status-online-badge">
            <span className="status-dot" />
            <span style={{ fontSize: 11, fontWeight: 500, color: "#6EE7B7" }}>Online</span>
          </div>

          {/* Usage */}
          <div ref={usageRef} style={{ position: "relative" }}>
            <button
              onClick={() => setShowUsage(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 9, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "var(--txt-3)", transition: "all 150ms ease", backdropFilter: "blur(8px)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.14)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.09)"; }}
            >
              <Activity size={12} style={{ color: "#A5B4FC" }} />
              <span style={{ fontSize: 11.5, fontFamily: "monospace" }}>{fmtTokens(usageData.total_tokens)}</span>
              <span style={{ fontSize: 11, color: "var(--txt-4)" }}>tokens</span>
            </button>

            {showUsage && (
              <div className="anim-float-up" style={{
                position: "absolute", right: 0, top: "calc(100% + 10px)", zIndex: 50,
                width: 250, borderRadius: 14, overflow: "hidden",
                background: "rgba(6,8,18,0.92)", backdropFilter: "blur(32px) saturate(180%)",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)",
              }}>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--txt-1)", fontFamily: "var(--font-display)" }}>API Usage</p>
                  <p style={{ fontSize: 11, color: "var(--txt-3)", marginTop: 2, fontFamily: "monospace" }}>{usageData.model}</p>
                </div>
                <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 11 }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: "var(--txt-3)" }}>Tokens</span>
                      <span style={{ fontSize: 11.5, fontWeight: 600, fontFamily: "monospace", color: "#A5B4FC" }}>
                        {fmtTokens(usageData.total_tokens)} <span style={{ color: "var(--txt-4)" }}>/ {fmtTokens(usageData.daily_token_limit)}</span>
                      </span>
                    </div>
                    <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 99, width: `${tokenPct}%`, background: tokenBarColor, transition: "width 600ms ease", boxShadow: `0 0 8px ${tokenBarColor}` }} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                    {[{ l: "Prompt", v: usageData.prompt_tokens }, { l: "Response", v: usageData.completion_tokens }].map(({ l, v }) => (
                      <div key={l} style={{ borderRadius: 9, padding: "8px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--txt-4)", marginBottom: 4 }}>{l}</p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--txt-2)", fontFamily: "monospace" }}>{fmtTokens(v)}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", borderRadius: 9, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ fontSize: 12, color: "var(--txt-3)" }}>Requests</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--txt-2)", fontFamily: "monospace" }}>{usageData.requests} / {usageData.daily_request_limit.toLocaleString()}</span>
                  </div>
                  <p style={{ fontSize: 10.5, textAlign: "center", color: "var(--txt-4)" }}>Groq free tier · resets daily</p>
                </div>
              </div>
            )}
          </div>

          {/* Avatar */}
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              onClick={() => setShowUserMenu(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 11px", borderRadius: 9, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", transition: "all 150ms ease", backdropFilter: "blur(8px)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}
            >
              <div className="avatar-glass" style={{ width: 22, height: 22, fontSize: 10 }}>{activeUser.name.charAt(0).toUpperCase()}</div>
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--txt-2)" }}>{activeUser.name}</span>
              <ChevronDown size={10} style={{ color: "var(--txt-4)" }} />
            </button>

            {showUserMenu && (
              <div className="anim-float-up" style={{
                position: "absolute", right: 0, top: "calc(100% + 10px)", zIndex: 50,
                width: 210, borderRadius: 14, overflow: "hidden",
                background: "rgba(6,8,18,0.92)", backdropFilter: "blur(32px)",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
              }}>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--txt-1)", fontFamily: "var(--font-display)" }}>{activeUser.name}</p>
                  <p style={{ fontSize: 11.5, color: "var(--txt-3)", marginTop: 2 }}>{activeUser.email}</p>
                </div>
                <div style={{ padding: 6 }}>
                  <button onClick={handleLogout}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, background: "transparent", border: "none", color: "#FCA5A5", fontSize: 13, transition: "background 140ms ease" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                    <LogOut size={12} /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── 3-COLUMN BODY ──────────────────────────────────── */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

        {/* ── LEFT SIDEBAR ────────────────────────────────── */}
        <aside
          className="sidebar-glass hide-below-lg anim-slide-left"
          style={{ width: 262, flexShrink: 0, flexDirection: "column", overflow: "hidden" }}
        >
          {/* Tab toggle */}
          <div style={{ flexShrink: 0, padding: "14px 14px 10px" }}>
            <div className="tab-bar-glass">
              {(["sources", "history"] as LeftTab[]).map(t => (
                <button key={t} className={`tab-btn ${leftTab === t ? "active" : ""}`} onClick={() => setLeftTab(t)}>
                  {t === "sources" ? <><Database size={11} />Data Hub</> : <><History size={11} />History</>}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "4px 14px 14px", display: "flex", flexDirection: "column", gap: 16 }}>
            {leftTab === "sources" ? (
              <>
                <FileUploader compact onStatsChange={setSourceStats} />

                {/* Divider */}
                <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

                {/* Connected sources */}
                <div>
                  <p className="sec-label" style={{ marginBottom: 9 }}>Connected Sources</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {DATA_SOURCES.map(src => {
                      const active = sourceUsed.has(src.tool);
                      return (
                        <div key={src.name} className={`source-row-glass ${active ? "used" : ""}`}>
                          <div style={{
                            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: active ? `${src.bg}` : "rgba(255,255,255,0.04)",
                            border: `1px solid ${active ? src.bdr : "rgba(255,255,255,0.08)"}`,
                            color: active ? src.color : "var(--txt-4)",
                            transition: "all 220ms ease",
                            boxShadow: active ? `0 0 10px ${src.bg}` : "none",
                          }}>
                            {src.icon}
                          </div>
                          <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: active ? "var(--txt-2)" : "var(--txt-4)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                            {src.name}
                          </span>
                          {active
                            ? <span className="pill" style={{ background: src.bg, color: src.color, borderColor: src.bdr, flexShrink: 0 }}>Used</span>
                            : <span style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
                          }
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: "flex", gap: 7 }}>
                  {[{ label: "Queries", val: totalQueries }, { label: "Files", val: sourceStats.total }].map(({ label, val }) => (
                    <div key={label} className="stat-glass">
                      <span style={{ fontSize: 10, color: "var(--txt-4)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-display)" }}>{label}</span>
                      <span style={{ fontSize: 22, fontWeight: 800, color: "#A5B4FC", fontFamily: "var(--font-display)", lineHeight: 1, textShadow: "0 0 20px rgba(99,102,241,0.5)" }}>{val}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* History */
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <p className="sec-label" style={{ marginBottom: 4 }}>Recent Queries</p>
                {recentQueries.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "32px 12px", textAlign: "center" }}>
                    <History size={24} style={{ color: "var(--txt-4)" }} />
                    <p style={{ fontSize: 12, color: "var(--txt-3)" }}>Your history will appear here</p>
                  </div>
                ) : recentQueries.map(({ q, t }) => (
                  <button key={q} onClick={() => void submitQuery(q)}
                    className="glass-card"
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 12px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 11 }}>
                    <p style={{ fontSize: 12, color: "var(--txt-2)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{q}</p>
                    <p style={{ fontSize: 10.5, color: "var(--txt-4)", marginTop: 3, fontFamily: "monospace" }}>{t}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User footer */}
          <div style={{ flexShrink: 0, padding: "11px 14px", borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="avatar-glass" style={{ width: 30, height: 30, fontSize: 12 }}>{activeUser.name.charAt(0).toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: "var(--txt-2)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{activeUser.name}</p>
                <p style={{ fontSize: 10.5, color: "var(--txt-4)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{activeUser.email}</p>
              </div>
              <button
                onClick={handleLogout}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 7, border: "none", background: "transparent", color: "var(--txt-3)", transition: "all 150ms ease" }}
                title="Sign out"
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "#FCA5A5"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--txt-3)"; }}
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </aside>

        {/* ── CENTER CHAT ──────────────────────────────────── */}
        <main className="anim-fade-in" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, overflowY: "auto" }}>
            <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 28px", display: "flex", flexDirection: "column" }}>

              {/* Welcome */}
              {messages.length === 0 && !loading && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: "28px 0 36px", textAlign: "center" }}>
                  {/* Glowing brain icon */}
                  <div className="anim-float-up d-0" style={{
                    width: 72, height: 72, borderRadius: 22,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(167,139,250,0.2))",
                    border: "1px solid rgba(99,102,241,0.35)",
                    backdropFilter: "blur(16px)",
                    boxShadow: "0 0 40px rgba(99,102,241,0.3), 0 0 80px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.1)",
                    animation: "glow-pulse 3s ease-in-out infinite",
                  }}>
                    <Brain size={30} style={{ color: "#A5B4FC" }} />
                  </div>

                  <div className="anim-float-up d-1">
                    <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--txt-1)", letterSpacing: "-0.04em", lineHeight: 1.15, marginBottom: 10, fontFamily: "var(--font-display)" }}>
                      What would you like<br />
                      <span className="grad-text">to remember?</span>
                    </h1>
                    <p style={{ fontSize: 15, color: "var(--txt-3)", maxWidth: 420, margin: "0 auto", lineHeight: 1.6 }}>
                      Ask anything across your emails, documents, notes, and data files.
                    </p>
                  </div>

                  {/* Example cards */}
                  <div className="anim-float-up d-2" style={{ width: "100%", maxWidth: 580 }}>
                    <p className="sec-label" style={{ marginBottom: 12 }}>Try asking</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {EXAMPLES.map((eq, i) => (
                        <button
                          key={eq}
                          onClick={() => void submitQuery(eq)}
                          className="glass-card"
                          style={{
                            textAlign: "left", padding: "12px 14px",
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 12,
                            animationDelay: `${i * 50}ms`,
                          }}
                        >
                          <span style={{ color: "var(--accent)", marginRight: 7, fontWeight: 700 }}>→</span>
                          <span style={{ fontSize: 12.5, color: "var(--txt-3)" }}>{eq}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Thread */}
              {messages.map(({ q, r, time }, idx) => (
                <div key={idx} className="anim-float-up" style={{ marginBottom: 22, display: "flex", flexDirection: "column", gap: 10, animationDelay: `${idx * 20}ms` }}>
                  {/* User bubble */}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div className="bubble-user" style={{ maxWidth: "72%", padding: "11px 15px" }}>
                      <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--txt-1)" }}>{q}</p>
                      <p style={{ marginTop: 5, textAlign: "right", fontSize: 10.5, color: "rgba(165,180,252,0.5)", fontFamily: "monospace" }}>{time}</p>
                    </div>
                  </div>
                  {/* AI bubble */}
                  <div style={{ display: "flex", gap: 11 }}>
                    <div style={{
                      marginTop: 2, width: 28, height: 28, borderRadius: 9, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "linear-gradient(135deg, #6366F1, #A78BFA)",
                      boxShadow: "0 0 10px rgba(99,102,241,0.4)",
                    }}>
                      <Brain size={13} color="#fff" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <AnswerPanel response={r} loading={false} error={null} compact />
                    </div>
                  </div>
                </div>
              ))}

              {/* Thinking */}
              {loading && (
                <div className="anim-float-up" style={{ display: "flex", gap: 11, marginBottom: 22 }}>
                  <div style={{ marginTop: 2, width: 28, height: 28, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #6366F1, #A78BFA)", boxShadow: "0 0 10px rgba(99,102,241,0.4)" }}>
                    <Brain size={13} color="#fff" />
                  </div>
                  <div className="bubble-ai" style={{ flex: 1, padding: "12px 15px" }}>
                    <ThinkingDots />
                  </div>
                </div>
              )}

              {error && (
                <div style={{ padding: "11px 14px", borderRadius: 11, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.22)", marginBottom: 18, backdropFilter: "blur(8px)" }}>
                  <p style={{ fontSize: 13, color: "#FCA5A5" }}>{error}</p>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Input */}
          <div style={{
            flexShrink: 0, padding: "12px 28px 20px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(5,7,16,0.6)", backdropFilter: "blur(20px)",
          }}>
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
              <QueryInput value={query} onChange={setQuery} onSubmit={() => void submitQuery()} loading={loading} />
            </div>
          </div>
        </main>

        {/* ── RIGHT INSIGHTS PANEL ─────────────────────────── */}
        <aside
          className="sidebar-glass-right hide-below-xl anim-slide-right"
          style={{ width: 304, flexShrink: 0, flexDirection: "column", overflow: "hidden" }}
        >
          {/* Header */}
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 9, padding: "15px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <MessageSquareText size={14} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--txt-2)", fontFamily: "var(--font-display)" }}>Insights &amp; Verification</span>
          </div>

          {/* Tabs */}
          <div className="insight-tabs-bar" style={{ flexShrink: 0 }}>
            {INSIGHT_TABS.map(({ key, label, icon }) => (
              <button key={key} className={`insight-tab-btn ${insightTab === key ? "active" : ""}`} onClick={() => setInsightTab(key)}>
                {icon} {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
            {!response && !loading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "36px 12px", textAlign: "center" }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 14,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.14)",
                  backdropFilter: "blur(8px)",
                }}>
                  <Sparkles size={20} style={{ color: "var(--txt-4)" }} />
                </div>
                <p style={{ fontSize: 12.5, lineHeight: 1.7, color: "var(--txt-3)", maxWidth: 200 }}>
                  Evidence, conflicts, and structured facts appear after your first query
                </p>
              </div>
            ) : renderInsight()}
          </div>

          {/* Stats footer */}
          {response && (
            <div style={{ flexShrink: 0, display: "flex", gap: 7, padding: "11px 14px", borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.25)" }}>
              {[
                { label: "Sources",   val: response.sources?.length ?? 0,         color: "#A5B4FC" },
                { label: "Conflicts", val: (response.conflictsPanel ?? []).length, color: (response.conflictsPanel ?? []).length > 0 ? "#FCD34D" : "var(--txt-3)" },
                { label: "Tools",     val: (response.toolUsed ?? []).length,       color: "#A5B4FC" },
              ].map(({ label, val, color }) => (
                <div key={label} className="stat-glass">
                  <span style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--txt-4)", fontFamily: "var(--font-display)" }}>{label}</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color, fontFamily: "var(--font-display)", lineHeight: 1, textShadow: `0 0 16px ${color}55` }}>{val}</span>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
