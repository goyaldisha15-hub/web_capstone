export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const getTokens = () => JSON.parse(localStorage.getItem('tokens') || 'null');
export const saveTokens = (t) => localStorage.setItem('tokens', JSON.stringify(t));
export const clearTokens = () => localStorage.removeItem('tokens');

let onSessionExpired = () => {};
export const setSessionExpiredHandler = (fn) => { onSessionExpired = fn; };

async function refreshAccessToken() {
  const t = getTokens();
  if (!t?.refreshToken) throw new Error('No refresh token');
  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: t.refreshToken })
  });
  if (!res.ok) throw new Error('Refresh failed');
  const data = await res.json();
  saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data.accessToken;
}

export async function api(path, { method = 'GET', body } = {}) {
  const send = (token) => fetch(`${API_URL}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });

  let res = await send(getTokens()?.accessToken);

  // access token expired -> use refresh token once, then retry
  if (res.status === 401 && getTokens()?.refreshToken) {
    try {
      res = await send(await refreshAccessToken());
    } catch {
      onSessionExpired();
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}