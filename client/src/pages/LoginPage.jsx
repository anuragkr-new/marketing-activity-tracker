import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

// #region agent log
function agentLog(location, message, data, hypothesisId) {
  const payload = {
    sessionId: 'd02cd3',
    timestamp: Date.now(),
    location,
    message,
    data,
    hypothesisId,
  };
  const line = JSON.stringify(payload);
  console.error('__AGENT_DEBUG__', line);
  fetch('http://127.0.0.1:7904/ingest/5b45e50a-8745-4974-be29-ba0dbafe7bcf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': 'd02cd3',
    },
    body: line,
  }).catch(() => {});
}
// #endregion

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    agentLog(
      'LoginPage.jsx:onSubmit',
      'submit start',
      { hasUser: Boolean(username?.trim()), hasPass: Boolean(password) },
      'H5'
    );
    try {
      await login(username, password);
      agentLog(
        'LoginPage.jsx:after-login',
        'login resolved, navigating',
        {},
        'H6'
      );
      // Full navigation avoids a race where `navigate('/')` runs before
      // AuthProvider state updates and `RequireAuth` bounces back to /login.
      window.location.replace('/');
    } catch (err) {
      agentLog(
        'LoginPage.jsx:catch',
        'login failed',
        { name: err?.name, message: String(err?.message || err) },
        'H7'
      );
      const msg = err.message || 'Sign in failed';
      setError(
        msg === 'Failed to fetch'
          ? `${msg} — check the API URL (VITE_API_URL must be https:// when the app is on https://) and CORS (CLIENT_ORIGIN on the server).`
          : msg
      );
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'var(--page-bg)',
      }}
    >
      <div
        className="content-wrap"
        style={{ width: '100%', maxWidth: 380, padding: '32px 28px' }}
      >
        <h1
          className="page-title"
          style={{ textAlign: 'center', marginBottom: 28, fontSize: 26 }}
        >
          <span style={{ color: 'var(--blue)' }}>Spyne</span>{' '}
          <span style={{ color: 'var(--ink)' }}>Activity Tracker</span>
        </h1>
        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: 14 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>
              Username
            </div>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>
              Password
            </div>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          {error ? (
            <p style={{ color: 'var(--red)', fontSize: 11, marginTop: 12 }}>
              {error}
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
