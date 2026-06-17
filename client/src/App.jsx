import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { TopNav } from "./components/TopNav.jsx";
import { AuthModal } from "./components/AuthModal.jsx";
import { LanguageCurrencyModal } from "./components/LanguageCurrencyModal.jsx";
import { Marketplace } from "./pages/Marketplace.jsx";
import { Hosting } from "./pages/Hosting.jsx";
import { useAuth } from "./auth/AuthContext.jsx";

export default function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [langOpen, setLangOpen] = useState(false);
  const [search, setSearch] = useState({ location: "", checkIn: "", checkOut: "", guests: 0 });
  const [toast, setToast] = useState(null);

  function openAuth(mode) { setAuthMode(mode); setAuthOpen(true); }
  function goHosting() { if (!user) return openAuth("login"); navigate("/hosting"); }
  function comingSoon(label) {
    setToast(`${label} is coming soon`);
    setTimeout(() => setToast(null), 2200);
  }
  function runSearch(s) { setSearch(s); navigate("/"); }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-canvas)" }}>
      <TopNav
        onSearch={runSearch}
        user={user}
        onLogin={() => openAuth("login")}
        onSignup={() => openAuth("register")}
        onLogout={logout}
        onHostingClick={goHosting}
        onLanguage={() => setLangOpen(true)}
        onComingSoon={comingSoon}
      />

      <Routes>
        <Route path="/" element={
          <Marketplace search={search} onRequireAuth={() => openAuth("login")} />
        } />
        <Route path="/hosting" element={<Hosting onRequireAuth={() => openAuth("login")} />} />
      </Routes>

      {authOpen && <AuthModal open onClose={() => setAuthOpen(false)} initialMode={authMode} />}
      <LanguageCurrencyModal open={langOpen} onClose={() => setLangOpen(false)} />
      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "var(--color-ink)", color: "var(--color-on-dark)", padding: "12px 20px", borderRadius: "var(--radius-full)", fontSize: 14, zIndex: 200, boxShadow: "var(--shadow-card)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
