import React, { useState } from "react";
import { CURRENCIES, useCurrency } from "../currency/CurrencyContext.jsx";

const LANGUAGES = [
  { code: "en", label: "English", region: "United States" },
  { code: "es", label: "Español", region: "España" },
  { code: "fr", label: "Français", region: "France" },
  { code: "de", label: "Deutsch", region: "Deutschland" },
  { code: "ja", label: "日本語", region: "日本" },
  { code: "pt", label: "Português", region: "Brasil" },
];

/** Globe modal: language (persisted, sets <html lang>) + currency (live conversion). */
export function LanguageCurrencyModal({ open, onClose }) {
  const { currency, setCurrency } = useCurrency();
  const [tab, setTab] = useState("language");
  const [lang, setLang] = useState(() => localStorage.getItem("subletair_lang") || "en");

  if (!open) return null;

  function chooseLang(code) {
    setLang(code);
    localStorage.setItem("subletair_lang", code);
    document.documentElement.lang = code;
  }

  return (
    <div onClick={onClose} className="sl-scrim" style={scrim}>
      <div onClick={(e) => e.stopPropagation()} className="sl-modal" style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <Tab active={tab === "language"} onClick={() => setTab("language")}>Language and region</Tab>
            <Tab active={tab === "currency"} onClick={() => setTab("currency")}>Currency</Tab>
          </div>
          <button onClick={onClose} aria-label="Close" style={closeBtn}>×</button>
        </div>

        {tab === "language" ? (
          <>
            <p style={note}>Choosing a language updates your preference. Full translation is on the way; the interface stays in English for now.</p>
            <div style={grid}>
              {LANGUAGES.map((l) => (
                <button key={l.code} type="button" onClick={() => chooseLang(l.code)} style={tile(lang === l.code)}>
                  <div style={{ fontWeight: 600 }}>{l.label}</div>
                  <div style={{ fontSize: 13, color: "var(--color-muted)" }}>{l.region}</div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div style={grid}>
            {CURRENCIES.map((c) => (
              <button key={c.code} type="button" onClick={() => setCurrency(c.code)} style={tile(currency === c.code)}>
                <div style={{ fontWeight: 600 }}>{c.label}</div>
                <div style={{ fontSize: 13, color: "var(--color-muted)" }}>{c.code} – {c.symbol}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Tab({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} style={{
      border: "none", background: "transparent", cursor: "pointer", padding: "8px 4px",
      fontSize: 16, fontWeight: 600, color: active ? "var(--color-ink)" : "var(--color-muted)",
      borderBottom: active ? "2px solid var(--color-ink)" : "2px solid transparent", fontFamily: "var(--font-family-base)",
    }}>{children}</button>
  );
}

const scrim = { position: "fixed", inset: 0, background: "var(--color-scrim-translucent)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, fontFamily: "var(--font-family-base)" };
const card = { background: "var(--color-canvas)", borderRadius: "var(--radius-md)", padding: 24, width: 720, maxWidth: "92vw", maxHeight: "80vh", overflowY: "auto", boxShadow: "var(--shadow-card)" };
const note = { fontSize: 14, color: "var(--color-muted)", margin: "0 0 16px" };
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 };
const closeBtn = { border: "none", background: "transparent", fontSize: 24, cursor: "pointer", lineHeight: 1, color: "var(--color-ink)" };
function tile(active) {
  return {
    textAlign: "left", padding: "12px 14px", borderRadius: "var(--radius-sm)", cursor: "pointer",
    background: active ? "var(--color-surface-soft)" : "var(--color-canvas)",
    border: `1px solid ${active ? "var(--color-ink)" : "var(--color-hairline)"}`,
    fontFamily: "var(--font-family-base)", color: "var(--color-ink)",
  };
}
