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

const publicMode = import.meta.env.VITE_PUBLIC_MODE === 'true';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    publicMode ? null : localStorage.getItem(TOKEN_KEY)
  );
  const [user, setUser] = useState(() => {
    if (publicMode) {
      return { id: 0, username: 'Public', role: 'admin' };
    }
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  const logout = useCallback(() => {
    if (publicMode) return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const api = useCallback(
    (path, opts = {}) =>
      apiRequest(path, {
        ...opts,
        token: publicMode ? undefined : token || undefined,
      }),
    [token]
  );

  const value = useMemo(
    () => ({
      token,
      user,
      logout,
      api,
      isAuthenticated: publicMode ? true : Boolean(token && user),
      publicMode,
    }),
    [token, user, logout, api]
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
