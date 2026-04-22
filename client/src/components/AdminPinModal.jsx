import { useEffect, useState } from 'react';
import { useAdminPanel } from '../contexts/AdminPanelContext.jsx';

export default function AdminPinModal() {
  const { pinModalOpen, pinError, submitAdminPin, dismissPinModal } = useAdminPanel();
  const [value, setValue] = useState('');

  useEffect(() => {
    if (!pinModalOpen) setValue('');
  }, [pinModalOpen]);

  if (!pinModalOpen) return null;

  function onSubmit(e) {
    e.preventDefault();
    submitAdminPin(value);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-pin-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(26,25,22,0.35)',
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) dismissPinModal();
      }}
    >
      <div
        className="content-wrap"
        style={{
          width: 'min(100%, 320px)',
          padding: '20px 22px',
          background: 'var(--surface)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          id="admin-pin-title"
          className="section-title"
          style={{ fontSize: 16, marginBottom: 14 }}
        >
          Enter PIN
        </div>
        <form onSubmit={onSubmit}>
          <input
            className="input"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            autoComplete="one-time-code"
            placeholder="••••"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
            style={{ marginBottom: 8 }}
          />
          {pinError ? (
            <p style={{ color: 'var(--red)', fontSize: 11, margin: '0 0 10px' }}>{pinError}</p>
          ) : null}
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button type="submit" className="btn-primary">
              Unlock
            </button>
            <button type="button" className="btn-link" onClick={dismissPinModal}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
