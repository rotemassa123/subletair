import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/styles.css";
import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";
import { CurrencyProvider } from "./currency/CurrencyContext.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CurrencyProvider>
          <App />
        </CurrencyProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
