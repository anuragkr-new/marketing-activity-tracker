const base = () =>
  (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

function safeApiOrigin(root) {
  try {
    const u = new URL(root);
    return { protocol: u.protocol, host: u.host };
  } catch {
    return { protocol: '?', host: 'invalid-base-url' };
  }
}

export async function apiRequest(path, { token, method = 'GET', body } = {}) {
  const root = base();

  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    root.startsWith('http://') &&
    !root.includes('localhost')
  ) {
    // #region agent log
    fetch('http://127.0.0.1:7904/ingest/5b45e50a-8745-4974-be29-ba0dbafe7bcf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': 'd02cd3',
      },
      body: JSON.stringify({
        sessionId: 'd02cd3',
        location: 'client.js:apiRequest',
        message: 'mixed_content_blocked',
        data: { apiHost: safeApiOrigin(root).host },
        timestamp: Date.now(),
        hypothesisId: 'E',
      }),
    }).catch(() => {});
    // #endregion
    const origin = safeApiOrigin(root);
    throw new Error(
      `API URL uses http:// (${origin.host}) but this page is https:// (mixed content). Set VITE_API_URL to your server https:// URL on Railway and redeploy the client.`
    );
  }

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutMs = 25000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(`${root}${path}`, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    if (e?.name === 'AbortError') {
      throw new Error(
        `Request timed out after ${timeoutMs / 1000}s — API may be unreachable. Check VITE_API_URL and that the server is up.`
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
