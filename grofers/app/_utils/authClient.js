const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function refreshToken() {
  const res = await fetch(`${API}/api/auth/refresh`, { method: "POST", credentials: "include" });
  if (!res.ok) throw new Error("No refresh");
  return res.json();
}

export async function apiWithAuth(path, opts = {}) {
  const token = localStorage.getItem("accessToken");
  const headers = opts.headers || {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...opts, headers, credentials: "include" });
  // Si token expiró (401), intentar refresh automático (simplificado)
  if (res.status === 401) {
    try {
      const r = await refreshToken();
      if (r.accessToken) {
        localStorage.setItem("accessToken", r.accessToken);
        headers["Authorization"] = `Bearer ${r.accessToken}`;
        return fetch(`${API}${path}`, { ...opts, headers, credentials: "include" });
      }
    } catch (e) {
      throw e;
    }
  }
  return res;
}
