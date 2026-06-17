import React, { useState } from "react";

/**
 * Create/edit form for a listing. Submits FormData (so a photo file rides
 * along). `initial` pre-fills for edit mode; `categories` populates the select.
 */
export function ListingForm({ categories, initial = null, onSubmit, onCancel }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle || "");
  const [price, setPrice] = useState(initial?.price || "");
  const [cat, setCat] = useState(initial?.cat || (categories.find((c) => c.key !== "all")?.key ?? ""));
  const [rating, setRating] = useState(initial?.rating || "");
  const [badge, setBadge] = useState(initial?.badge || "");
  const [location, setLocation] = useState(initial?.location || "");
  const [guests, setGuests] = useState(initial?.guests || 2);
  const [availStart, setAvailStart] = useState(initial?.availability?.start || "");
  const [availEnd, setAvailEnd] = useState(initial?.availability?.end || "");
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const fd = new FormData();
      fd.set("title", title);
      fd.set("subtitle", subtitle);
      fd.set("price", String(price));
      fd.set("cat", cat);
      fd.set("location", location);
      fd.set("guests", String(guests));
      if (availStart) fd.set("availStart", availStart);
      if (availEnd) fd.set("availEnd", availEnd);
      if (rating) fd.set("rating", String(rating));
      if (badge) fd.set("badge", badge);
      if (file) fd.set("photo", file);
      await onSubmit(fd);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const selectableCats = categories.filter((c) => c.key !== "all");

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 480 }}>
      <input className="sl-field" style={field} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <input className="sl-field" style={field} placeholder="Subtitle (e.g. ‘City centre · Jun 18–22’)" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
      <input className="sl-field" style={field} type="number" min="1" placeholder="Price per night (USD)" value={price} onChange={(e) => setPrice(e.target.value)} required />
      <select className="sl-field" style={field} value={cat} onChange={(e) => setCat(e.target.value)}>
        {selectableCats.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
      </select>
      <input className="sl-field" style={field} placeholder="Location (e.g. Lisbon)" value={location} onChange={(e) => setLocation(e.target.value)} required />
      <input className="sl-field" style={field} type="number" min="1" max="16" placeholder="Max guests" value={guests} onChange={(e) => setGuests(e.target.value)} required />
      <div style={{ display: "flex", gap: 8 }}>
        <label style={{ flex: 1, fontSize: 13, color: "var(--color-muted)" }}>Available from
          <input className="sl-field" style={{ ...field, width: "100%" }} type="date" value={availStart} onChange={(e) => setAvailStart(e.target.value)} />
        </label>
        <label style={{ flex: 1, fontSize: 13, color: "var(--color-muted)" }}>Available to
          <input className="sl-field" style={{ ...field, width: "100%" }} type="date" value={availEnd} onChange={(e) => setAvailEnd(e.target.value)} />
        </label>
      </div>
      <input className="sl-field" style={field} type="number" step="0.01" min="0" max="5" placeholder="Rating (optional, 0–5)" value={rating} onChange={(e) => setRating(e.target.value)} />
      <select className="sl-field" style={field} value={badge} onChange={(e) => setBadge(e.target.value)}>
        <option value="">No badge</option>
        <option value="Guest favorite">Guest favorite</option>
        <option value="New">New</option>
      </select>
      <label style={{ fontSize: 14, color: "var(--color-muted)" }}>
        Photo {initial ? "(leave blank to keep current)" : ""}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files[0] || null)} style={{ display: "block", marginTop: 6 }} />
      </label>
      {error && <span style={{ color: "var(--color-error-text)", fontSize: 14 }}>{error}</span>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={busy} className="sl-btn-primary" style={primaryBtn}>{busy ? "Saving…" : initial ? "Save changes" : "Publish listing"}</button>
        {onCancel && <button type="button" onClick={onCancel} className="sl-btn-outline" style={secondaryBtn}>Cancel</button>}
      </div>
    </form>
  );
}

const field = {
  height: 48, borderRadius: "var(--radius-sm)",
  padding: "0 14px", fontSize: 16, fontFamily: "var(--font-family-base)", outline: "none", background: "var(--color-canvas)",
};
const primaryBtn = {
  height: 48, padding: "0 24px", borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer",
  fontSize: 16, fontWeight: 500, fontFamily: "var(--font-family-base)",
};
const secondaryBtn = {
  height: 48, padding: "0 24px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-ink)", cursor: "pointer",
  color: "var(--color-ink)", fontSize: 16, fontWeight: 500, fontFamily: "var(--font-family-base)",
};
