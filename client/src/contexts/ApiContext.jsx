import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { apiRequest } from '../api/client';

const ApiContext = createContext(null);

export function ApiProvider({ children }) {
  const api = useCallback((path, opts = {}) => apiRequest(path, opts), []);

  const value = useMemo(() => ({ api }), [api]);

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

export function useApi() {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error('useApi must be used within ApiProvider');
  return ctx;
}
