const base = () =>
  (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

export async function apiRequest(path, { token, method = 'GET', body } = {}) {
  const root = base();
  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    root.startsWith('http://') &&
    !root.includes('localhost')
  ) {
    console.error(
      '[api] VITE_API_URL is http:// but the app is on https:// — browsers block that (mixed content). Set VITE_API_URL to your API https:// URL and redeploy the client.'
    );
  }
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${root}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text || 'Invalid response' };
  }
  if (!res.ok) {
    const err = new Error(data?.error || res.statusText || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
