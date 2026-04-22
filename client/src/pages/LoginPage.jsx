import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  agentDebugLog,
  clearLoginDebug,
  persistLoginError,
  readDebugLogLines,
  readLastLoginError,
} from '../utils/agentDebug.js';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [panelLines, setPanelLines] = useState(() => readDebugLogLines());
  const [persistedErr, setPersistedErr] = useState(() => readLastLoginError());

  useEffect(() => {
    setPanelLines(readDebugLogLines());
    setPersistedErr(readLastLoginError());
  }, []);

  useEffect(() => {
    if (!loading) return undefined;
    const id = setInterval(() => {
      setPanelLines(readDebugLogLines());
    }, 400);
    return () => clearInterval(id);
  }, [loading]);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    clearLoginDebug();
    setPanelLines([]);
    setPersistedErr('');
    flushSync(() => {
      setLoading(true);
    });
    agentDebugLog(
      'LoginPage.jsx:onSubmit',
      'submit start',
      { hasUser: Boolean(username?.trim()), hasPass: Boolean(password) },
      'H5'
    );
    try {
      await login(username, password);
      agentDebugLog(
        'LoginPage.jsx:after-login',
        'login resolved, navigating',
        {},
        'H6'
      );
      clearLoginDebug();
      window.location.replace('/');
    } catch (err) {
      const msg = err.message || 'Sign in failed';
      agentDebugLog(
        'LoginPage.jsx:catch',
        'login failed',
        { name: err?.name, message: String(err?.message || err) },
        'H7'
      );
      persistLoginError(msg);
      setPanelLines(readDebugLogLines());
      setPersistedErr(readLastLoginError());
      setError(
        msg === 'Failed to fetch'
          ? `${msg} — check the API URL (VITE_API_URL must be https:// when the app is on https://) and CORS (CLIENT_ORIGIN on the server).`
          : msg
      );
      setLoading(false);
    }
  }

  const showPanel = Boolean(
    loading || panelLines.length || persistedErr || error
  );

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
        style={{ width: '100%', maxWidth: 420, padding: '32px 28px' }}
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
        {showPanel ? (
          <div
            style={{
              marginTop: 20,
              padding: 12,
              borderRadius: 8,
              background: 'rgba(0,0,0,0.06)',
              maxHeight: 220,
              overflow: 'auto',
              fontSize: 10,
              fontFamily: 'ui-monospace, monospace',
              lineHeight: 1.35,
              wordBreak: 'break-word',
            }}
          >
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              Debug (saved in this browser — scroll to copy)
            </div>
            {persistedErr || error ? (
              <div style={{ color: 'var(--red)', marginBottom: 10 }}>
                <strong>Error:</strong> {persistedErr || error}
              </div>
            ) : null}
            {loading && !panelLines.length ? (
              <div style={{ opacity: 0.7 }}>Waiting for API…</div>
            ) : null}
            {panelLines.map((line, i) => (
              <div key={i} style={{ opacity: 0.85 }}>
                {line}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
