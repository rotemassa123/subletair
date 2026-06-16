import React from "react";

const ROWS = [
  { key: "adults", label: "Adults", hint: "Ages 13 or above", min: 1 },
  { key: "children", label: "Children", hint: "Ages 2–12", min: 0 },
  { key: "infants", label: "Infants", hint: "Under 2", min: 0 },
  { key: "pets", label: "Pets", hint: "Service animals always welcome", min: 0 },
];

/** Guest steppers. `value` is { adults, children, infants, pets }. */
export function GuestsFlyout({ value, onChange }) {
  function set(key, next) { onChange({ ...value, [key]: next }); }
  return (
    <div style={panel}>
      {ROWS.map((r, i) => (
        <div key={r.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderTop: i ? "1px solid var(--color-hairline-soft)" : "none" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--color-ink)" }}>{r.label}</div>
            <div style={{ fontSize: 13, color: "var(--color-muted)" }}>{r.hint}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button type="button" aria-label={`Decrease ${r.label}`} className="sl-stepper-btn"
              disabled={value[r.key] <= r.min} onClick={() => set(r.key, Math.max(r.min, value[r.key] - 1))} style={stepBtn(value[r.key] <= r.min)}>–</button>
            <span style={{ minWidth: 18, textAlign: "center", fontSize: 15 }}>{value[r.key]}</span>
            <button type="button" aria-label={`Increase ${r.label}`} className="sl-stepper-btn"
              onClick={() => set(r.key, value[r.key] + 1)} style={stepBtn(false)}>+</button>
          </div>
        </div>
      ))}
    </div>
  );
}

const panel = { padding: "8px 24px 16px", width: 360, maxWidth: "90vw" };
function stepBtn(disabled) {
  return {
    width: 32, height: 32, borderRadius: "var(--radius-full)",
    border: "1px solid var(--color-border-strong)", background: "var(--color-canvas)",
    color: disabled ? "var(--color-muted-soft)" : "var(--color-ink)",
    cursor: disabled ? "not-allowed" : "pointer", fontSize: 18, lineHeight: 1,
  };
}
