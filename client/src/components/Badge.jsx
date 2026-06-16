import React from "react";

/**
 * Floating pill badge over photography — e.g. "Guest favorite". White surface,
 * fully rounded, carries the system's single shadow tier for elevation off the
 * photo. Use `tone="new"` for the coral "NEW" product tag.
 */
export function Badge({ children, tone = "favorite", style, ...rest }) {
  const tones = {
    favorite: {
      background: "var(--color-canvas)",
      color: "var(--color-ink)",
      boxShadow: "var(--shadow-card)",
      fontSize: "var(--type-badge-size)",
      fontWeight: "var(--type-badge-weight)",
      padding: "5px 11px",
    },
    new: {
      background: "var(--color-primary)",
      color: "var(--color-on-primary)",
      fontSize: "var(--type-uppercase-tag-size)",
      fontWeight: "var(--type-uppercase-tag-weight)",
      letterSpacing: "var(--type-uppercase-tag-tracking)",
      textTransform: "uppercase",
      padding: "3px 7px",
    },
    luxe: {
      background: "var(--color-luxe)",
      color: "var(--color-on-dark)",
      fontSize: "var(--type-badge-size)",
      fontWeight: "var(--type-badge-weight)",
      padding: "5px 11px",
    },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "var(--radius-full)",
        lineHeight: 1.2,
        fontFamily: "var(--font-family-base)",
        ...tones[tone],
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}
