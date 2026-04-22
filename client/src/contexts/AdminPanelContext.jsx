import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

const AdminPanelContext = createContext(null);

export function AdminPanelProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('initiatives');
  const [unlocked, setUnlocked] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinError, setPinError] = useState('');

  const requestOpenAdmin = useCallback(() => {
    if (unlocked) {
      setOpen(true);
    } else {
      setPinError('');
      setPinModalOpen(true);
    }
  }, [unlocked]);

  const submitAdminPin = useCallback((pin) => {
    const expected = String(import.meta.env.VITE_ADMIN_PIN ?? '');
    if (!expected) {
      setPinError('VITE_ADMIN_PIN is not configured');
      return false;
    }
    if (String(pin) === expected) {
      setUnlocked(true);
      setPinModalOpen(false);
      setPinError('');
      setOpen(true);
      return true;
    }
    setPinError('Incorrect PIN');
    return false;
  }, []);

  const dismissPinModal = useCallback(() => {
    setPinModalOpen(false);
    setPinError('');
  }, []);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      tab,
      setTab,
      unlocked,
      pinModalOpen,
      pinError,
      requestOpenAdmin,
      submitAdminPin,
      dismissPinModal,
    }),
    [
      open,
      tab,
      unlocked,
      pinModalOpen,
      pinError,
      requestOpenAdmin,
      submitAdminPin,
      dismissPinModal,
    ]
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
