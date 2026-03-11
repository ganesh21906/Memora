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
  { name: "PDF Documents", tool: "search_pdf",      color: "#F97316", bg: "rgba(249,115,22,0.08)", bdr: "rgba(249,115,22,0.22)", icon: <FileType2 size={12} /> },
  { name: "CSV Files",     tool: "search_csv",      color: "#10B981", bg: "rgba(16,185,129,0.08)", bdr: "rgba(16,185,129,0.22)", icon: <FileSpreadsheet size={12} /> },
  { name: "Text & Notes",  tool: "search_txt",      color: "#8B5CF6", bg: "rgba(139,92,246,0.08)", bdr: "rgba(139,92,246,0.22)", icon: <FileText size={12} /> },
  { name: "Gmail / Email", tool: "search_email",    color: "#EF4444", bg: "rgba(239,68,68,0.08)",  bdr: "rgba(239,68,68,0.22)",  icon: <Mail size={12} /> },
  { name: "WhatsApp",      tool: "search_whatsapp", color: "#14B8A6", bg: "rgba(20,184,166,0.08)", bdr: "rgba(20,184,166,0.22)", icon: <MessageCircle size={12} /> },
];

function fmtTime(d: Date) { return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
function fmtTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

const SCAN_STEPS = ["Scanning documents…","Checking emails…","Analyzing notes…","Comparing sources…","Synthesizing answer…"];

function ThinkingDots() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % SCAN_STEPS.length), 900);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
      <div style={{ display: "flex", gap: 4 }}>
        {[0,1,2].map(i => (
          <span key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#818CF8", display:"inline-block",
            animation:`bounce-dot 1.2s ease-in-out ${i*0.2}s infinite` }} />
        ))}
      </div>
      <span style={{ fontSize: 12.5, color: "#A5B4FC" }}>{SCAN_STEPS[step]}</span>
    </div>
  );
}

// Glass surface helpers
const glass = (opacity = 0.55) => ({
  background: `rgba(8,11,22,${opacity})`,
  backdropFilter: "blur(24px) saturate(160%)",
  WebkitBackdropFilter: "blur(24px) saturate(160%)",
});

