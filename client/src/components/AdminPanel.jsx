import { useCallback, useEffect, useRef, useState } from 'react';
import { useApi } from '../contexts/ApiContext.jsx';
import { useAdminPanel } from '../contexts/AdminPanelContext.jsx';

export default function AdminPanel({ onChanged }) {
  const { api } = useApi();
  const { open, setOpen, tab, setTab } = useAdminPanel();
  const panelOpenedAtRef = useRef(0);
  const [themes, setThemes] = useState([]);
  const [owners, setOwners] = useState([]);
  const [initiatives, setInitiatives] = useState([]);
  const [error, setError] = useState('');
  const [addingTheme, setAddingTheme] = useState('');
  const [addingOwner, setAddingOwner] = useState('');
  const [showIniForm, setShowIniForm] = useState(false);
  const [iniDraft, setIniDraft] = useState({
    id: null,
    name: '',
    theme_id: '',
    owner_id: '',
    landing_page_url: '',
    status: 'active',
  });

  const refresh = useCallback(async () => {
    setError('');
    try {
      const [t, o, i] = await Promise.all([
        api('/api/themes'),
        api('/api/owners'),
        api('/api/initiatives'),
      ]);
      setThemes(Array.isArray(t) ? t : []);
      setOwners(Array.isArray(o) ? o : []);
      setInitiatives(Array.isArray(i) ? i : []);
    } catch (e) {
      setError(e.message || 'Failed to load');
    }
  }, [api]);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  useEffect(() => {
    if (open) panelOpenedAtRef.current = Date.now();
  }, [open]);

  if (!open) return null;

  const activeInis = initiatives.filter((x) => x.status === 'active');
  const doneInis = initiatives.filter((x) => x.status === 'completed');

  const themeSelectValue = themes.some((th) => String(th.id) === String(iniDraft.theme_id))
    ? String(iniDraft.theme_id)
    : '';

  const ownerSelectValue = owners.some((ow) => String(ow.id) === String(iniDraft.owner_id))
    ? String(iniDraft.owner_id)
    : '';

  async function submitIni(e) {
    e.preventDefault();
    setError('');
    try {
      const body = {
        name: iniDraft.name,
        theme_id: Number(iniDraft.theme_id),
        owner_id: Number(iniDraft.owner_id),
        landing_page_url: iniDraft.landing_page_url || null,
      };
      if (iniDraft.id) {
        await api(`/api/initiatives/${iniDraft.id}`, {
          method: 'PUT',
          body: {
            ...body,
            status: iniDraft.status,
          },
        });
      } else {
        await api('/api/initiatives', { method: 'POST', body });
      }
      setShowIniForm(false);
      setIniDraft({
        id: null,
        name: '',
        theme_id: '',
        owner_id: '',
        landing_page_url: '',
        status: 'active',
      });
      await refresh();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteInitiative(i) {
    if (
      !window.confirm(
        `Permanently delete “${i.name}”? This removes all logged activity for this initiative.`
      )
    ) {
      return;
    }
    setError('');
    try {
      await api(`/api/initiatives/${i.id}`, { method: 'DELETE' });
      if (iniDraft.id === i.id) {
        setShowIniForm(false);
        setIniDraft({
          id: null,
          name: '',
          theme_id: '',
          owner_id: '',
          landing_page_url: '',
          status: 'active',
        });
      }
      await refresh();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    }
  }

  async function addOwner(e) {
    e.preventDefault();
    if (!addingOwner.trim()) return;
    setError('');
    try {
      await api('/api/owners', {
        method: 'POST',
        body: { name: addingOwner.trim() },
      });
      setAddingOwner('');
      await refresh();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    }
  }

  async function addTheme(e) {
    e.preventDefault();
    if (!addingTheme.trim()) return;
    setError('');
    try {
      await api('/api/themes', {
        method: 'POST',
        body: { name: addingTheme.trim() },
      });
      setAddingTheme('');
      await refresh();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div
        role="presentation"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(26,25,22,0.3)',
          zIndex: 40,
        }}
        onClick={() => {
          if (Date.now() - panelOpenedAtRef.current < 280) return;
          setOpen(false);
        }}
      />
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100%',
          width: 'min(100%, 320px)',
          background: 'var(--surface)',
          borderLeft: '1px solid var(--rule)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(26,25,22,0.08)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '16px 18px',
            borderBottom: '1px solid var(--rule)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div className="section-title" style={{ fontSize: 16 }}>
            Manage
          </div>
          <button
            type="button"
            className="btn-link"
            aria-label="Close"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </div>
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--rule)',
            padding: '0 12px',
          }}
        >
          {['initiatives', 'themes', 'owners'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: '10px 4px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: tab === t ? 500 : 400,
                color: tab === t ? 'var(--blue)' : 'var(--ink-muted)',
                borderBottom:
                  tab === t ? '2px solid var(--blue)' : '2px solid transparent',
                marginBottom: '-1px',
                textTransform: 'capitalize',
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px 24px' }}>
          {error ? (
            <p style={{ color: 'var(--red)', fontSize: 11 }}>{error}</p>
          ) : null}

          {tab === 'themes' ? (
            <div>
              {themes.map((t) => {
                const inUse = initiatives.some((i) => i.theme_id === t.id);
                return (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 0',
                      borderBottom: '0.5px solid var(--rule)',
                    }}
                  >
                    <div style={{ fontSize: 12 }}>{t.name}</div>
                    <button
                      type="button"
                      className="btn-link danger"
                      disabled={inUse}
                      title={inUse ? 'In use' : undefined}
                      style={{
                        opacity: inUse ? 0.35 : 1,
                        cursor: inUse ? 'not-allowed' : 'pointer',
                      }}
                      onClick={() => {
                        if (inUse) return;
                        if (!window.confirm(`Delete theme “${t.name}”?`)) return;
                        api(`/api/themes/${t.id}`, { method: 'DELETE' })
                          .then(refresh)
                          .then(() => onChanged?.())
                          .catch((err) => setError(err.message));
                      }}
                    >
                      Delete
                    </button>
                  </div>
                );
              })}
              <form
                onSubmit={addTheme}
                style={{ display: 'flex', gap: 8, marginTop: 16 }}
              >
                <input
                  className="input"
                  placeholder="New theme name"
                  value={addingTheme}
                  onChange={(e) => setAddingTheme(e.target.value)}
                />
                <button type="submit" className="btn-primary">
                  Add
                </button>
              </form>
            </div>
          ) : null}

          {tab === 'owners' ? (
            <div>
              {owners.map((ow) => {
                const inUse = initiatives.some((i) => i.owner_id === ow.id);
                return (
                  <div
                    key={ow.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 0',
                      borderBottom: '0.5px solid var(--rule)',
                    }}
                  >
                    <div style={{ fontSize: 12 }}>{ow.name}</div>
                    <button
                      type="button"
                      className="btn-link danger"
                      disabled={inUse}
                      title={inUse ? 'In use' : undefined}
                      style={{
                        opacity: inUse ? 0.35 : 1,
                        cursor: inUse ? 'not-allowed' : 'pointer',
                      }}
                      onClick={() => {
                        if (inUse) return;
                        if (!window.confirm(`Delete owner “${ow.name}”?`)) return;
                        api(`/api/owners/${ow.id}`, { method: 'DELETE' })
                          .then(refresh)
                          .then(() => onChanged?.())
                          .catch((err) => setError(err.message));
                      }}
                    >
                      Delete
                    </button>
                  </div>
                );
              })}
              <form
                onSubmit={addOwner}
                style={{ display: 'flex', gap: 8, marginTop: 16 }}
              >
                <input
                  className="input"
                  placeholder="New owner name"
                  value={addingOwner}
                  onChange={(e) => setAddingOwner(e.target.value)}
                />
                <button type="submit" className="btn-primary">
                  Add
                </button>
              </form>
            </div>
          ) : null}

          {tab === 'initiatives' ? (
            <div>
              {showIniForm ? (
                <form onSubmit={submitIni} style={{ marginBottom: 20 }}>
                  <div className="eyebrow" style={{ marginBottom: 6 }}>
                    Name
                  </div>
                  <input
                    className="input"
                    value={iniDraft.name}
                    onChange={(e) => setIniDraft((d) => ({ ...d, name: e.target.value }))}
                  />
                  <div className="eyebrow" style={{ margin: '12px 0 6px' }}>
                    Theme
                  </div>
                  {themes.length === 0 ? (
                    <p className="muted" style={{ fontSize: 11 }}>
                      No themes found. Add a theme first.
                    </p>
                  ) : (
                    <select
                      className="select"
                      value={themeSelectValue}
                      onChange={(e) =>
                        setIniDraft((d) => ({ ...d, theme_id: e.target.value }))
                      }
                    >
                      <option value="">Select theme</option>
                      {themes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="eyebrow" style={{ margin: '12px 0 6px' }}>
                    Owner
                  </div>
                  {owners.length === 0 ? (
                    <p className="muted" style={{ fontSize: 11 }}>
                      No owners found. Add an owner in the Owners tab first.
                    </p>
                  ) : (
                    <select
                      className="select"
                      value={ownerSelectValue}
                      onChange={(e) =>
                        setIniDraft((d) => ({ ...d, owner_id: e.target.value }))
                      }
                    >
                      <option value="">Select owner</option>
                      {owners.map((ow) => (
                        <option key={ow.id} value={ow.id}>
                          {ow.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="eyebrow" style={{ margin: '12px 0 6px' }}>
                    Landing page URL (optional)
                  </div>
                  <input
                    className="input"
                    value={iniDraft.landing_page_url}
                    onChange={(e) =>
                      setIniDraft((d) => ({
                        ...d,
                        landing_page_url: e.target.value,
                      }))
                    }
                  />
                  {iniDraft.id ? (
                    <>
                      <div className="eyebrow" style={{ margin: '12px 0 6px' }}>
                        Status
                      </div>
                      <select
                        className="select"
                        value={iniDraft.status}
                        onChange={(e) =>
                          setIniDraft((d) => ({ ...d, status: e.target.value }))
                        }
                      >
                        <option value="active">active</option>
                        <option value="completed">completed</option>
                      </select>
                    </>
                  ) : null}
                  <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={
                        !iniDraft.name.trim() ||
                        owners.length === 0 ||
                        !ownerSelectValue ||
                        themes.length === 0 ||
                        !themeSelectValue
                      }
                    >
                      {iniDraft.id ? 'Save initiative' : 'Add initiative'}
                    </button>
                    <button
                      type="button"
                      className="btn-link"
                      onClick={() => {
                        setShowIniForm(false);
                        setIniDraft({
                          id: null,
                          name: '',
                          theme_id: '',
                          owner_id: '',
                          landing_page_url: '',
                          status: 'active',
                        });
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : null}

              <div className="eyebrow" style={{ marginBottom: 8 }}>
                Active
              </div>
              {activeInis.map((i) => (
                <div
                  key={i.id}
                  style={{
                    padding: '10px 0',
                    borderBottom: '0.5px solid var(--rule)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--ink)' }}>{i.name}</div>
                      <div className="muted" style={{ fontSize: 10 }}>
                        {(i.theme_name || '—') + ' · ' + (i.owner || '—')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        type="button"
                        className="btn-link"
                        onClick={() => {
                          setIniDraft({
                            id: i.id,
                            name: i.name,
                            theme_id: String(i.theme_id || ''),
                            owner_id: String(i.owner_id ?? ''),
                            landing_page_url: i.landing_page_url || '',
                            status: i.status,
                          });
                          setShowIniForm(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-link danger"
                        onClick={() => {
                          if (!window.confirm(`Mark “${i.name}” completed?`)) return;
                          api(`/api/initiatives/${i.id}`, {
                            method: 'PUT',
                            body: { status: 'completed' },
                          })
                            .then(refresh)
                            .then(() => onChanged?.())
                            .catch((err) => setError(err.message));
                        }}
                      >
                        End
                      </button>
                      <button
                        type="button"
                        className="btn-link danger"
                        onClick={() => deleteInitiative(i)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="eyebrow" style={{ margin: '18px 0 8px' }}>
                Completed
              </div>
              {doneInis.map((i) => (
                <div
                  key={i.id}
                  style={{
                    padding: '10px 0',
                    borderBottom: '0.5px solid var(--rule)',
                    opacity: 0.55,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12 }}>{i.name}</div>
                      <div className="muted" style={{ fontSize: 10 }}>
                        {(i.theme_name || '—') + ' · ' + (i.owner || '—')}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-link"
                      onClick={() => {
                        api(`/api/initiatives/${i.id}`, {
                          method: 'PUT',
                          body: { status: 'active' },
                        })
                          .then(refresh)
                          .then(() => onChanged?.())
                          .catch((err) => setError(err.message));
                      }}
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      className="btn-link danger"
                      onClick={() => deleteInitiative(i)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {!showIniForm ? (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{
                    width: '100%',
                    marginTop: 16,
                    borderStyle: 'dashed',
                  }}
                  onClick={() => {
                    setIniDraft({
                      id: null,
                      name: '',
                      theme_id: themes[0]?.id ? String(themes[0].id) : '',
                      owner_id: owners[0]?.id ? String(owners[0].id) : '',
                      landing_page_url: '',
                      status: 'active',
                    });
                    setShowIniForm(true);
                  }}
                >
                  + Add initiative
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}
