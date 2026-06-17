import React from "react";

/**
 * Horizontal category strip beneath the search bar. Inactive labels are muted;
 * the active label is ink with a 2px underline rule — mirroring the product-tab
 * treatment in the top nav.
 */
export function CategoryStrip({ categories, active = "all", onSelect }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        overflowX: "auto",
        padding: "16px 0 8px",
        fontFamily: "var(--font-family-base)",
      }}
    >
      {categories.map((c) => {
        const isActive = c.key === active;
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => onSelect && onSelect(c.key)}
            className={isActive ? "sl-chip is-active" : "sl-chip"}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: "4px 12px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <span className="sl-chip__label" style={{ fontSize: "var(--type-body-sm-size)" }}>
              {c.label}
            </span>
            <span
              className="sl-chip__rule"
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
    </div>
  );
}
