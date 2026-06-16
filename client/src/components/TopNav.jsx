import React from "react";
import { Badge } from "./Badge.jsx";

/**
 * Top navigation bar. Wordmark flush left, the three product tabs (Stays /
 * Experiences / Services) centered with 32px glyphs and "NEW" badges, account
 * utilities flush right. 80px tall with a 1px bottom hairline.
 */
export function TopNav({
  logoSrc = "/logo.svg",
  products = [
    { key: "stays", label: "Stays", icon: "stay" },
    { key: "experiences", label: "Experiences", icon: "bulb", isNew: true },
    { key: "services", label: "Services", icon: "bell", isNew: true },
  ],
  active = "stays",
  onSelect,
  user,
  onLogin,
  onLogout,
  onHostingClick,
  style,
  ...rest
}) {
  return (
    <header
      className="sl-header"
      style={{
        height: 80,
        background: "var(--color-canvas)",
        borderBottom: "1px solid var(--color-hairline)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        fontFamily: "var(--font-family-base)",
        ...style,
      }}
      {...rest}
    >
      <img src={logoSrc} alt="Subletair" height="30" style={{ flex: "0 0 auto" }} />

      <nav className="sl-topnav__products" style={{ display: "flex", gap: 8 }}>
        {products.map((p) => {
          const isActive = p.key === active;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => onSelect && onSelect(p.key)}
              className="sl-nav-tab"
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "10px 12px 8px",
                border: "none",
                cursor: "pointer",
                color: isActive ? "var(--color-ink)" : "var(--color-muted)",
              }}
            >
              {p.isNew && (
                <span style={{ position: "absolute", top: -2, right: -2 }}>
                  <Badge tone="new">New</Badge>
                </span>
              )}
              <ProductGlyph name={p.icon} active={isActive} />
              <span style={{ fontSize: "var(--type-nav-link-size)", fontWeight: 600 }}>{p.label}</span>
              <span
                style={{
                  height: 2,
                  width: "100%",
                  borderRadius: 2,
                  background: isActive ? "var(--color-ink)" : "transparent",
                }}
              />
            </button>
          );
        })}
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>
        <button type="button" className="sl-pill sl-topnav__host" style={textPill} onClick={onHostingClick}>
          {user ? "Switch to hosting" : "Become a host"}
        </button>
        <button type="button" aria-label="Language" className="sl-pill" style={iconDisc}><GlobeGlyph /></button>
        {user ? (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{
              width: 32, height: 32, borderRadius: "var(--radius-full)",
              background: "var(--color-primary)", color: "#fff", display: "inline-flex",
              alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600,
            }}>{user.name.charAt(0).toUpperCase()}</span>
            <button type="button" className="sl-pill" style={textPill} onClick={onLogout}>Log out</button>
          </div>
        ) : (
          <button type="button" className="sl-account" style={accountPill} onClick={onLogin}>
            <MenuGlyph />
            <span style={{
              width: 30, height: 30, borderRadius: "var(--radius-full)",
              background: "var(--color-muted)", color: "#fff", display: "inline-flex",
              alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600,
            }}><PersonGlyph /></span>
          </button>
        )}
      </div>
    </header>
  );
}

const textPill = {
  border: "none", cursor: "pointer",
  fontFamily: "var(--font-family-base)", fontSize: 14, fontWeight: 600,
  color: "var(--color-ink)", padding: "10px 14px", borderRadius: "var(--radius-full)",
};
const iconDisc = {
  width: 40, height: 40, borderRadius: "var(--radius-full)", border: "none",
  cursor: "pointer", color: "var(--color-ink)",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
};
const accountPill = {
  display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 6px 5px 12px",
  borderRadius: "var(--radius-full)", border: "1px solid var(--color-hairline)",
  cursor: "pointer", color: "var(--color-ink)",
};

function ProductGlyph({ name }) {
  const common = { width: 26, height: 26, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "bulb")
    return (<svg viewBox="0 0 24 24" {...common}><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.45 1 1.15 1 1.95v.15h5v-.15c0-.8.4-1.5 1-1.95A6 6 0 0 0 12 3z"/><path d="M9.5 19h5M10.5 21h3"/></svg>);
  if (name === "bell")
    return (<svg viewBox="0 0 24 24" {...common}><path d="M6 16V10a6 6 0 1112 0v6l1.5 2H4.5L6 16z"/><path d="M10 21h4"/></svg>);
  return (<svg viewBox="0 0 24 24" {...common}><path d="M3 11l9-7 9 7"/><path d="M5 10v9h14v-9"/><path d="M10 19v-5h4v5"/></svg>);
}
function GlobeGlyph() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14 0 18M12 3c-3 3.5-3 14 0 18"/></svg>);
}
function MenuGlyph() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>);
}
function PersonGlyph() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6z"/></svg>);
}
