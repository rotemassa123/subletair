import React from "react";
import { Badge } from "./Badge.jsx";
import { IconButton } from "./IconButton.jsx";
import { useCurrency } from "../currency/CurrencyContext.jsx";

/**
 * Photo-first listing card. Square (1:1) photo clipped to the card radius, a
 * floating "Guest favorite" badge top-left and a wishlist heart top-right, then
 * the meta block beneath: title, sub line, and "$N night" with an inline rating.
 */
export function PropertyCard({
  image,
  title,
  subtitle,
  price,
  priceUnit = "night",
  rating,
  badge,
  saved = false,
  onToggleSave,
  aspect = "1 / 1",
  className,
  style,
  ...rest
}) {
  const { format } = useCurrency();
  return (
    <div
      className={className ? `sl-card ${className}` : "sl-card"}
      style={{
        fontFamily: "var(--font-family-base)",
        color: "var(--color-ink)",
        width: "100%",
        ...style,
      }}
      {...rest}
    >
      <div
        className="sl-card__photo"
        style={{
          position: "relative",
          aspectRatio: aspect,
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          background: "var(--color-surface-strong)",
        }}
      >
        {image && (
          <img
            src={image}
            alt={title}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
        {badge && (
          <div style={{ position: "absolute", top: 12, left: 12 }}>
            <Badge tone={badge === "New" ? "new" : "favorite"}>{badge}</Badge>
          </div>
        )}
        <div style={{ position: "absolute", top: 10, right: 10 }}>
          <IconButton
            ariaLabel={saved ? "Remove from wishlist" : "Save to wishlist"}
            variant="ghost"
            active={saved}
            size={32}
            onClick={onToggleSave}
            className={saved ? "sl-heart is-saved" : "sl-heart"}
          >
            <HeartGlyph filled={saved} />
          </IconButton>
        </div>
      </div>

      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: "var(--type-title-md-size)", fontWeight: "var(--type-title-md-weight)" }}>
            {title}
          </span>
          {rating != null && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "var(--type-body-sm-size)" }}>
              <StarGlyph /> {rating}
            </span>
          )}
        </div>
        {subtitle && (
          <span style={{ fontSize: "var(--type-body-sm-size)", color: "var(--color-muted)" }}>{subtitle}</span>
        )}
        {price != null && (
          <span style={{ fontSize: "var(--type-body-sm-size)", marginTop: 4 }}>
            <strong style={{ fontWeight: 600 }}>{format(price)}</strong> {priceUnit}
          </span>
        )}
      </div>
    </div>
  );
}

function HeartGlyph({ filled }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 21s-7.5-4.9-10-9.4C.6 8.9 1.8 5.5 5 5c2-.3 3.4.7 4.4 1.9.4.5.8 1 .8 1 .4 0 .4-.5.8-1C12 5.7 13.4 4.7 15.4 5c3.2.5 4.4 3.9 3 6.6C20 16.1 12 21 12 21z"
        fill={filled ? "var(--color-primary)" : "rgba(0,0,0,0.5)"}
        stroke="#fff"
        strokeWidth="2"
      />
    </svg>
  );
}

function StarGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 18.6 6.1 21l1.2-6.5L2.5 9.4l6.6-.9z"
        fill="var(--color-star-rating)"
      />
    </svg>
  );
}
