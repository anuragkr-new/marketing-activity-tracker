import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Sign in failed');
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
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>
            Sign in
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
