const API_URL = process.env.REACT_APP_API_URL || "https://liaqrb91d4.execute-api.ap-southeast-2.amazonaws.com";
const API_KEY  = process.env.REACT_APP_API_KEY;

// ── Auth helpers ──────────────────────────────────────────────────────────
export const Auth = {
  save(data)   { sessionStorage.setItem("etr_user", JSON.stringify(data)); },
  get()        { try { return JSON.parse(sessionStorage.getItem("etr_user")); } catch { return null; } },
  clear()      { sessionStorage.removeItem("etr_user"); },
  token()      { return Auth.get()?.token || ""; },
  role()       { return Auth.get()?.role  || ""; },
  name()       { return Auth.get()?.name  || ""; },
  email()      { return Auth.get()?.email || ""; },
  isLoggedIn() { return !!Auth.get()?.token; },
  isAdmin()    { return ["ADMIN", "MANAGER"].includes(Auth.role()); },
};

// ── Core API call ─────────────────────────────────────────────────────────
export async function api(method, path, body = null, useToken = false) {
  const headers = { "Content-Type": "application/json", "x-api-key": API_KEY };
  if (useToken && Auth.token()) headers["x-token"] = Auth.token();
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(API_URL + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.message || "API error");
  return data;
}

// ── Ticket APIs ───────────────────────────────────────────────────────────
export const TicketAPI = {
  create:    (b)  => api("POST", "/tickets/create", b),
  list:      (f)  => { const q = f ? "?" + new URLSearchParams(f).toString() : ""; return api("GET", `/tickets${q}`, null, true); },
  getById:   (id) => api("GET", `/tickets/${id}`, null, true),
  update:    (b)  => api("PUT", "/tickets/update", b, true),
  getLogs:   (id) => api("GET", `/tickets/${id}/logs`, null, true),
  myTickets: ()   => api("GET", "/tickets/my", null, true),
  breached:  ()   => api("GET", "/tickets/sla/breached", null, true),
  testRoute: (b)  => api("POST", "/rules/test", b),
};

// ── Rules APIs ────────────────────────────────────────────────────────────
export const RulesAPI = {
  list:   ()  => api("GET",    "/rules",        null, true),
  add:    (b) => api("POST",   "/rules/add",    b,    true),
  delete: (b) => api("DELETE", "/rules/delete", b,    true),
  seed:   ()  => api("POST",   "/rules/seed",   {},   true),
  test:   (b) => api("POST",   "/rules/test",   b),
};

// ── Auth APIs ─────────────────────────────────────────────────────────────
export const AuthAPI = {
  login:     (b) => api("POST", "/auth/login", b),
  dashboard: ()  => api("GET",  "/dashboard", null, true),
};

// ── Format helpers ────────────────────────────────────────────────────────
export function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function timeAgo(iso) {
  if (!iso) return "—";
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1)    return "just now";
  if (m < 60)   return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
}

export function teamLabel(t) { return (t || "—").replace(/_/g, " "); }
