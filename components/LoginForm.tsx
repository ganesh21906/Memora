"use client";

import { useState } from "react";
import { LockKeyhole, Mail, User, ShieldCheck, ArrowRight, Brain } from "lucide-react";
import { useRouter } from "next/navigation";

function InputField({
  label, type, value, onChange, placeholder, icon,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string; icon: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, fontSize: 12.5, fontWeight: 500, color: "var(--text-secondary)" }}>
        <span style={{ color: "var(--accent-light)" }}>{icon}</span>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={type} value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 10,
            background: "rgba(102,155,188,0.05)",
            border: `1px solid ${focused ? "rgba(193,18,31,0.55)" : "rgba(102,155,188,0.16)"}`,
            color: "var(--text-primary)", fontSize: 13.5, outline: "none",
            boxShadow: focused ? "0 0 0 3px rgba(193,18,31,0.1)" : "none",
            transition: "all 150ms ease",
          }}
        />
      </div>
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
    <div className="anim-fade-up" style={{
      width: "100%", maxWidth: 440, borderRadius: 16, overflow: "hidden",
      background: "rgba(0,48,73,0.98)", backdropFilter: "blur(20px)",
      border: "1px solid rgba(102,155,188,0.2)",
      boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(102,155,188,0.1)",
    }}>
      {/* Card header */}
      <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid rgba(102,155,188,0.1)", textAlign: "center" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, margin: "0 auto 14px",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg, var(--accent), var(--accent-light))",
          boxShadow: "0 0 24px rgba(193,18,31,0.35)" }}>
          <Brain size={20} color="#fff" />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
          Sign in to Memora AI
        </h2>
        <p style={{ marginTop: 6, fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
          Demo access — use any credentials to continue
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} style={{ padding: "22px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
        <InputField label="Your Name" type="text" value={name} onChange={setName} placeholder="Enter your name" icon={<User size={13} />} />
        <InputField label="Email Address" type="email" value={email} onChange={setEmail} placeholder="Enter email address" icon={<Mail size={13} />} />
        <InputField label="Password" type="password" value={password} onChange={setPassword} placeholder="Set a demo password" icon={<LockKeyhole size={13} />} />

        {/* Consent */}
        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 13px", borderRadius: 10,
          background: "rgba(193,18,31,0.05)", border: "1px solid rgba(193,18,31,0.18)", cursor: "pointer" }}>
          <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)}
            style={{ marginTop: 2, accentColor: "var(--accent)", width: 14, height: 14, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
            I consent to accessing demo data and understand this is a mock frontend login flow.
          </span>
        </label>

        <button type="submit" disabled={isDisabled}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "11px 18px", borderRadius: 10, border: "none",
            background: isDisabled ? "rgba(193,18,31,0.25)" : "var(--accent)",
            color: isDisabled ? "rgba(255,255,255,0.4)" : "#fff",
            fontSize: 13.5, fontWeight: 600, cursor: isDisabled ? "not-allowed" : "pointer",
            boxShadow: isDisabled ? "none" : "0 0 16px rgba(193,18,31,0.35)",
            transition: "all 150ms ease",
          }}>
          <ShieldCheck size={15} />
          Sign in to Memora
          <ArrowRight size={14} />
        </button>
      </form>
    </div>
  );
}
