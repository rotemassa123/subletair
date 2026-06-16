// Thin client for the Subletair marketplace API.

async function json(res) {
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export function fetchCategories() {
  return fetch("/api/categories").then(json);
}

export function fetchListings({ category = "all", q = "" } = {}) {
  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);
  if (q) params.set("q", q);
  const qs = params.toString();
  return fetch(`/api/listings${qs ? `?${qs}` : ""}`).then(json);
}

export function toggleSave(id) {
  return fetch(`/api/listings/${id}/save`, { method: "POST" }).then(json);
}
