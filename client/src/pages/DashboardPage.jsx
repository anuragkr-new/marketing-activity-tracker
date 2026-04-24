import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApi } from '../contexts/ApiContext.jsx';
import { useAdminPanel } from '../contexts/AdminPanelContext.jsx';
import { useWindowWidth } from '../hooks/useWindowWidth.js';
import { formatUS, isDateInWeekRange } from '../utils/dates.js';
import { selectCurrentPlusThreeWeeks } from '../utils/planningWeeks.js';
import DesktopGrid from '../components/DesktopGrid.jsx';
import MobileInitiativeList from '../components/MobileInitiativeList.jsx';
import AdminPanel from '../components/AdminPanel.jsx';
import AdminPinModal from '../components/AdminPinModal.jsx';

function activityKey(initiativeId, weekId) {
  return `${initiativeId}_${weekId}`;
}

export default function DashboardPage() {
  const { api } = useApi();
  const { requestOpenAdmin } = useAdminPanel();
  const width = useWindowWidth();
  const isMobile = width < 768;

  const [dashboardTab, setDashboardTab] = useState('full');
  const [offset, setOffset] = useState(0);
  const [weeks, setWeeks] = useState([]);
  const [planningWeeks, setPlanningWeeks] = useState([]);
  const [initiatives, setInitiatives] = useState([]);
  const [activityByKey, setActivityByKey] = useState(() => new Map());
  const [busyKey, setBusyKey] = useState(null);

  const load = useCallback(async () => {
    const effectiveOffset = width < 768 ? 0 : offset;
    const w = await api(`/api/weeks?offset=${effectiveOffset}`);
    const ini = await api('/api/initiatives');
    const ids = w.map((x) => x.id).join(',');
    const act = ids ? await api(`/api/activity?week_ids=${ids}`) : [];
    setActivityByKey((prev) => {
      const n = new Map(prev);
      for (const row of act) {
        n.set(activityKey(row.initiative_id, row.week_id), row);
      }
      return n;
    });
    setWeeks(w);
    setInitiatives(ini);
  }, [api, offset, width]);

  const loadPlanning = useCallback(async () => {
    const w = await api('/api/weeks?offset=0');
    const slice = selectCurrentPlusThreeWeeks(w);
    setPlanningWeeks(slice);
    const ids = slice.map((x) => x.id).join(',');
    if (!ids) return;
    const act = await api(`/api/activity?week_ids=${ids}`);
    setActivityByKey((prev) => {
      const n = new Map(prev);
      for (const row of act) {
        n.set(activityKey(row.initiative_id, row.week_id), row);
      }
      return n;
    });
  }, [api]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  useEffect(() => {
    if (isMobile || dashboardTab !== 'planning') return;
    loadPlanning().catch(() => {});
  }, [isMobile, dashboardTab, loadPlanning]);

  const currentWeekMeta = useMemo(() => {
    const pool =
      dashboardTab === 'planning' && planningWeeks.length > 0 ? planningWeeks : weeks;
    const fromGrid = pool.find((w) => isDateInWeekRange(w.start_date));
    if (fromGrid) {
      return {
        label: `W${fromGrid.week_number} · ${formatUS(fromGrid.start_date)}`,
        week: fromGrid,
      };
    }
    return { label: '', week: null };
  }, [weeks, planningWeeks, dashboardTab]);

  const currentWeekForMobile = useMemo(() => {
    if (currentWeekMeta.week) return currentWeekMeta.week;
    return weeks[0] || null;
  }, [currentWeekMeta.week, weeks]);

  async function handleCellSave(initiativeId, weekId, cell_text) {
    const key = activityKey(initiativeId, weekId);
    setBusyKey(key);
    const prev = activityByKey.get(key);
    const optimistic = {
      ...(prev || {}),
      initiative_id: initiativeId,
      week_id: weekId,
      cell_text,
      updated_at: new Date().toISOString(),
    };
    setActivityByKey((m) => new Map(m).set(key, optimistic));
    try {
      const row = await api('/api/activity', {
        method: 'POST',
        body: { initiative_id: initiativeId, week_id: weekId, cell_text },
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

  function tabButtonStyle(active) {
    return {
      fontSize: 12,
      padding: '6px 12px',
      borderRadius: 6,
      border: '1px solid var(--rule)',
      background: active ? 'var(--surface)' : 'transparent',
      color: 'var(--ink)',
      fontWeight: active ? 600 : 400,
      cursor: 'pointer',
      boxShadow: active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
    };
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
          <button type="button" className="btn-secondary" onClick={() => requestOpenAdmin()}>
            Manage
          </button>
        </div>
      </header>

      <main style={{ padding: isMobile ? '12px 14px 32px' : '20px 24px 40px' }}>
        {!isMobile ? (
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 14,
              paddingLeft: 2,
            }}
          >
            <button
              type="button"
              style={tabButtonStyle(dashboardTab === 'full')}
              onClick={() => setDashboardTab('full')}
            >
              Full grid
            </button>
            <button
              type="button"
              style={tabButtonStyle(dashboardTab === 'planning')}
              onClick={() => setDashboardTab('planning')}
            >
              Next 4 weeks
            </button>
          </div>
        ) : null}

        <div
          className="content-wrap"
          style={{ padding: isMobile ? '14px 12px' : '20px 22px' }}
        >
          {isMobile ? (
            <MobileInitiativeList
              initiatives={initiatives}
              currentWeek={currentWeekForMobile}
              activityByKey={activityByKey}
              onCellSave={handleCellSave}
              busyKey={busyKey}
            />
          ) : dashboardTab === 'full' ? (
            <DesktopGrid
              initiatives={initiatives}
              weeks={weeks}
              activityByKey={activityByKey}
              onCellSave={handleCellSave}
              setOffset={setOffset}
              showOffsetControls
              busyKey={busyKey}
            />
          ) : (
            <DesktopGrid
              initiatives={initiatives}
              weeks={planningWeeks}
              activityByKey={activityByKey}
              onCellSave={handleCellSave}
              showOffsetControls={false}
              busyKey={busyKey}
            />
          )}
        </div>
      </main>

      <AdminPinModal />
      <AdminPanel
        onChanged={() => {
          load().catch(() => {});
          if (!isMobile && dashboardTab === 'planning') {
            loadPlanning().catch(() => {});
          }
        }}
      />
    </div>
  );
}
