import React, { useRef } from "react";
import { PropertyCard } from "./PropertyCard.jsx";

/**
 * One destination's listings as a horizontal, snap-scrolling row (Airbnb-style):
 * a section heading plus left/right scroll controls over a card track.
 */
export function DestinationRow({ location, listings, onToggleSave }) {
  const track = useRef(null);

  function scroll(dir) {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  }

  return (
    <section style={{ marginBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ fontSize: "var(--type-display-md-size)", fontWeight: 700, margin: 0, color: "var(--color-ink)" }}>
          Popular homes in {location}
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" aria-label={`Scroll ${location} left`} className="sl-chev" onClick={() => scroll(-1)} style={chev}>‹</button>
          <button type="button" aria-label={`Scroll ${location} right`} className="sl-chev" onClick={() => scroll(1)} style={chev}>›</button>
        </div>
      </div>

      <div ref={track} className="sl-row-track" style={trackStyle}>
        {listings.map((l, i) => (
          <div key={l.id} style={{ flex: "0 0 auto", width: 280, scrollSnapAlign: "start" }}>
            <PropertyCard
              className="sl-reveal"
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              image={l.image} title={l.title} subtitle={l.subtitle}
              price={l.price} rating={l.rating} badge={l.badge} saved={l.saved}
              onToggleSave={() => onToggleSave(l.id)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

const trackStyle = {
  display: "flex",
  gap: 16,
  overflowX: "auto",
  scrollSnapType: "x proximity",
  paddingBottom: 4,
};
const chev = {
  width: 36, height: 36, borderRadius: "var(--radius-full)",
  border: "1px solid var(--color-hairline)", background: "var(--color-canvas)",
  color: "var(--color-ink)", cursor: "pointer", fontSize: 18, lineHeight: 1,
  display: "inline-flex", alignItems: "center", justifyContent: "center",
};
