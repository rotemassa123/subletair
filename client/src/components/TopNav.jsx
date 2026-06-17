import React from "react";
import { SearchBar } from "./SearchBar.jsx";
import { AccountMenu } from "./AccountMenu.jsx";

/**
 * Top navigation bar. Wordmark flush left, the Where / When / Who search bar
 * centered, account utilities flush right. 80px tall with a 1px bottom hairline.
 */
export function TopNav({
  logoSrc = "/logo.svg",
  onSearch,
  user,
  onLogin,
  onSignup,
  onLogout,
  onHostingClick,
  onLanguage,
  onComingSoon,
  style,
  ...rest
}) {
  return (
    <header
      className="sl-header"
      style={{
        height: 96,
        background: "linear-gradient(180deg, #ffffff 0%, #fff5f6 100%)",
        borderBottom: "1px solid var(--color-hairline)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 24,
        padding: "0 48px",
        fontFamily: "var(--font-family-base)",
        ...style,
      }}
      {...rest}
    >
      <img src={logoSrc} alt="Subletair" height="30" style={{ flex: "0 0 auto" }} />

      <div className="sl-topnav__search" style={{ flex: "1 1 auto", display: "flex", justifyContent: "center", minWidth: 0 }}>
        <SearchBar onSearch={onSearch} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>
        <button type="button" className="sl-pill sl-topnav__host" style={textPill} onClick={onHostingClick}>
          {user ? "Switch to hosting" : "Become a host"}
        </button>
        <button type="button" aria-label="Language and currency" className="sl-pill" style={iconDisc} onClick={onLanguage}><GlobeGlyph /></button>
        <AccountMenu
          user={user}
          onLogin={onLogin}
          onSignup={onSignup}
          onLogout={onLogout}
          onHosting={onHostingClick}
          onComingSoon={onComingSoon}
        />
      </div>
    </header>
  );
}

const textPill = {
  border: "none", cursor: "pointer",
  fontFamily: "var(--font-family-base)", fontSize: 14, fontWeight: 600,
  color: "var(--color-ink)", padding: "10px 14px", borderRadius: "var(--radius-full)",
  whiteSpace: "nowrap",
};
const iconDisc = {
  width: 40, height: 40, borderRadius: "var(--radius-full)", border: "none",
  cursor: "pointer", color: "var(--color-ink)",
  display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto",
};

function GlobeGlyph() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14 0 18M12 3c-3 3.5-3 14 0 18"/></svg>);
}
