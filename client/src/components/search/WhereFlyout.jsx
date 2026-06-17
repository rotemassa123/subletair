import React, { useEffect, useState } from "react";
import { fetchDestinations } from "../../api.js";

/** Destination picker: autocomplete over real listing locations + recent searches. */
export function WhereFlyout({ value, onSelect }) {
  const [destinations, setDestinations] = useState([]);
  const [recent, setRecent] = useState(() => JSON.parse(localStorage.getItem("subletair_recent") || "[]"));

  useEffect(() => { fetchDestinations().then(setDestinations).catch(() => setDestinations([])); }, []);

  const q = (value || "").trim().toLowerCase();
  const matches = q ? destinations.filter((d) => d.toLowerCase().includes(q)) : destinations;

  function choose(d) {
    const next = [d, ...recent.filter((r) => r !== d)].slice(0, 4);
    setRecent(next);
    localStorage.setItem("subletair_recent", JSON.stringify(next));
    onSelect(d);
  }

  return (
    <div style={panel}>
      <button type="button" onClick={() => onSelect("")} style={row}>
        <span style={iconDot}>◎</span> I’m flexible
      </button>
      {!q && recent.length > 0 && (
        <>
          <div style={heading}>Recent searches</div>
          {recent.map((d) => (
            <button key={`r-${d}`} type="button" onClick={() => choose(d)} style={row}><span style={iconDot}>🕘</span> {d}</button>
          ))}
        </>
      )}
      <div style={heading}>Suggested destinations</div>
      {matches.slice(0, 8).map((d) => (
        <button key={d} type="button" onClick={() => choose(d)} style={row}><span style={iconDot}>📍</span> {d}</button>
      ))}
      {matches.length === 0 && <div style={{ ...row, color: "var(--color-muted)", cursor: "default" }}>No matches</div>}
    </div>
  );
}

const panel = { padding: 16, width: 360, maxWidth: "90vw", maxHeight: 420, overflowY: "auto" };
const heading = { fontSize: 12, fontWeight: 700, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "12px 8px 4px" };
const row = {
  display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
  padding: "10px 8px", border: "none", background: "transparent", cursor: "pointer",
  borderRadius: "var(--radius-sm)", fontSize: 15, color: "var(--color-ink)", fontFamily: "var(--font-family-base)",
};
const iconDot = { width: 32, height: 32, borderRadius: "var(--radius-sm)", background: "var(--color-surface-strong)", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" };
