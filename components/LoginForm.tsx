"use client";

import { useState } from "react";
import { LockKeyhole, Mail, User, ShieldCheck, ArrowRight, Brain } from "lucide-react";
import { useRouter } from "next/navigation";

function GlassInput({ label, type, value, onChange, placeholder, icon }: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string; icon: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7, fontSize: 12.5, fontWeight: 500, color: "var(--txt-2)" }}>
        <span style={{ color: "#A5B4FC" }}>{icon}</span> {label}
      </label>
      <input
        type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", padding: "11px 14px", borderRadius: 11,
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${focused ? "rgba(99,102,241,0.55)" : "rgba(255,255,255,0.09)"}`,
          color: "var(--txt-1)", fontSize: 13.5, outline: "none",
          backdropFilter: "blur(8px)",
          boxShadow: focused ? "0 0 0 3px rgba(99,102,241,0.12), 0 0 20px rgba(99,102,241,0.1)" : "none",
          transition: "all 160ms ease",
        }}
      />
    </div>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim() || !accepted) return;
    localStorage.setItem("demo-auth-user", JSON.stringify({ name, email, loggedIn: true }));
    router.push("/");
  }

  const isDisabled = !name.trim() || !email.trim() || !password.trim() || !accepted;

  return (
    <div className="anim-float-up" style={{
      width: "100%", maxWidth: 440,
      background: "rgba(8,11,22,0.75)",
      backdropFilter: "blur(32px) saturate(180%)",
      border: "1px solid rgba(255,255,255,0.11)",
      borderRadius: 20,
      boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.07)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "26px 28px 22px", borderBottom: "1px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16, margin: "0 auto 16px",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(167,139,250,0.2))",
          border: "1px solid rgba(99,102,241,0.35)",
          backdropFilter: "blur(8px)",
          boxShadow: "0 0 32px rgba(99,102,241,0.3)",
          animation: "glow-pulse 3s ease-in-out infinite",
        }}>
          <Brain size={22} style={{ color: "#A5B4FC" }} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.04em", color: "var(--txt-1)", fontFamily: "var(--font-display)" }}>
          Sign in to Memora <span className="grad-text">AI</span>
        </h2>
        <p style={{ marginTop: 7, fontSize: 13, color: "var(--txt-3)", lineHeight: 1.6 }}>
          Demo access — use any credentials to continue
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} style={{ padding: "22px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
        <GlassInput label="Your Name" type="text" value={name} onChange={setName} placeholder="Enter your name" icon={<User size={13} />} />
        <GlassInput label="Email Address" type="email" value={email} onChange={setEmail} placeholder="Enter email address" icon={<Mail size={13} />} />
        <GlassInput label="Password" type="password" value={password} onChange={setPassword} placeholder="Set a demo password" icon={<LockKeyhole size={13} />} />

        <label style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: "12px 14px", borderRadius: 11, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.18)", cursor: "pointer", backdropFilter: "blur(8px)" }}>
          <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)}
            style={{ marginTop: 2, accentColor: "#6366F1", width: 14, height: 14, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "var(--txt-3)", lineHeight: 1.65 }}>
            I consent to accessing demo data and understand this is a mock frontend login flow.
          </span>
        </label>

        <button type="submit" disabled={isDisabled}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
            padding: "12px 18px", borderRadius: 12, border: "none",
            background: isDisabled ? "rgba(99,102,241,0.18)" : "linear-gradient(135deg, #6366F1, #818CF8)",
            color: isDisabled ? "rgba(255,255,255,0.35)" : "#fff",
            fontSize: 14, fontWeight: 600, cursor: isDisabled ? "not-allowed" : "pointer",
            fontFamily: "var(--font-display)",
            boxShadow: isDisabled ? "none" : "0 0 20px rgba(99,102,241,0.45), 0 4px 12px rgba(0,0,0,0.3)",
            transition: "all 160ms ease",
          }}
          onMouseEnter={e => { if (!isDisabled) { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 28px rgba(99,102,241,0.6), 0 6px 16px rgba(0,0,0,0.3)"; } }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = isDisabled ? "none" : "0 0 20px rgba(99,102,241,0.45), 0 4px 12px rgba(0,0,0,0.3)"; }}
        >
          <ShieldCheck size={15} /> Sign in to Memora <ArrowRight size={14} />
        </button>
      </form>
    </div>
  );
}
