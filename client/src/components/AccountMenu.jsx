import React, { useEffect, useRef, useState } from "react";

/**
 * Account dropdown. Auth-aware: logged-out shows auth + help; logged-in shows
 * wishlists/trips/messages, hosting, settings, and log out. Items without a real
 * destination call onComingSoon(label).
 */
export function AccountMenu({ user, onLogin, onSignup, onLogout, onHosting, onComingSoon }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function act(fn) { setOpen(false); fn && fn(); }
  const soon = (label) => () => onComingSoon && onComingSoon(label);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" className="sl-account" style={trigger} onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
        <MenuGlyph />
        {user ? (
          <span style={avatar}>{user.name.charAt(0).toUpperCase()}</span>
        ) : (
          <span style={{ ...avatar, background: "var(--color-muted)" }}><PersonGlyph /></span>
        )}
      </button>

      {open && (
        <div className="sl-menu" role="menu">
          {user ? (
            <>
              <button role="menuitem" className="sl-menu__item is-strong" onClick={() => act(soon("Wishlists"))}>Wishlists</button>
              <button role="menuitem" className="sl-menu__item" onClick={() => act(soon("Trips"))}>Trips</button>
              <button role="menuitem" className="sl-menu__item" onClick={() => act(soon("Messages"))}>Messages</button>
              <div className="sl-menu__divider" />
              <button role="menuitem" className="sl-menu__item" onClick={() => act(onHosting)}>Switch to hosting</button>
              <button role="menuitem" className="sl-menu__item" onClick={() => act(soon("Account settings"))}>Account settings</button>
              <div className="sl-menu__divider" />
              <button role="menuitem" className="sl-menu__item" onClick={() => act(onLogout)}>Log out</button>
            </>
          ) : (
            <>
              <button role="menuitem" className="sl-menu__item is-strong" onClick={() => act(onSignup)}>Sign up</button>
              <button role="menuitem" className="sl-menu__item" onClick={() => act(onLogin)}>Log in</button>
              <div className="sl-menu__divider" />
              <button role="menuitem" className="sl-menu__item" onClick={() => act(soon("Help Center"))}>Help Center</button>
              <button role="menuitem" className="sl-menu__item" onClick={() => act(onHosting)}>Become a host</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const trigger = {
  display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 6px 5px 12px",
  borderRadius: "var(--radius-full)", border: "1px solid var(--color-hairline)",
  cursor: "pointer", color: "var(--color-ink)", background: "var(--color-canvas)",
};
const avatar = {
  width: 30, height: 30, borderRadius: "var(--radius-full)", background: "var(--color-primary)",
  color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600,
};
function MenuGlyph() { return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>); }
function PersonGlyph() { return (<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6z"/></svg>); }
