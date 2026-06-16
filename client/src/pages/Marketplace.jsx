import React, { useEffect, useState } from "react";
import { SearchBar } from "../components/SearchBar.jsx";
import { CategoryStrip } from "../components/CategoryStrip.jsx";
import { PropertyCard } from "../components/PropertyCard.jsx";
import { fetchCategories, fetchListings, toggleSave } from "../api.js";
import { useAuth } from "../auth/AuthContext.jsx";

export function Marketplace({ onRequireAuth }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("all");
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchListings({ category, q: query })
      .then((rows) => { if (active) { setListings(rows); setError(null); } })
      .catch(() => active && setError("Couldn't load listings."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [category, query, user]);

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

  return (
    <>
      <div className="sl-gutter sl-hero-in" style={{ display: "flex", justifyContent: "center", paddingTop: 20, paddingBottom: 24, borderBottom: "1px solid var(--color-hairline-soft)" }}>
        <SearchBar query={queryInput} onQueryChange={setQueryInput} onSearch={() => setQuery(queryInput)} />
      </div>

      <main className="sl-gutter" style={{ maxWidth: "var(--container-editorial)", margin: "0 auto", paddingBottom: 64 }}>
        {categories.length > 0 && (
          <CategoryStrip categories={categories} active={category} onSelect={setCategory} />
        )}

        <h1 className="sl-hero-in" style={{ fontSize: "var(--type-display-xl-size)", fontWeight: "var(--type-display-xl-weight)", lineHeight: "var(--type-display-xl-line)", margin: "24px 0", color: "var(--color-ink)" }}>
          {query ? `Stays matching “${query}”` : "Inspiration for your next trip"}
        </h1>

        {error && <p style={{ color: "var(--color-error-text)" }}>{error}</p>}
        {!error && !loading && listings.length === 0 && (
          <p style={{ color: "var(--color-muted)" }}>No stays found. Try a different search or category.</p>
        )}

        {/* keyed by the active filter so the whole grid re-reveals when results change */}
        <div key={`${category}|${query}`} style={gridStyle}>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
            : listings.map((l, i) => (
                <PropertyCard
                  key={l.id}
                  className="sl-reveal"
                  style={{ animationDelay: `${Math.min(i, 11) * 45}ms` }}
                  image={l.image} title={l.title} subtitle={l.subtitle}
                  price={l.price} rating={l.rating} badge={l.badge} saved={l.saved}
                  onToggleSave={() => handleToggleSave(l.id)}
                />
              ))}
        </div>
      </main>
    </>
  );
}

const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 };

/** Shimmer placeholder matching the PropertyCard footprint (photo + two meta lines). */
function CardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="sl-skel" style={{ aspectRatio: "1 / 1", width: "100%" }} />
      <div className="sl-skel" style={{ height: 14, width: "70%", marginTop: 14, borderRadius: 6 }} />
      <div className="sl-skel" style={{ height: 12, width: "45%", marginTop: 8, borderRadius: 6 }} />
    </div>
  );
}
