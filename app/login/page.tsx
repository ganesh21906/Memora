"use client";

import LoginForm from "@/components/LoginForm";
import { Brain } from "lucide-react";

export default function LoginPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", position: "relative" }}>
      {/* Ambient */}
      <div aria-hidden style={{ pointerEvents: "none", position: "fixed", inset: 0, zIndex: 0,
        background: "radial-gradient(ellipse 800px 500px at 50% 30%, rgba(193,18,31,0.08) 0%, transparent 60%)" }} />

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 28, width: "100%" }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, var(--accent), var(--accent-light))", boxShadow: "0 0 16px rgba(193,18,31,0.4)" }}>
            <Brain size={15} color="#fff" />
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.04em", color: "var(--text-primary)" }}>
            Memora <span className="text-gradient">AI</span>
          </span>
        </div>

        <LoginForm />

        <p style={{ fontSize: 11.5, color: "var(--text-ghost)", textAlign: "center", maxWidth: 360, lineHeight: 1.65 }}>
          For production use, Gmail access requires OAuth 2.0. This demo flow uses local auth only.
        </p>
      </div>
    </main>
  );
}
