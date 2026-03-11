"use client";

import LoginForm from "@/components/LoginForm";
import { Brain } from "lucide-react";

export default function LoginPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--space-1)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", position: "relative", overflow: "hidden" }}>
      {/* Aurora */}
      <div className="aurora-bg" aria-hidden>
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
      </div>

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 28, width: "100%" }}>
        {/* Brand */}
        <div className="anim-float-up d-0" style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #6366F1, #A78BFA)", boxShadow: "0 0 20px rgba(99,102,241,0.5)" }}>
            <Brain size={16} color="#fff" />
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.04em", color: "var(--txt-1)", fontFamily: "var(--font-display)" }}>
            Memora <span className="grad-text">AI</span>
          </span>
        </div>

        <LoginForm />

        <p className="anim-float-up d-3" style={{ fontSize: 11.5, color: "var(--txt-4)", textAlign: "center", maxWidth: 360, lineHeight: 1.7 }}>
          For production, Gmail access requires OAuth 2.0. This is a demo-only login flow.
        </p>
      </div>
    </main>
  );
}
