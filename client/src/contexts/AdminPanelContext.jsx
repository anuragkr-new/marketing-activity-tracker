import React, { createContext, useContext, useMemo, useState } from 'react';

const AdminPanelContext = createContext(null);

export function AdminPanelProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('initiatives');

  const value = useMemo(
    () => ({ open, setOpen, tab, setTab }),
    [open, setOpen, tab, setTab]
  );

  return (
    <AdminPanelContext.Provider value={value}>
      {children}
    </AdminPanelContext.Provider>
  );
}

export function useAdminPanel() {
  const ctx = useContext(AdminPanelContext);
  if (!ctx) throw new Error('useAdminPanel must be used within AdminPanelProvider');
  return ctx;
}