const pill = (color: string, bg: string, border: string) => ({
  display: "inline-flex", alignItems: "center", gap: 4,
  padding: "2px 8px", borderRadius: 99,
  fontSize: 10.5, fontWeight: 600,
  background: bg, color, border: `1px solid ${border}`,
});

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
    prompt_tokens:0, completion_tokens:0, total_tokens:0,
    requests:0, model:"llama-3.3-70b-versatile",
    daily_token_limit:500_000, daily_request_limit:14_400,
  });

  const menuRef  = useRef<HTMLDivElement>(null);
  const usageRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("demo-auth-user");
      if (raw) {
        const p = JSON.parse(raw) as { name?:string; email?:string };
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
    fetch("/api/usage").then(r=>r.ok?r.json():null).then(d=>d&&setUsageData(d as UsageData)).catch(()=>{});
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);

  async function submitQuery(nextQuery?: string) {
    const q = (nextQuery ?? query).trim();
    if (!q) return;
    setLoading(true); setError(null); setQuery("");
    try {
      const res = await fetch("/api/query", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({query:q}) });
      if (!res.ok) { const p = (await res.json().catch(()=>({}))) as {error?:string}; throw new Error(p.error ?? "Query failed"); }
      const data = (await res.json()) as QueryResponse;
      const ts = fmtTime(new Date());
      setMessages(prev => [...prev, { q, r:data, time:ts }]);
      setResponse(data); setTotalQueries(prev=>prev+1);
      setRecentQueries(prev => [{q,t:ts},...prev.filter(x=>x.q!==q)].slice(0,10));
      setInsightTab("evidence");
      try { const ur=await fetch("/api/usage"); if(ur.ok) setUsageData(await ur.json() as UsageData); } catch{/**/ }
    } catch(err) { setError(err instanceof Error ? err.message : "Unexpected error"); }
    finally { setLoading(false); }
  }

  function handleLogout() {
    if (typeof window !== "undefined") localStorage.removeItem("demo-auth-user");
    setShowUserMenu(false);
  }

  const sourceUsed = new Set(response?.toolUsed ?? []);
  const tokenPct = Math.min(100, (usageData.total_tokens / usageData.daily_token_limit) * 100);
  const tokenColor = tokenPct > 80 ? "#EF4444" : tokenPct > 50 ? "#F59E0B" : "#818CF8";

  // Dropdown shared style
  const dropdownStyle: React.CSSProperties = {
    position:"absolute", right:0, top:"calc(100% + 10px)", zIndex:50,
    borderRadius:14, overflow:"hidden",
    background:"rgba(6,8,18,0.96)", backdropFilter:"blur(32px)",
    WebkitBackdropFilter:"blur(32px)",
    border:"1px solid rgba(255,255,255,0.12)",
    boxShadow:"0 24px 60px rgba(0,0,0,0.7)",
  };

  function renderInsight() {
    switch (insightTab) {
      case "evidence":  return <EvidenceCards sources={response?.sources ?? []} />;
      case "conflicts": return <ConflictPanel conflicts={response?.conflictsPanel ?? []} />;
      case "truth":
        return response?.structuredTruth ? <StructuredTruthPanel truth={response.structuredTruth} /> : (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10, padding:"32px 12px", textAlign:"center" }}>
            <CheckCircle2 size={20} style={{ color:"rgba(255,255,255,0.12)" }} />
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.25)" }}>Ask a question to extract structured facts</p>
          </div>
        );
      case "summary":
        return (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.09em", textTransform:"uppercase", color:"rgba(255,255,255,0.2)", marginBottom:4 }}>Session Overview</p>
            {[
              { label:"Total Queries", val: String(totalQueries) },
              { label:"Files Indexed", val: String(sourceStats.total) },
              { label:"Sources Used",  val: String((response?.toolUsed ?? []).length) },
              { label:"Tokens Used",   val: fmtTokens(usageData.total_tokens) },
            ].map(({label,val}) => (
              <div key={label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 12px", borderRadius:10, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
                <span style={{ fontSize:12.5, color:"rgba(255,255,255,0.4)" }}>{label}</span>
                <span style={{ fontSize:15, fontWeight:700, color:"#A5B4FC" }}>{val}</span>
              </div>
            ))}
          </div>
        );
    }
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", width:"100vw", height:"100vh", overflow:"hidden", background:"#03040A", position:"relative" }}>

      {/* ── AURORA + PERSPECTIVE GRID ───────────────────────── */}
      <div aria-hidden style={{ position:"fixed", inset:0, zIndex:0, overflow:"hidden", pointerEvents:"none" }}>

        {/* ── 6 aurora mesh blobs ── */}
        {/* blob 1 — large violet, top-left anchor */}
        <div style={{ position:"absolute", width:780, height:780, top:-220, left:-140, borderRadius:"50%",
          background:"radial-gradient(circle, #7C3AED 0%, transparent 62%)",
          filter:"blur(80px)", opacity:0.38,
          animation:"aurora-drift 20s ease-in-out infinite" }} />
        {/* blob 2 — cyan, top-right */}
        <div style={{ position:"absolute", width:560, height:560, top:"5%", right:-160, borderRadius:"50%",
          background:"radial-gradient(circle, #0891B2 0%, transparent 62%)",
          filter:"blur(70px)", opacity:0.26,
          animation:"aurora-drift-2 24s ease-in-out infinite" }} />
        {/* blob 3 — indigo, center-bottom */}
        <div style={{ position:"absolute", width:520, height:520, bottom:-80, left:"28%", borderRadius:"50%",
          background:"radial-gradient(circle, #4F46E5 0%, transparent 62%)",
          filter:"blur(68px)", opacity:0.30,
          animation:"aurora-drift-3 28s ease-in-out infinite" }} />
        {/* blob 4 — rose, right-mid */}
        <div style={{ position:"absolute", width:380, height:380, top:"40%", right:"5%", borderRadius:"50%",
          background:"radial-gradient(circle, #BE185D 0%, transparent 62%)",
          filter:"blur(60px)", opacity:0.20,
          animation:"aurora-drift-4 22s ease-in-out infinite" }} />
        {/* blob 5 — teal accent, center-left */}
        <div style={{ position:"absolute", width:320, height:320, top:"55%", left:"8%", borderRadius:"50%",
          background:"radial-gradient(circle, #0D9488 0%, transparent 62%)",
          filter:"blur(56px)", opacity:0.18,
          animation:"aurora-drift-2 30s ease-in-out infinite reverse" }} />
        {/* blob 6 — purple small, center highlight */}
        <div style={{ position:"absolute", width:260, height:260, top:"25%", left:"45%", borderRadius:"50%",
          background:"radial-gradient(circle, #A855F7 0%, transparent 62%)",
          filter:"blur(52px)", opacity:0.16,
          animation:"aurora-drift-3 16s ease-in-out infinite reverse" }} />

        {/* ── Perspective scrolling grid ── */}
        {/* Receding floor grid — perspective container */}
        <div style={{
          position:"absolute", left:"-10%", right:"-10%", bottom:0, height:"65%",
          transformOrigin:"bottom center",
          transform:"perspective(600px) rotateX(55deg)",
          WebkitMaskImage:"linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 80%)",
          maskImage:"linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 80%)",
        }}>
          <div className="grid-scroll-inner" />
        </div>

        {/* flat top grid — very subtle dots on the ceiling */}
        <div style={{ position:"absolute", inset:0,
          backgroundImage:"radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)",
          backgroundSize:"44px 44px" }} />
      </div>

      {/* ── TOPBAR ──────────────────────────────────────────── */}
      <header style={{
        position:"relative", zIndex:20, height:52, flexShrink:0,
        display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px",
        ...glass(0.80),
        borderBottom:"1px solid rgba(255,255,255,0.07)",
        animation:"fadeUp 400ms ease both",
      }}>
        {/* Brand */}
        <div style={{ display:"flex", alignItems:"center", gap:11 }}>
          <div style={{ width:30, height:30, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center",
            background:"linear-gradient(135deg,#6366F1,#A78BFA)",
            boxShadow:"0 0 18px rgba(99,102,241,0.55), 0 0 4px rgba(167,139,250,0.3)" }}>
            <Brain size={14} color="#fff" />
          </div>
          <span style={{ fontSize:17, fontWeight:700, letterSpacing:"-0.03em", fontFamily:"'Syne', sans-serif", color:"#F8FAFF" }}>
            Memora{" "}
            <span style={{ background:"linear-gradient(135deg,#818CF8,#C084FC)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>AI</span>
          </span>
          <span style={{ ...pill("#A5B4FC","rgba(99,102,241,0.15)","rgba(99,102,241,0.3)"), marginLeft:2 }}>Personal Executive</span>
        </div>

        {/* Right */}
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {/* Online */}
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 11px", borderRadius:99,
            background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.20)" }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"#10B981", boxShadow:"0 0 6px #10B981",
              animation:"status-pulse 2.5s ease-in-out infinite", display:"inline-block" }} />
            <span style={{ fontSize:11, fontWeight:500, color:"#6EE7B7" }}>Online</span>
          </div>

          {/* Usage */}
          <div ref={usageRef} style={{ position:"relative" }}>
            <button onClick={() => setShowUsage(v=>!v)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 11px", borderRadius:9,
                background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)",
                color:"rgba(255,255,255,0.4)", cursor:"pointer", transition:"all 150ms ease" }}
              onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.07)"}}
              onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.04)"}}>
              <Activity size={12} style={{ color:"#A5B4FC" }} />
              <span style={{ fontSize:11.5, fontFamily:"monospace" }}>{fmtTokens(usageData.total_tokens)}</span>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.2)" }}>tokens</span>
            </button>
            {showUsage && (
              <div style={{ ...dropdownStyle, width:248 }}>
                <div style={{ padding:"13px 16px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                  <p style={{ fontSize:13, fontWeight:700, color:"#F8FAFF", fontFamily:"'Syne', sans-serif" }}>API Usage</p>
                  <p style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:2, fontFamily:"monospace" }}>{usageData.model}</p>
                </div>
                <div style={{ padding:14, display:"flex", flexDirection:"column", gap:11 }}>
                  <div>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>Tokens</span>
                      <span style={{ fontSize:11.5, fontWeight:600, fontFamily:"monospace", color:"#A5B4FC" }}>
                        {fmtTokens(usageData.total_tokens)} <span style={{ color:"rgba(255,255,255,0.2)" }}>/ {fmtTokens(usageData.daily_token_limit)}</span>
                      </span>
                    </div>
                    <div style={{ height:4, borderRadius:99, background:"rgba(255,255,255,0.06)", overflow:"hidden" }}>
                      <div style={{ height:"100%", borderRadius:99, width:`${tokenPct}%`, background:tokenColor, boxShadow:`0 0 8px ${tokenColor}` }} />
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                    {[{l:"Prompt",v:usageData.prompt_tokens},{l:"Response",v:usageData.completion_tokens}].map(({l,v})=>(
                      <div key={l} style={{ borderRadius:9, padding:"8px 10px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
                        <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.07em", color:"rgba(255,255,255,0.2)", marginBottom:4 }}>{l}</p>
                        <p style={{ fontSize:14, fontWeight:700, color:"rgba(255,255,255,0.6)", fontFamily:"monospace" }}>{fmtTokens(v)}</p>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize:10.5, textAlign:"center", color:"rgba(255,255,255,0.15)" }}>Groq free tier · resets daily</p>
                </div>
              </div>
            )}
          </div>

          {/* Avatar */}
          <div ref={menuRef} style={{ position:"relative" }}>
            <button onClick={() => setShowUserMenu(v=>!v)}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 11px", borderRadius:9,
                background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)",
                cursor:"pointer", transition:"all 150ms ease" }}
              onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.07)"}}
              onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.04)"}}>
              <div style={{ width:22, height:22, borderRadius:"50%", background:"linear-gradient(135deg,#6366F1,#A78BFA)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"#fff",
                boxShadow:"0 0 10px rgba(99,102,241,0.4)", flexShrink:0 }}>
                {activeUser.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize:12, fontWeight:500, color:"rgba(255,255,255,0.6)" }}>{activeUser.name}</span>
              <ChevronDown size={10} style={{ color:"rgba(255,255,255,0.2)" }} />
            </button>
            {showUserMenu && (
              <div style={{ ...dropdownStyle, width:210 }}>
                <div style={{ padding:"13px 16px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                  <p style={{ fontSize:13, fontWeight:700, color:"#F8FAFF", fontFamily:"'Syne', sans-serif" }}>{activeUser.name}</p>
                  <p style={{ fontSize:11.5, color:"rgba(255,255,255,0.3)", marginTop:2 }}>{activeUser.email}</p>
                </div>
                <div style={{ padding:6 }}>
                  <button onClick={handleLogout}
                    style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"8px 10px",
                      borderRadius:8, background:"transparent", border:"none", color:"#FCA5A5", fontSize:13, cursor:"pointer" }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(239,68,68,0.08)"}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="transparent"}}>
                    <LogOut size={12} /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── 3-COL BODY ──────────────────────────────────────── */}
      <div style={{ position:"relative", zIndex:10, display:"flex", flex:1, minHeight:0, overflow:"hidden" }}>

        {/* ── LEFT SIDEBAR ────────────────────────────────── */}
        <aside style={{
          width:290, flexShrink:0, display:"flex", flexDirection:"column", overflow:"hidden",
          ...glass(0.65),
          borderRight:"1px solid rgba(255,255,255,0.07)",
          animation:"slideLeft 450ms cubic-bezier(0.16,1,0.3,1) both",
        }}>
          {/* Tab bar */}
          <div style={{ flexShrink:0, padding:"13px 13px 9px" }}>
            <div style={{ display:"flex", gap:2, padding:3, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:11 }}>
              {(["sources","history"] as LeftTab[]).map(t => (
                <button key={t} onClick={() => setLeftTab(t)}
                  style={{ flex:1, padding:"6px 10px", borderRadius:8, fontSize:12, fontWeight:500,
                    display:"flex", alignItems:"center", justifyContent:"center", gap:5,
                    border: leftTab===t ? "1px solid rgba(99,102,241,0.28)" : "none",
                    background: leftTab===t ? "rgba(99,102,241,0.18)" : "transparent",
                    color: leftTab===t ? "#A5B4FC" : "rgba(255,255,255,0.25)",
                    cursor:"pointer", transition:"all 150ms ease",
                    boxShadow: leftTab===t ? "0 0 12px rgba(99,102,241,0.15)" : "none" }}>
                  {t==="sources" ? <><Database size={11}/>Data Hub</> : <><History size={11}/>History</>}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable */}
          <div style={{ flex:1, overflowY:"auto", padding:"4px 13px 13px", display:"flex", flexDirection:"column", gap:16 }}>
            {leftTab==="sources" ? (
              <>
                <FileUploader compact onStatsChange={setSourceStats} />
                <div style={{ height:1, background:"rgba(255,255,255,0.05)" }} />

                {/* Connected sources */}
                <div>
                  <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.09em", textTransform:"uppercase", color:"rgba(255,255,255,0.2)", marginBottom:9 }}>Connected Sources</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                    {DATA_SOURCES.map(src => {
                      const active = sourceUsed.has(src.tool);
                      return (
                        <div key={src.name} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:10,
                          background: active ? src.bg : "transparent",
                          border:`1px solid ${active ? src.bdr : "transparent"}`,
                          transition:"all 200ms ease" }}>
                          <div style={{ width:28, height:28, borderRadius:8, flexShrink:0,
                            display:"flex", alignItems:"center", justifyContent:"center",
                            background: active ? src.bg : "rgba(255,255,255,0.04)",
                            border:`1px solid ${active ? src.bdr : "rgba(255,255,255,0.08)"}`,
                            color: active ? src.color : "rgba(255,255,255,0.2)",
                            boxShadow: active ? `0 0 10px ${src.bg}` : "none",
                            transition:"all 220ms ease" }}>
                            {src.icon}
                          </div>
                          <span style={{ flex:1, fontSize:12, fontWeight:500,
                            color: active ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.25)",
                            overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
                            {src.name}
                          </span>
                          {active
                            ? <span style={{ ...pill(src.color, src.bg, src.bdr), flexShrink:0 }}>Used</span>
                            : <span style={{ width:5, height:5, borderRadius:"50%", background:"rgba(255,255,255,0.08)", flexShrink:0, display:"inline-block" }} />
                          }
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display:"flex", gap:7 }}>
                  {[{label:"Queries", val:String(totalQueries)},{label:"Files", val:String(sourceStats.total)}].map(({label,val})=>(
                    <div key={label} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2,
                      padding:"11px 10px", background:"rgba(255,255,255,0.03)",
                      border:"1px solid rgba(255,255,255,0.07)", borderRadius:12 }}>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)", textTransform:"uppercase", letterSpacing:"0.08em" }}>{label}</span>
                      <span style={{ fontSize:22, fontWeight:700, color:"#A5B4FC", lineHeight:1,
                        textShadow:"0 0 20px rgba(99,102,241,0.5)", fontFamily:"'DM Sans',sans-serif",
                        fontVariantNumeric:"tabular-nums" }}>{val}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.09em", textTransform:"uppercase", color:"rgba(255,255,255,0.2)", marginBottom:4 }}>Recent Queries</p>
                {recentQueries.length===0 ? (
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10, padding:"32px 12px", textAlign:"center" }}>
                    <History size={24} style={{ color:"rgba(255,255,255,0.1)" }} />
                    <p style={{ fontSize:12, color:"rgba(255,255,255,0.25)" }}>Your history will appear here</p>
                  </div>
                ) : recentQueries.map(({q,t})=>(
                  <button key={q} onClick={() => void submitQuery(q)}
                    style={{ display:"block", width:"100%", textAlign:"left", padding:"10px 12px", borderRadius:11,
                      background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)",
                      cursor:"pointer", transition:"all 140ms ease" }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="rgba(255,255,255,0.12)"}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="rgba(255,255,255,0.07)"}}>
                    <p style={{ fontSize:12, color:"rgba(255,255,255,0.55)", overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{q}</p>
                    <p style={{ fontSize:10.5, color:"rgba(255,255,255,0.2)", marginTop:3 }}>{t}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User footer */}
          <div style={{ flexShrink:0, padding:"11px 13px", borderTop:"1px solid rgba(255,255,255,0.07)", background:"rgba(0,0,0,0.2)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#6366F1,#A78BFA)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff",
                boxShadow:"0 0 12px rgba(99,102,241,0.4)", flexShrink:0 }}>
                {activeUser.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:12.5, fontWeight:600, color:"rgba(255,255,255,0.65)", overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{activeUser.name}</p>
                <p style={{ fontSize:10.5, color:"rgba(255,255,255,0.25)", overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{activeUser.email}</p>
              </div>
              <button onClick={handleLogout}
                style={{ width:28, height:28, borderRadius:7, border:"none", background:"transparent",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color:"rgba(255,255,255,0.25)", cursor:"pointer", transition:"all 150ms ease" }}
                onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color="#FCA5A5";(e.currentTarget as HTMLButtonElement).style.background="rgba(239,68,68,0.1)"}}
                onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color="rgba(255,255,255,0.25)";(e.currentTarget as HTMLButtonElement).style.background="transparent"}}>
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </aside>

        {/* ── CENTER CHAT ──────────────────────────────────── */}
        <main style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", overflow:"hidden",
          animation:"fadeUp 500ms ease both" }}>
          <div style={{ flex:1, overflowY:"auto" }}>
            <div style={{ maxWidth:800, margin:"0 auto", padding:"32px 28px" }}>

              {/* Welcome */}
              {messages.length===0 && !loading && (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:24, padding:"20px 0 32px", textAlign:"center" }}>
                  {/* Pulsing brain */}
                  <div style={{ width:72, height:72, borderRadius:22,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    background:"linear-gradient(135deg,rgba(99,102,241,0.28),rgba(167,139,250,0.18))",
                    border:"1px solid rgba(99,102,241,0.35)",
                    backdropFilter:"blur(16px)",
                    boxShadow:"0 0 40px rgba(99,102,241,0.3),0 0 80px rgba(99,102,241,0.1),inset 0 1px 0 rgba(255,255,255,0.1)",
                    animation:"glowPulse 3s ease-in-out infinite" }}>
                    <Brain size={30} style={{ color:"#A5B4FC" }} />
                  </div>

                  <div>
                    <h1 style={{ fontSize:30, fontWeight:700, color:"#F8FAFF", letterSpacing:"-0.03em", lineHeight:1.15, marginBottom:12, fontFamily:"'Syne', sans-serif" }}>
                      What would you like<br />
                      <span style={{ background:"linear-gradient(135deg,#818CF8,#C084FC)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                        to remember?
                      </span>
                    </h1>
                    <p style={{ fontSize:15, color:"rgba(255,255,255,0.35)", maxWidth:420, margin:"0 auto", lineHeight:1.65 }}>
                      Ask anything across your emails, documents, notes, and data files.
                    </p>
                  </div>

                  {/* Example cards */}
                  <div style={{ width:"100%", maxWidth:580 }}>
                    <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.09em", textTransform:"uppercase", color:"rgba(255,255,255,0.2)", marginBottom:12 }}>Try asking</p>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      {EXAMPLES.map((eq,i)=>(
                        <button key={eq} onClick={()=>void submitQuery(eq)}
                          style={{ textAlign:"left", padding:"12px 14px", borderRadius:13,
                            background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
                            cursor:"pointer", transition:"all 150ms ease",
                            backdropFilter:"blur(12px)",
                            animationDelay:`${i*50}ms` }}
                          onMouseEnter={e=>{
                            const b=e.currentTarget as HTMLButtonElement;
                            b.style.background="rgba(255,255,255,0.06)";
                            b.style.borderColor="rgba(255,255,255,0.14)";
                            b.style.transform="translateY(-1px)";
                          }}
                          onMouseLeave={e=>{
                            const b=e.currentTarget as HTMLButtonElement;
                            b.style.background="rgba(255,255,255,0.03)";
                            b.style.borderColor="rgba(255,255,255,0.08)";
                            b.style.transform="";
                          }}>
                          <span style={{ color:"#818CF8", marginRight:7, fontWeight:700 }}>→</span>
                          <span style={{ fontSize:12.5, color:"rgba(255,255,255,0.4)" }}>{eq}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Message thread */}
              {messages.map(({q,r,time},idx)=>(
                <div key={idx} style={{ marginBottom:22, display:"flex", flexDirection:"column", gap:10,
                  animation:"fadeUp 380ms ease both", animationDelay:`${idx*20}ms` }}>
                  {/* User */}
                  <div style={{ display:"flex", justifyContent:"flex-end" }}>
                    <div style={{ maxWidth:"72%", padding:"11px 15px",
                      background:"rgba(99,102,241,0.16)", backdropFilter:"blur(12px)",
                      border:"1px solid rgba(99,102,241,0.28)", borderRadius:"18px 18px 4px 18px",
                      boxShadow:"0 4px 20px rgba(99,102,241,0.12)" }}>
                      <p style={{ fontSize:14, lineHeight:1.65, color:"#F8FAFF" }}>{q}</p>
                      <p style={{ marginTop:5, textAlign:"right", fontSize:10.5, color:"rgba(165,180,252,0.45)" }}>{time}</p>
                    </div>
                  </div>
                  {/* AI */}
                  <div style={{ display:"flex", gap:11 }}>
                    <div style={{ marginTop:2, width:28, height:28, borderRadius:9, flexShrink:0,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      background:"linear-gradient(135deg,#6366F1,#A78BFA)",
                      boxShadow:"0 0 10px rgba(99,102,241,0.4)" }}>
                      <Brain size={13} color="#fff" />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <AnswerPanel response={r} loading={false} error={null} compact />
                    </div>
                  </div>
                </div>
              ))}

              {/* Thinking */}
              {loading && (
                <div style={{ display:"flex", gap:11, marginBottom:22, animation:"fadeUp 380ms ease both" }}>
                  <div style={{ marginTop:2, width:28, height:28, borderRadius:9, flexShrink:0,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    background:"linear-gradient(135deg,#6366F1,#A78BFA)",
                    boxShadow:"0 0 10px rgba(99,102,241,0.4)" }}>
                    <Brain size={13} color="#fff" />
                  </div>
                  <div style={{ flex:1, padding:"12px 15px",
                    background:"rgba(255,255,255,0.04)", backdropFilter:"blur(16px)",
                    border:"1px solid rgba(255,255,255,0.09)", borderLeft:"2px solid rgba(99,102,241,0.5)",
                    borderRadius:"4px 18px 18px 18px" }}>
                    <ThinkingDots />
                  </div>
                </div>
              )}

              {error && (
                <div style={{ padding:"11px 14px", borderRadius:11, marginBottom:18,
                  background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.22)", backdropFilter:"blur(8px)" }}>
                  <p style={{ fontSize:13, color:"#FCA5A5" }}>{error}</p>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Input */}
          <div style={{ flexShrink:0, padding:"12px 28px 20px",
            borderTop:"1px solid rgba(255,255,255,0.06)",
            background:"rgba(5,7,16,0.7)", backdropFilter:"blur(20px)" }}>
            <div style={{ maxWidth:800, margin:"0 auto" }}>
              <QueryInput value={query} onChange={setQuery} onSubmit={() => void submitQuery()} loading={loading} />
            </div>
          </div>
        </main>

        {/* ── RIGHT PANEL ──────────────────────────────────── */}
        <aside style={{
          width:420, flexShrink:0, display:"flex", flexDirection:"column", overflow:"hidden",
          ...glass(0.65),
          borderLeft:"1px solid rgba(255,255,255,0.07)",
          animation:"slideRight 450ms cubic-bezier(0.16,1,0.3,1) both",
        }}>
          {/* Header */}
          <div style={{ flexShrink:0, display:"flex", alignItems:"center", gap:9, padding:"15px 16px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
            <MessageSquareText size={15} style={{ color:"#818CF8" }} />
            <span style={{ fontSize:14, fontWeight:700, color:"rgba(255,255,255,0.55)", fontFamily:"'Syne', sans-serif" }}>Insights &amp; Verification</span>
          </div>

          {/* Insight tabs */}
          <div style={{ flexShrink:0, display:"flex", borderBottom:"1px solid rgba(255,255,255,0.07)", padding:"0 4px" }}>
            {INSIGHT_TABS.map(({key,label,icon})=>(
              <button key={key} onClick={()=>setInsightTab(key)}
                style={{ flex:1, padding:"11px 6px", fontSize:12.5, fontWeight:500, background:"transparent", border:"none",
                  borderBottom: insightTab===key ? "2px solid #6366F1" : "2px solid transparent",
                  marginBottom:-1, display:"flex", alignItems:"center", justifyContent:"center", gap:5,
                  color: insightTab===key ? "#A5B4FC" : "rgba(255,255,255,0.22)",
                  cursor:"pointer", transition:"all 150ms ease",
                  textShadow: insightTab===key ? "0 0 12px rgba(99,102,241,0.5)" : "none" }}>
                {icon} {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex:1, overflowY:"auto", padding:14 }}>
            {!response && !loading ? (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12, padding:"36px 12px", textAlign:"center" }}>
                <div style={{ width:50, height:50, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center",
                  background:"rgba(99,102,241,0.07)", border:"1px solid rgba(99,102,241,0.14)", backdropFilter:"blur(8px)" }}>
                  <Sparkles size={20} style={{ color:"rgba(255,255,255,0.15)" }} />
                </div>
                <p style={{ fontSize:12.5, lineHeight:1.7, color:"rgba(255,255,255,0.25)", maxWidth:200 }}>
                  Evidence, conflicts, and structured facts appear after your first query
                </p>
              </div>
            ) : renderInsight()}
          </div>

          {/* Stats footer */}
          {response && (
            <div style={{ flexShrink:0, display:"flex", gap:7, padding:"11px 14px",
              borderTop:"1px solid rgba(255,255,255,0.07)", background:"rgba(0,0,0,0.25)" }}>
              {[
                { label:"Sources",   val:String(response.sources?.length ?? 0),          color:"#A5B4FC" },
                { label:"Conflicts", val:String((response.conflictsPanel??[]).length),   color:(response.conflictsPanel??[]).length>0 ? "#FCD34D" : "rgba(255,255,255,0.2)" },
                { label:"Tools",     val:String((response.toolUsed??[]).length),          color:"#A5B4FC" },
              ].map(({label,val,color})=>(
                <div key={label} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2,
                  padding:"9px 8px", background:"rgba(255,255,255,0.025)",
                  border:"1px solid rgba(255,255,255,0.07)", borderRadius:10 }}>
                  <span style={{ fontSize:10.5, textTransform:"uppercase", letterSpacing:"0.08em", color:"rgba(255,255,255,0.2)" }}>{label}</span>
                  <span style={{ fontSize:20, fontWeight:800, color, lineHeight:1, fontFamily:"'DM Sans',sans-serif",
                    textShadow:`0 0 16px ${color}55`, fontVariantNumeric:"tabular-nums" }}>{val}</span>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
