import React, { useEffect, useState } from "react";
import { CategoryStrip } from "../components/CategoryStrip.jsx";
import { DestinationRow } from "../components/DestinationRow.jsx";
import { fetchCategories, fetchListings, toggleSave } from "../api.js";
import { useAuth } from "../auth/AuthContext.jsx";

export function Marketplace({ search, onRequireAuth }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("all");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchCategories().then(setCategories).catch(() => setCategories([])); }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchListings({ category, ...search })
      .then((rows) => { if (active) { setListings(rows); setError(null); } })
      .catch(() => active && setError("Couldn't load listings."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [category, search, user]);

  async function handleToggleSave(id) {
    if (!user) return onRequireAuth();
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, saved: !l.saved } : l)));
    try {
      const updated = await toggleSave(id);
      setListings((prev) => prev.map((l) => (l.id === id ? updated : l)));
    } catch {
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, saved: !l.saved } : l)));
    }
  }

  // Group listings into one row per destination, in order of first appearance.
  const groups = [];
  const byLocation = new Map();
  for (const l of listings) {
    const key = l.location || "Other";
    if (!byLocation.has(key)) { byLocation.set(key, []); groups.push(key); }
    byLocation.get(key).push(l);
  }

  const heading = search.location ? `Stays in ${search.location}` : "Inspiration for your next trip";

  return (
    <main className="sl-gutter" style={{ maxWidth: "none", paddingBottom: 64 }}>
      {categories.length > 0 && (
        <CategoryStrip categories={categories} active={category} onSelect={setCategory} />
      )}

      <h1 className="sl-hero-in" style={{ fontSize: "var(--type-display-xl-size)", fontWeight: "var(--type-display-xl-weight)", lineHeight: "var(--type-display-xl-line)", margin: "24px 0", color: "var(--color-ink)" }}>
        {heading}
      </h1>

      {error && <p style={{ color: "var(--color-error-text)" }}>{error}</p>}
      {!error && !loading && listings.length === 0 && (
        <p style={{ color: "var(--color-muted)" }}>No stays match your search. Try different dates, fewer guests, or another destination.</p>
      )}

      {loading ? (
        <RowSkeleton />
      ) : (
        groups.map((loc) => (
          <DestinationRow key={loc} location={loc} listings={byLocation.get(loc)} onToggleSave={handleToggleSave} />
        ))
      )}
    </main>
  );
}

/** Shimmer placeholders for one row while listings load. */
function RowSkeleton() {
  return (
    <div style={{ marginBottom: 40 }}>
      <div className="sl-skel" style={{ height: 22, width: 240, borderRadius: 6, marginBottom: 16 }} />
      <div style={{ display: "flex", gap: 16, overflow: "hidden" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} aria-hidden="true" style={{ flex: "0 0 auto", width: 280 }}>
            <div className="sl-skel" style={{ aspectRatio: "1 / 1", width: "100%" }} />
            <div className="sl-skel" style={{ height: 14, width: "70%", marginTop: 14, borderRadius: 6 }} />
            <div className="sl-skel" style={{ height: 12, width: "45%", marginTop: 8, borderRadius: 6 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
