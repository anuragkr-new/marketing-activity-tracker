import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { apiRequest } from '../api/client';

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
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
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
