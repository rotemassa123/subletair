import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";

/** Login / register modal over the global scrim. */
export function AuthModal({ open, onClose, initialMode = "login" }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      if (mode === "login") await login(email, password);
      else await register(name, email, password);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div onClick={onClose} className="sl-scrim" style={scrim}>
      <div onClick={(e) => e.stopPropagation()} className="sl-modal" style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: "var(--type-display-sm-size)", fontWeight: 600, margin: 0 }}>
            {mode === "login" ? "Log in" : "Sign up"}
          </h2>
          <button onClick={onClose} aria-label="Close" className="sl-pill" style={closeBtn}>×</button>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "register" && (
            <input className="sl-field" style={field} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          )}
          <input className="sl-field" style={field} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="sl-field" style={field} type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          {error && <span style={{ color: "var(--color-error-text)", fontSize: 14 }}>{error}</span>}
          <button type="submit" disabled={busy} className="sl-btn-primary" style={primaryBtn}>
            {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        <p style={{ fontSize: 14, color: "var(--color-muted)", marginTop: 16, textAlign: "center" }}>
          {mode === "login" ? "New to Subletair? " : "Already have an account? "}
          <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }} style={linkBtn}>
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}

const scrim = {
  position: "fixed", inset: 0, background: "var(--color-scrim-translucent)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
  fontFamily: "var(--font-family-base)",
};
const card = {
  background: "var(--color-canvas)", borderRadius: "var(--radius-md)",
  padding: 24, width: 380, maxWidth: "90vw", boxShadow: "var(--shadow-card)",
};
const field = {
  height: 48, borderRadius: "var(--radius-sm)",
  padding: "0 14px", fontSize: 16, fontFamily: "var(--font-family-base)", outline: "none",
};
const primaryBtn = {
  height: 48, borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer",
  fontSize: 16, fontWeight: 500, fontFamily: "var(--font-family-base)",
};
const closeBtn = { border: "none", background: "transparent", fontSize: 24, cursor: "pointer", lineHeight: 1, color: "var(--color-ink)" };
const linkBtn = { border: "none", background: "transparent", color: "var(--color-ink)", fontWeight: 600, cursor: "pointer", textDecoration: "underline", padding: 0, fontSize: 14 };
