import React from "react";

/**
 * Circular icon button. Two surfaces: a soft grey fill (`circle`) used for
 * toolbar / breadcrumb actions, and a white outlined disc (`outline`) used
 * floating over photography (e.g. the wishlist heart on a property card).
 */
export function IconButton({
  children,
  variant = "circle",
  size = 32,
  active = false,
  ariaLabel,
  onClick,
  className,
  style,
  ...rest
}) {
  const variants = {
    circle: {
      background: "var(--color-surface-strong)",
      color: "var(--color-ink)",
      border: "none",
    },
    outline: {
      background: "var(--color-canvas)",
      color: "var(--color-ink)",
      border: "1px solid var(--color-hairline)",
    },
    ghost: {
      background: "transparent",
      color: "var(--color-ink)",
      border: "none",
    },
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "var(--radius-full)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        padding: 0,
        color: active ? "var(--color-primary)" : variants[variant].color,
        ...variants[variant],
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
