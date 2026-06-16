import React, { useEffect, useState } from "react";
import { TopNav } from "./components/TopNav.jsx";
import { SearchBar } from "./components/SearchBar.jsx";
import { CategoryStrip } from "./components/CategoryStrip.jsx";
import { PropertyCard } from "./components/PropertyCard.jsx";
import { fetchCategories, fetchListings, toggleSave } from "./api.js";

export default function App() {
  const [product, setProduct] = useState("stays");
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("all");
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Categories load once.
  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  // Listings reload whenever the category or committed query changes.
  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchListings({ category, q: query })
      .then((rows) => {
        if (!active) return;
        setListings(rows);
        setError(null);
      })
      .catch(() => active && setError("Couldn't load listings."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [category, query]);

  async function handleToggleSave(id) {
    // Optimistic flip, then reconcile with the server.
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, saved: !l.saved } : l))
    );
    try {
      const updated = await toggleSave(id);
      setListings((prev) => prev.map((l) => (l.id === id ? updated : l)));
    } catch {
      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, saved: !l.saved } : l))
      );
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-canvas)" }}>
      <TopNav active={product} onSelect={setProduct} />

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "20px 40px 24px",
          borderBottom: "1px solid var(--color-hairline-soft)",
        }}
      >
        <SearchBar
          query={queryInput}
          onQueryChange={setQueryInput}
          onSearch={() => setQuery(queryInput)}
        />
      </div>

      <main style={{ maxWidth: "var(--container-editorial)", margin: "0 auto", padding: "0 40px 64px" }}>
        {categories.length > 0 && (
          <CategoryStrip
            categories={categories}
            active={category}
            onSelect={setCategory}
          />
        )}

        <h1
          style={{
            fontSize: "var(--type-display-xl-size)",
            fontWeight: "var(--type-display-xl-weight)",
            lineHeight: "var(--type-display-xl-line)",
            margin: "24px 0",
            color: "var(--color-ink)",
          }}
        >
          {query ? `Stays matching “${query}”` : "Inspiration for your next trip"}
        </h1>

        {error && (
          <p style={{ color: "var(--color-error-text)" }}>{error}</p>
        )}

        {!error && loading && (
          <p style={{ color: "var(--color-muted)" }}>Loading stays…</p>
        )}

        {!error && !loading && listings.length === 0 && (
          <p style={{ color: "var(--color-muted)" }}>
            No stays found. Try a different search or category.
          </p>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {listings.map((l) => (
            <PropertyCard
              key={l.id}
              image={l.image}
              title={l.title}
              subtitle={l.subtitle}
              price={l.price}
              rating={l.rating}
              badge={l.badge}
              saved={l.saved}
              onToggleSave={() => handleToggleSave(l.id)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
