import React, { createContext, useContext, useState } from "react";

// Prices are stored in USD; these static rates convert for display only.
const RATES = { USD: 1, EUR: 0.92, GBP: 0.79, JPY: 157, CAD: 1.37, AUD: 1.51 };
export const CURRENCIES = [
  { code: "USD", label: "United States dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British pound", symbol: "£" },
  { code: "JPY", label: "Japanese yen", symbol: "¥" },
  { code: "CAD", label: "Canadian dollar", symbol: "$" },
  { code: "AUD", label: "Australian dollar", symbol: "$" },
];

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(() => localStorage.getItem("subletair_currency") || "USD");
  function setCurrency(code) {
    setCurrencyState(code);
    localStorage.setItem("subletair_currency", code);
  }
  function format(amountUSD) {
    if (amountUSD == null) return "";
    const converted = amountUSD * (RATES[currency] ?? 1);
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency", currency, maximumFractionDigits: currency === "JPY" ? 0 : 0,
      }).format(converted);
    } catch {
      return `$${Math.round(converted)}`;
    }
  }
  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
