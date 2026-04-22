import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { apiRequest } from '../api/client';
import { clearLoginHold, setLoginHold } from '../utils/loginHold.js';

const AuthContext = createContext(null);

const TOKEN_KEY = 'spyne_at_token';
const USER_KEY = 'spyne_at_user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(async (username, password) => {
    setLoginHold(true);
    // #region agent log
    fetch('http://127.0.0.1:7904/ingest/5b45e50a-8745-4974-be29-ba0dbafe7bcf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': 'd02cd3',
      },
      body: JSON.stringify({
        sessionId: 'd02cd3',
        location: 'AuthContext.jsx:login',
        message: 'login_entry',
        data: { usernameLen: username?.length },
        timestamp: Date.now(),
        hypothesisId: 'C',
      }),
    }).catch(() => {});
    // #endregion
    let data;
    try {
      data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: { username, password },
      });
    } catch (e) {
      // #region agent log
      fetch('http://127.0.0.1:7904/ingest/5b45e50a-8745-4974-be29-ba0dbafe7bcf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': 'd02cd3',
        },
        body: JSON.stringify({
          sessionId: 'd02cd3',
          location: 'AuthContext.jsx:login',
          message: 'login_api_fail',
          data: {
            name: e?.name,
            msg: String(e?.message || '').slice(0, 200),
          },
          timestamp: Date.now(),
          hypothesisId: 'C',
        }),
      }).catch(() => {});
      // #endregion
      clearLoginHold();
      throw e;
    }
    // #region agent log
    fetch('http://127.0.0.1:7904/ingest/5b45e50a-8745-4974-be29-ba0dbafe7bcf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': 'd02cd3',
      },
      body: JSON.stringify({
        sessionId: 'd02cd3',
        location: 'AuthContext.jsx:login',
        message: 'login_api_ok',
        data: {
          hasToken: Boolean(data?.token),
          userKeys: data?.user ? Object.keys(data.user) : [],
        },
        timestamp: Date.now(),
        hypothesisId: 'B',
      }),
    }).catch(() => {});
    // #endregion
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    // #region agent log
    fetch('http://127.0.0.1:7904/ingest/5b45e50a-8745-4974-be29-ba0dbafe7bcf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': 'd02cd3',
      },
      body: JSON.stringify({
        sessionId: 'd02cd3',
        location: 'AuthContext.jsx:login',
        message: 'login_state_persisted',
        data: {},
        timestamp: Date.now(),
        hypothesisId: 'A',
      }),
    }).catch(() => {});
    // #endregion
    return data.user;
  }, []);

  const api = useCallback(
    (path, opts = {}) =>
      apiRequest(path, { ...opts, token: token || undefined }),
    [token]
  );

  const value = useMemo(
    () => ({
      token,
      user,
      login,
      logout,
      api,
      isAuthenticated: Boolean(token && user),
    }),
    [token, user, login, logout, api]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
