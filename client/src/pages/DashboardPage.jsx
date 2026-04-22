import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useAdminPanel } from '../contexts/AdminPanelContext.jsx';
import { useWindowWidth } from '../hooks/useWindowWidth.js';
import { formatUS, isDateInWeekRange } from '../utils/dates.js';
import DesktopGrid from '../components/DesktopGrid.jsx';
import MobileInitiativeList from '../components/MobileInitiativeList.jsx';
import AdminPanel from '../components/AdminPanel.jsx';

function activityKey(initiativeId, weekId) {
  return `${initiativeId}_${weekId}`;
}

export default function DashboardPage() {
  const { api, user } = useAuth();
  const { setOpen } = useAdminPanel();
  const width = useWindowWidth();
  const isMobile = width < 768;

  const [offset, setOffset] = useState(0);
  const [weeks, setWeeks] = useState([]);
  const [initiatives, setInitiatives] = useState([]);
  const [activityByKey, setActivityByKey] = useState(() => new Map());
  const [busyKey, setBusyKey] = useState(null);

  const load = useCallback(async () => {
    const effectiveOffset = width < 768 ? 0 : offset;
    const w = await api(`/api/weeks?offset=${effectiveOffset}`);
    const ini = await api('/api/initiatives');
    const ids = w.map((x) => x.id).join(',');
    const act = ids
      ? await api(`/api/activity?week_ids=${ids}`)
      : [];
    const map = new Map();
    for (const row of act) {
      map.set(activityKey(row.initiative_id, row.week_id), row);
    }
    setWeeks(w);
    setInitiatives(ini);
    setActivityByKey(map);
  }, [api, offset, width]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const currentWeekMeta = useMemo(() => {
    const fromGrid = weeks.find((w) => isDateInWeekRange(w.start_date));
    if (fromGrid) {
      return {
        label: `W${fromGrid.week_number} · ${formatUS(fromGrid.start_date)}`,
        week: fromGrid,
      };
    }
    return { label: '', week: null };
  }, [weeks]);

  const currentWeekForMobile = useMemo(() => {
    if (currentWeekMeta.week) return currentWeekMeta.week;
    return weeks[0] || null;
  }, [currentWeekMeta.week, weeks]);

  async function handleToggle(initiativeId, weekId, key) {
    setBusyKey(key);
    const prev = activityByKey.get(key);
    const nextWorked = prev ? !prev.worked_on : true;
    const optimistic = {
      ...(prev || {}),
      initiative_id: initiativeId,
      week_id: weekId,
      worked_on: nextWorked,
      updated_by_username: user.username,
      updated_at: new Date().toISOString(),
    };
    setActivityByKey((m) => new Map(m).set(key, optimistic));
    try {
      const row = await api('/api/activity/toggle', {
        method: 'POST',
        body: { initiative_id: initiativeId, week_id: weekId },
      });
      setActivityByKey((m) => new Map(m).set(key, row));
    } catch {
      setActivityByKey((m) => {
        const n = new Map(m);
        if (prev) n.set(key, prev);
        else n.delete(key);
        return n;
      });
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--page-bg)' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          background: 'var(--warm)',
          borderBottom: '1px solid var(--rule)',
        }}
      >
        <div
          className="section-title"
          style={{ fontFamily: 'var(--font-serif)', fontSize: 16 }}
        >
          Activity tracker
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {currentWeekMeta.label ? (
            <span className="badge badge-muted">{currentWeekMeta.label}</span>
          ) : null}
          <span className="badge badge-teal">{user.username}</span>
          {user.role === 'admin' ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setOpen(true)}
            >
              Manage
            </button>
          ) : null}
        </div>
      </header>

      <main style={{ padding: isMobile ? '12px 14px 32px' : '20px 24px 40px' }}>
        <div
          className="content-wrap"
          style={{ padding: isMobile ? '14px 12px' : '20px 22px' }}
        >
          {isMobile ? (
            <MobileInitiativeList
              initiatives={initiatives}
              currentWeek={currentWeekForMobile}
              activityByKey={activityByKey}
              onToggle={handleToggle}
              busyKey={busyKey}
            />
          ) : (
            <DesktopGrid
              initiatives={initiatives}
              weeks={weeks}
              activityByKey={activityByKey}
              onToggle={handleToggle}
              offset={offset}
              setOffset={setOffset}
              busyKey={busyKey}
            />
          )}
        </div>
      </main>

      {user.role === 'admin' ? (
        <AdminPanel
          onChanged={() => {
            load().catch(() => {});
          }}
        />
      ) : null}
    </div>
  );
}
