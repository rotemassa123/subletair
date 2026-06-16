import React, { createContext, useContext, useEffect, useState } from "react";
import * as api from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!api.getToken()) { setReady(true); return; }
    api.me().then(setUser).catch(() => api.setToken(null)).finally(() => setReady(true));
  }, []);

  // Flip to logged-out when any authenticated request reports an expired token.
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener("subletair:unauthorized", onUnauthorized);
    return () => window.removeEventListener("subletair:unauthorized", onUnauthorized);
  }, []);

  async function login(email, password) {
    const { token, user } = await api.login({ email, password });
    api.setToken(token);
    setUser(user);
  }
  async function register(name, email, password) {
    const { token, user } = await api.register({ name, email, password });
    api.setToken(token);
    setUser(user);
  }
  function logout() {
    api.setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
