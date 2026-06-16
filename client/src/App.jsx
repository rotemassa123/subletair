import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { TopNav } from "./components/TopNav.jsx";
import { AuthModal } from "./components/AuthModal.jsx";
import { Marketplace } from "./pages/Marketplace.jsx";
import { Hosting } from "./pages/Hosting.jsx";
import { useAuth } from "./auth/AuthContext.jsx";

export default function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);

  function goHosting() {
    if (!user) return setAuthOpen(true);
    navigate("/hosting");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-canvas)" }}>
      <TopNav
        active="stays"
        user={user}
        onLogin={() => setAuthOpen(true)}
        onLogout={logout}
        onHostingClick={goHosting}
        onSelect={() => navigate("/")}
      />

      <Routes>
        <Route path="/" element={<Marketplace onRequireAuth={() => setAuthOpen(true)} />} />
        <Route path="/hosting" element={<Hosting onRequireAuth={() => setAuthOpen(true)} />} />
      </Routes>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
