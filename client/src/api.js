// Token-aware client for the Subletair API.

let authToken = localStorage.getItem("subletair_token") || null;

export function setToken(token) {
  authToken = token;
  if (token) localStorage.setItem("subletair_token", token);
  else localStorage.removeItem("subletair_token");
}
export function getToken() {
  return authToken;
}

function authHeaders(extra = {}) {
  return authToken ? { ...extra, Authorization: `Bearer ${authToken}` } : extra;
}

async function json(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    // A 401 while a token was attached means the session expired/was revoked.
    // Clear it and let the app flip to logged-out (login attempts have no token,
    // so their 401 — bad credentials — won't trip this).
    if (res.status === 401 && authToken) {
      setToken(null);
      window.dispatchEvent(new Event("subletair:unauthorized"));
    }
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return body;
}

// Auth
export const register = (data) =>
  fetch("/api/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) }).then(json);
export const login = (data) =>
  fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) }).then(json);
export const me = () => fetch("/api/auth/me", { headers: authHeaders() }).then(json);

// Catalog
export const fetchCategories = () => fetch("/api/categories").then(json);
export function fetchListings({ category = "all", q = "" } = {}) {
  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);
  if (q) params.set("q", q);
  const qs = params.toString();
  return fetch(`/api/listings${qs ? `?${qs}` : ""}`, { headers: authHeaders() }).then(json);
}
export const fetchMyListings = () => fetch("/api/listings/mine", { headers: authHeaders() }).then(json);
export const toggleSave = (id) => fetch(`/api/listings/${id}/save`, { method: "POST", headers: authHeaders() }).then(json);

// Host CRUD (FormData so a photo file can ride along)
export const createListing = (formData) =>
  fetch("/api/listings", { method: "POST", headers: authHeaders(), body: formData }).then(json);
export const updateListing = (id, formData) =>
  fetch(`/api/listings/${id}`, { method: "PATCH", headers: authHeaders(), body: formData }).then(json);
export const deleteListing = (id) =>
  fetch(`/api/listings/${id}`, { method: "DELETE", headers: authHeaders() }).then(json);
