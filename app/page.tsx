"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity, BarChart3, Brain, ChevronDown, Database,
  FileSpreadsheet, FileText, FileType2, History, LogOut,
  Mail, MessageCircle, MessageSquareText, Sparkles,
  CheckCircle2, AlertTriangle, Search,
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

const EXAMPLE_QUERIES = [
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
  { name: "PDF Documents", tool: "search_pdf",      color: "var(--orange)", bg: "rgba(249,115,22,0.08)", bdr: "rgba(249,115,22,0.2)", icon: <FileType2 size={12} /> },
  { name: "CSV Files",     tool: "search_csv",      color: "var(--green)",  bg: "rgba(34,197,94,0.08)",  bdr: "rgba(34,197,94,0.2)",  icon: <FileSpreadsheet size={12} /> },
  { name: "Text & Notes",  tool: "search_txt",      color: "var(--violet)", bg: "rgba(139,92,246,0.08)", bdr: "rgba(139,92,246,0.2)", icon: <FileText size={12} /> },
  { name: "Gmail / Email", tool: "search_email",    color: "var(--red)",    bg: "rgba(239,68,68,0.08)",  bdr: "rgba(239,68,68,0.2)",  icon: <Mail size={12} /> },
  { name: "WhatsApp",      tool: "search_whatsapp", color: "var(--teal)",   bg: "rgba(20,184,166,0.08)", bdr: "rgba(20,184,166,0.2)", icon: <MessageCircle size={12} /> },
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
    const id = setInterval(() => setStep((s) => (s + 1) % SCAN_STEPS.length), 900);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
      <div style={{ display: "flex", gap: 4 }}>
        {[0,1,2].map((i) => (
          <span key={i} style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", animation: `bounce-dot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
      <span style={{ fontSize: 12.5, color: "var(--accent-light)" }}>{SCAN_STEPS[step]}</span>
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

  const menuRef  = useRef<HTMLDivElement>(null);
  const usageRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    if (typeof window !== "undefined") localStorage.removeItem("demo-auth-user");
    setShowUserMenu(false);
  }

  const sourceUsed = new Set(response?.toolUsed ?? []);
  const tokenPct = Math.min(100, (usageData.total_tokens / usageData.daily_token_limit) * 100);
  const tokenBarColor = tokenPct > 80 ? "var(--red)" : tokenPct > 50 ? "var(--amber)" : "var(--accent)";

  function renderInsightContent() {
    switch (insightTab) {
      case "evidence": return <EvidenceCards sources={response?.sources ?? []} />;
      case "conflicts": return <ConflictPanel conflicts={response?.conflictsPanel ?? []} />;
      case "truth":
        return response?.structuredTruth
          ? <StructuredTruthPanel truth={response.structuredTruth} />
          : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "32px 16px", textAlign: "center" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle2 size={16} style={{ color: "var(--text-ghost)" }} />
              </div>
              <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Ask a question to extract structured facts</p>
            </div>
          );
      case "summary":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p className="section-label" style={{ marginBottom: 4 }}>Session Summary</p>
            {[
              { label: "Total Queries",  val: totalQueries },
              { label: "Files Indexed",  val: sourceStats.total },
              { label: "Sources Used",   val: (response?.toolUsed ?? []).length },
              { label: "Tokens Used",    val: fmtTokens(usageData.total_tokens) },
            ].map(({ label, val }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderRadius: 9, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.055)" }}>
                <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--accent-light)", fontFamily: "var(--font-mono)" }}>{val}</span>
              </div>
            ))}
            {(response?.toolUsed ?? []).length > 0 && (
              <div style={{ padding: "10px 12px", borderRadius: 9, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.055)" }}>
                <p className="section-label" style={{ marginBottom: 8 }}>Sources Searched</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {(response?.toolUsed ?? []).map((t) => (
                    <span key={t} className="badge badge-accent">{t.replace("search_", "").toUpperCase()}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "var(--bg-base)" }}>

      {/* Ambient */}
      <div aria-hidden style={{ pointerEvents: "none", position: "fixed", inset: 0, zIndex: 0,
        background: "radial-gradient(ellipse 900px 500px at 20% -5%, rgba(91,110,245,0.07) 0%, transparent 60%), radial-gradient(ellipse 600px 400px at 85% 105%, rgba(139,92,246,0.04) 0%, transparent 60%)" }} />

      {/* ── TOPBAR ────────────────────────────────────────────── */}
      <header style={{ position: "relative", zIndex: 20, height: 50, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 18px", flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,0.055)",
        background: "rgba(8,11,18,0.92)", backdropFilter: "blur(20px)" }}>

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, var(--accent), var(--accent-light))", boxShadow: "0 0 12px rgba(91,110,245,0.4)" }}>
            <Brain size={13} color="#fff" />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text-primary)" }}>
            Memora <span className="text-gradient">AI</span>
          </span>
          <span className="badge badge-accent" style={{ marginLeft: 2 }}>Personal Executive</span>
        </div>

        {/* Right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Online */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99,
            background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.17)" }}>
            <span className="status-dot" />
            <span style={{ fontSize: 11, fontWeight: 500, color: "#86EFAC" }}>Online</span>
          </div>

          {/* Usage */}
          <div ref={usageRef} style={{ position: "relative" }}>
            <button
              onClick={() => setShowUsage(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                color: "var(--text-muted)", transition: "all 140ms ease" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}
            >
              <Activity size={12} style={{ color: "var(--accent-light)" }} />
              <span style={{ fontSize: 11.5, fontFamily: "var(--font-mono)" }}>{fmtTokens(usageData.total_tokens)}</span>
              <span style={{ fontSize: 11, color: "var(--text-ghost)" }}>tokens</span>
            </button>

            {showUsage && (
              <div className="anim-fade-up" style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 50,
                width: 240, borderRadius: 12, overflow: "hidden",
                background: "rgba(10,14,22,0.98)", backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 50px rgba(0,0,0,0.65)" }}>
                <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>API Usage</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{usageData.model}</p>
                </div>
                <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Tokens</span>
                      <span style={{ fontSize: 11.5, fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--accent-light)" }}>
                        {fmtTokens(usageData.total_tokens)} <span style={{ color: "var(--text-ghost)" }}>/ {fmtTokens(usageData.daily_token_limit)}</span>
                      </span>
                    </div>
                    <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 99, width: `${tokenPct}%`, background: tokenBarColor, transition: "width 500ms ease" }} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {[{ l: "Prompt", v: usageData.prompt_tokens }, { l: "Response", v: usageData.completion_tokens }].map(({ l, v }) => (
                      <div key={l} style={{ borderRadius: 8, padding: "8px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-ghost)", marginBottom: 3 }}>{l}</p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{fmtTokens(v)}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.055)" }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Requests</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{usageData.requests} / {usageData.daily_request_limit.toLocaleString()}</span>
                  </div>
                  <p style={{ fontSize: 10.5, textAlign: "center", color: "var(--text-ghost)" }}>Groq free tier · resets daily</p>
                </div>
              </div>
            )}
          </div>

          {/* Avatar */}
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              onClick={() => setShowUserMenu(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 10px", borderRadius: 8,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                transition: "all 140ms ease" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}
            >
              <div className="avatar" style={{ width: 22, height: 22, fontSize: 10 }}>
                {activeUser.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>{activeUser.name}</span>
              <ChevronDown size={10} style={{ color: "var(--text-ghost)" }} />
            </button>

            {showUserMenu && (
              <div className="anim-fade-up" style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 50,
                width: 200, borderRadius: 12, overflow: "hidden",
                background: "rgba(10,14,22,0.98)", backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 50px rgba(0,0,0,0.65)" }}>
                <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{activeUser.name}</p>
                  <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>{activeUser.email}</p>
                </div>
                <div style={{ padding: 6 }}>
                  <button onClick={handleLogout}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                      borderRadius: 7, background: "transparent", border: "none", color: "#FCA5A5",
                      fontSize: 13, transition: "background 130ms ease" }}
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

      {/* ── 3-COLUMN BODY ──────────────────────────────────────── */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

        {/* ── LEFT SIDEBAR (256px) ─────────────────────────────── */}
        <aside className="lg-hide" style={{
          width: 256, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden",
          background: "rgba(10,14,22,0.8)", backdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(255,255,255,0.055)"
        }}>
          {/* Tab toggle */}
          <div style={{ flexShrink: 0, padding: "12px 12px 8px" }}>
            <div className="tab-bar">
              {(["sources", "history"] as LeftTab[]).map(t => (
                <button key={t} className={`tab-item ${leftTab === t ? "active" : ""}`} onClick={() => setLeftTab(t)}>
                  {t === "sources" ? <><Database size={11} /> Data Hub</> : <><History size={11} /> History</>}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px 12px", display: "flex", flexDirection: "column", gap: 14 }}>
            {leftTab === "sources" ? (
              <>
                <FileUploader compact onStatsChange={setSourceStats} />

                {/* Divider */}
                <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

                {/* Connected sources */}
                <div>
                  <p className="section-label" style={{ marginBottom: 8 }}>Connected Sources</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {DATA_SOURCES.map(src => {
                      const active = sourceUsed.has(src.tool);
                      return (
                        <div key={src.name} className="source-row" style={{ background: active ? src.bg : "transparent" }}>
                          <div style={{
                            width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: active ? `${src.color}18` : "rgba(255,255,255,0.04)",
                            border: `1px solid ${active ? src.bdr : "rgba(255,255,255,0.07)"}`,
                            color: active ? src.color : "var(--text-ghost)",
                            transition: "all 200ms ease",
                          }}>
                            {src.icon}
                          </div>
                          <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: active ? "var(--text-secondary)" : "var(--text-muted)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                            {src.name}
                          </span>
                          {active
                            ? <span className="badge" style={{ background: `${src.color}18`, color: src.color, borderColor: src.bdr, flexShrink: 0 }}>Used</span>
                            : <span style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.07)", flexShrink: 0 }} />
                          }
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: "flex", gap: 6 }}>
                  {[{ label: "Queries", val: totalQueries }, { label: "Files", val: sourceStats.total }].map(({ label, val }) => (
                    <div key={label} className="stat-chip">
                      <span style={{ fontSize: 10.5, color: "var(--text-ghost)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
                      <span style={{ fontSize: 20, fontWeight: 700, color: "var(--accent-light)", fontFamily: "var(--font-mono)", lineHeight: 1 }}>{val}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* History */
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <p className="section-label" style={{ marginBottom: 4 }}>Recent Queries</p>
                {recentQueries.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "32px 16px", textAlign: "center" }}>
                    <History size={22} style={{ color: "var(--text-ghost)" }} />
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Your history will appear here</p>
                  </div>
                ) : recentQueries.map(({ q, t }) => (
                  <button key={q} onClick={() => void submitQuery(q)}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 10px", borderRadius: 9,
                      background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.055)",
                      transition: "all 140ms ease", cursor: "pointer" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.055)"; }}>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{q}</p>
                    <p style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 3, fontFamily: "var(--font-mono)" }}>{t}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User footer */}
          <div style={{ flexShrink: 0, padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.055)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div className="avatar">{activeUser.name.charAt(0).toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{activeUser.name}</p>
                <p style={{ fontSize: 10.5, color: "var(--text-muted)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{activeUser.email}</p>
              </div>
              <button className="icon-btn" onClick={handleLogout} title="Sign out"
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#FCA5A5"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}>
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </aside>

        {/* ── CENTER CHAT ──────────────────────────────────────── */}
        <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            <div style={{ maxWidth: 780, margin: "0 auto", padding: "28px 24px", display: "flex", flexDirection: "column", gap: 0 }}>

              {/* Welcome */}
              {messages.length === 0 && !loading && (
                <div className="anim-fade-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, padding: "32px 0 40px", textAlign: "center" }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
                    background: "linear-gradient(135deg, var(--accent), var(--accent-light))",
                    boxShadow: "0 0 32px rgba(91,110,245,0.3)" }}>
                    <Brain size={24} color="#fff" />
                  </div>
                  <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.04em", lineHeight: 1.2, marginBottom: 10 }}>
                      What would you like to remember?
                    </h1>
                    <p style={{ fontSize: 14.5, color: "var(--text-muted)", maxWidth: 440, margin: "0 auto" }}>
                      Ask anything across your emails, documents, notes, and data files.
                    </p>
                  </div>

                  <div style={{ width: "100%", maxWidth: 560 }}>
                    <p className="section-label" style={{ marginBottom: 10 }}>Try asking</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                      {EXAMPLE_QUERIES.map(eq => (
                        <button key={eq} onClick={() => void submitQuery(eq)}
                          style={{ textAlign: "left", padding: "11px 13px", borderRadius: 10,
                            background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
                            fontSize: 12.5, color: "var(--text-muted)", transition: "all 150ms ease", cursor: "pointer" }}
                          onMouseEnter={e => {
                            const b = e.currentTarget as HTMLButtonElement;
                            b.style.color = "var(--text-secondary)";
                            b.style.borderColor = "rgba(255,255,255,0.12)";
                            b.style.background = "rgba(255,255,255,0.04)";
                          }}
                          onMouseLeave={e => {
                            const b = e.currentTarget as HTMLButtonElement;
                            b.style.color = "var(--text-muted)";
                            b.style.borderColor = "rgba(255,255,255,0.07)";
                            b.style.background = "rgba(255,255,255,0.025)";
                          }}>
                          <span style={{ color: "var(--accent)", marginRight: 7, fontWeight: 600 }}>→</span>{eq}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Thread */}
              {messages.map(({ q, r, time }, idx) => (
                <div key={idx} className="anim-fade-up" style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 10, animationDelay: `${idx * 30}ms` }}>
                  {/* User */}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div className="bubble-user" style={{ maxWidth: "74%", padding: "10px 14px" }}>
                      <p style={{ fontSize: 13.5, lineHeight: 1.65, color: "var(--text-primary)" }}>{q}</p>
                      <p style={{ marginTop: 4, textAlign: "right", fontSize: 10.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{time}</p>
                    </div>
                  </div>
                  {/* AI */}
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ marginTop: 2, width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "linear-gradient(135deg, var(--accent), var(--accent-light))",
                      boxShadow: "0 0 8px rgba(91,110,245,0.3)" }}>
                      <Brain size={12} color="#fff" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <AnswerPanel response={r} loading={false} error={null} compact />
                    </div>
                  </div>
                </div>
              ))}

              {/* Thinking */}
              {loading && (
                <div className="anim-fade-up" style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                  <div style={{ marginTop: 2, width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "linear-gradient(135deg, var(--accent), var(--accent-light))" }}>
                    <Brain size={12} color="#fff" />
                  </div>
                  <div className="bubble-ai" style={{ flex: 1, padding: "12px 14px" }}>
                    <ThinkingDots />
                  </div>
                </div>
              )}

              {error && (
                <div style={{ padding: "10px 14px", borderRadius: 9, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 16 }}>
                  <p style={{ fontSize: 13, color: "#FCA5A5" }}>{error}</p>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Input bar */}
          <div style={{ flexShrink: 0, padding: "10px 24px 18px",
            borderTop: "1px solid rgba(255,255,255,0.055)",
            background: "rgba(8,11,18,0.75)", backdropFilter: "blur(16px)" }}>
            <div style={{ maxWidth: 780, margin: "0 auto" }}>
              <QueryInput value={query} onChange={setQuery} onSubmit={() => void submitQuery()} loading={loading} />
            </div>
          </div>
        </main>

        {/* ── RIGHT INSIGHTS PANEL (300px) ─────────────────────── */}
        <aside className="xl-hide" style={{
          width: 300, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden",
          background: "rgba(10,14,22,0.8)", backdropFilter: "blur(20px)",
          borderLeft: "1px solid rgba(255,255,255,0.055)"
        }}>
          {/* Header */}
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8, padding: "13px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.055)" }}>
            <MessageSquareText size={13} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)" }}>Insights &amp; Verification</span>
          </div>

          {/* Tabs */}
          <div className="insight-tabs" style={{ flexShrink: 0 }}>
            {INSIGHT_TABS.map(({ key, label, icon }) => (
              <button key={key} className={`insight-tab ${insightTab === key ? "active" : ""}`} onClick={() => setInsightTab(key)}>
                {icon} {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
            {!response && !loading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "36px 16px", textAlign: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(91,110,245,0.07)", border: "1px solid rgba(91,110,245,0.12)" }}>
                  <Sparkles size={18} style={{ color: "var(--text-ghost)" }} />
                </div>
                <p style={{ fontSize: 12.5, lineHeight: 1.65, color: "var(--text-muted)", maxWidth: 200 }}>
                  Evidence, conflicts, and structured facts appear after your first query
                </p>
              </div>
            ) : renderInsightContent()}
          </div>

          {/* Stats footer */}
          {response && (
            <div style={{ flexShrink: 0, display: "flex", gap: 6, padding: "10px 12px",
              borderTop: "1px solid rgba(255,255,255,0.055)", background: "rgba(0,0,0,0.18)" }}>
              {[
                { label: "Sources",   val: response.sources?.length ?? 0,          color: "var(--accent-light)" },
                { label: "Conflicts", val: (response.conflictsPanel ?? []).length,  color: (response.conflictsPanel ?? []).length > 0 ? "var(--amber)" : "var(--text-muted)" },
                { label: "Tools",     val: (response.toolUsed ?? []).length,        color: "var(--accent-light)" },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ flex: 1, textAlign: "center", padding: "8px 6px", borderRadius: 8,
                  background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.055)" }}>
                  <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-ghost)", marginBottom: 2 }}>{label}</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color, fontFamily: "var(--font-mono)", lineHeight: 1 }}>{val}</p>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
