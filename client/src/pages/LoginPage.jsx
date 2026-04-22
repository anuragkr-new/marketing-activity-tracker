import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  agentDebugLog,
  clearLoginDebug,
  clearLoginHold,
  hasLoginHold,
  persistLoginError,
  readDebugLogLines,
  readLastLoginError,
} from '../utils/agentDebug.js';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [panelLines, setPanelLines] = useState(() => readDebugLogLines());
  const [persistedErr, setPersistedErr] = useState(() => readLastLoginError());
  const [showContinue, setShowContinue] = useState(false);

  useEffect(() => {
    setPanelLines(readDebugLogLines());
    setPersistedErr(readLastLoginError());
  }, []);

  useEffect(() => {
    if (isAuthenticated && hasLoginHold()) {
      setShowContinue(true);
      setPanelLines(readDebugLogLines());
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!loading) return undefined;
    const id = setInterval(() => {
      setPanelLines(readDebugLogLines());
    }, 400);
    return () => clearInterval(id);
  }, [loading]);

  async function copyDebug() {
    const parts = [];
    const err = readLastLoginError() || error;
    if (err) parts.push(`Error: ${err}`);
    parts.push(...readDebugLogLines());
    const text = parts.join('\n\n') || '(no debug lines)';
    try {
      await navigator.clipboard.writeText(text);
      agentDebugLog('LoginPage.jsx:copy', 'clipboard ok', { chars: text.length }, 'H8');
    } catch (e) {
      agentDebugLog(
        'LoginPage.jsx:copy-fail',
        'clipboard failed',
        { message: String(e?.message || e) },
        'H8'
      );
    }
    setPanelLines(readDebugLogLines());
  }

  function goDashboard() {
    clearLoginHold();
    window.location.replace('/');
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setShowContinue(false);
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
        'login ok — use Continue when ready',
        {},
        'H6'
      );
      setPanelLines(readDebugLogLines());
      setShowContinue(true);
      setLoading(false);
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
    loading || showContinue || panelLines.length || persistedErr || error
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
        {showContinue ? (
          <div
            style={{
              padding: 16,
              borderRadius: 8,
              background: 'rgba(34, 139, 34, 0.12)',
              marginBottom: 16,
              fontSize: 13,
            }}
          >
            <strong>Signed in.</strong> Copy the debug block below if you still need it, then open
            the dashboard.
            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              <button type="button" className="btn-primary" onClick={copyDebug}>
                Copy debug to clipboard
              </button>
              <button type="button" className="btn-primary" onClick={goDashboard}>
                Open dashboard
              </button>
            </div>
          </div>
        ) : null}
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
              disabled={loading || showContinue}
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
              disabled={loading || showContinue}
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%' }}
            disabled={loading || showContinue}
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
              maxHeight: 360,
              overflow: 'auto',
              fontSize: 10,
              fontFamily: 'ui-monospace, monospace',
              lineHeight: 1.35,
              wordBreak: 'break-word',
            }}
          >
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              Debug (stays until you open the dashboard — scroll to copy)
            </div>
            {!showContinue ? (
              <button
                type="button"
                className="btn-primary"
                style={{ marginBottom: 10, fontSize: 11, padding: '6px 12px' }}
                onClick={copyDebug}
              >
                Copy debug to clipboard
              </button>
            ) : null}
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
