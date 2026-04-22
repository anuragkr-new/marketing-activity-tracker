const base = () => {
  if (import.meta.env.PROD) {
    return '';
  }
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
};

function safeApiOrigin(root) {
  try {
    const u = new URL(root);
    return { protocol: u.protocol, host: u.host };
  } catch {
    return { protocol: '?', host: 'invalid-base-url' };
  }
}

export async function apiRequest(path, { method = 'GET', body } = {}) {
  const root = base();
  const url = root ? `${root}${path}` : path;

  if (
    root &&
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    root.startsWith('http://') &&
    !root.includes('localhost')
  ) {
    const origin = safeApiOrigin(root);
    throw new Error(
      `API URL uses http:// (${origin.host}) but this page is https:// (mixed content). Set VITE_API_URL to your server https:// URL or use same-origin production build.`
    );
  }

  const headers = { 'Content-Type': 'application/json' };

  const controller = new AbortController();
  const timeoutMs = 25000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    if (e?.name === 'AbortError') {
      throw new Error(
        `Request timed out after ${timeoutMs / 1000}s — API may be unreachable. In dev, set VITE_API_URL (e.g. http://localhost:4000) or use Vite proxy.`
      );
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }

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
