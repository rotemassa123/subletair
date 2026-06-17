import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListingForm } from "../components/ListingForm.jsx";
import { PropertyCard } from "../components/PropertyCard.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { fetchCategories, fetchMyListings, createListing, updateListing, deleteListing } from "../api.js";

export function Hosting({ onRequireAuth }) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [mine, setMine] = useState([]);
  const [editing, setEditing] = useState(null); // listing being edited, or "new", or null
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCategories().then(setCategories).catch(() => setCategories([])); }, []);

  useEffect(() => {
    if (!ready) return;
    if (!user) { onRequireAuth(); navigate("/"); return; }
    refresh();
  }, [ready, user]);

  function refresh() {
    setLoading(true);
    fetchMyListings().then(setMine).catch(() => setMine([])).finally(() => setLoading(false));
  }

  async function handleCreate(fd) { await createListing(fd); setEditing(null); refresh(); }
  async function handleUpdate(id, fd) { await updateListing(id, fd); setEditing(null); refresh(); }
  async function handleDelete(id) {
    if (!window.confirm("Delete this listing?")) return;
    try {
      await deleteListing(id);
      refresh();
    } catch (err) {
      window.alert(err.message);
    }
  }

  if (!ready) return null;
  if (!user) return <Centered>Please log in to manage your listings.</Centered>;

  return (
    <main className="sl-gutter" style={{ maxWidth: "var(--container-editorial)", margin: "0 auto", paddingTop: 32, paddingBottom: 64 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: "var(--type-display-xl-size)", fontWeight: 700, margin: 0 }}>Your listings</h1>
        {!editing && <button onClick={() => setEditing("new")} className="sl-btn-primary" style={primaryBtn}>Create listing</button>}
      </div>

      {editing === "new" && (
        <Section title="New listing">
          <ListingForm categories={categories} onSubmit={handleCreate} onCancel={() => setEditing(null)} />
        </Section>
      )}
      {editing && editing !== "new" && (
        <Section title="Edit listing">
          <ListingForm categories={categories} initial={editing} onSubmit={(fd) => handleUpdate(editing.id, fd)} onCancel={() => setEditing(null)} />
        </Section>
      )}

      {loading ? (
        <p style={{ color: "var(--color-muted)" }}>Loading…</p>
      ) : mine.length === 0 ? (
        <p style={{ color: "var(--color-muted)" }}>You haven’t published any listings yet.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {mine.map((l, i) => (
            <div key={l.id} className="sl-reveal" style={{ animationDelay: `${Math.min(i, 11) * 45}ms` }}>
              <PropertyCard image={l.image} title={l.title} subtitle={l.subtitle} price={l.price} rating={l.rating} badge={l.badge} />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={() => setEditing(l)} className="sl-btn-outline" style={smallBtn}>Edit</button>
                <button onClick={() => handleDelete(l.id)} className="sl-btn-outline" style={{ ...smallBtn, color: "var(--color-error-text)" }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 32, padding: 24, border: "1px solid var(--color-hairline)", borderRadius: "var(--radius-md)" }}>
      <h2 style={{ fontSize: "var(--type-display-sm-size)", fontWeight: 600, margin: "0 0 16px" }}>{title}</h2>
      {children}
    </section>
  );
}
function Centered({ children }) {
  return <div style={{ padding: 64, textAlign: "center", color: "var(--color-muted)" }}>{children}</div>;
}

const primaryBtn = {
  height: 48, padding: "0 24px", borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer",
  fontSize: 16, fontWeight: 500, fontFamily: "var(--font-family-base)",
};
const smallBtn = {
  flex: 1, height: 36, borderRadius: "var(--radius-sm)", border: "1px solid var(--color-hairline)", cursor: "pointer",
  color: "var(--color-ink)", fontSize: 14, fontWeight: 500, fontFamily: "var(--font-family-base)",
};
