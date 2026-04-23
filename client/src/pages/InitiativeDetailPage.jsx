import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../contexts/ApiContext.jsx';
import { formatUS, formatUSDateTime, isDateInWeekRange } from '../utils/dates.js';
import { loadLastFourWeeksIncludingCurrent } from '../utils/weeksClient.js';
import ActivityCellInput from '../components/ActivityCellInput.jsx';

function activityKey(initiativeId, weekId) {
  return `${initiativeId}_${weekId}`;
}

export default function InitiativeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api } = useApi();
  const [initiative, setInitiative] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [activityByKey, setActivityByKey] = useState(() => new Map());
  const [busyWeekId, setBusyWeekId] = useState(null);

  const load = useCallback(async () => {
    const ini = await api(`/api/initiatives/${id}`);
    const ws = await loadLastFourWeeksIncludingCurrent(api);
    const ids = ws.map((w) => w.id).join(',');
    const act = ids ? await api(`/api/activity?week_ids=${ids}`) : [];
    const map = new Map();
    for (const row of act) {
      if (String(row.initiative_id) === String(id)) {
        map.set(activityKey(row.initiative_id, row.week_id), row);
      }
    }
    setInitiative(ini);
    setWeeks(ws);
    setActivityByKey(map);
  }, [api, id]);

  useEffect(() => {
    load().catch(() => navigate('/'));
  }, [load, navigate]);

  const currentWeek = useMemo(
    () => weeks.find((w) => isDateInWeekRange(w.start_date)) || null,
    [weeks]
  );

  const lastUpdated = useMemo(() => {
    let max = null;
    for (const row of activityByKey.values()) {
      if (!row?.updated_at) continue;
      const t = new Date(row.updated_at).getTime();
      if (max == null || t > max.t) max = { t, row };
    }
    return max?.row || null;
  }, [activityByKey]);

  async function handleCellSave(initiativeId, weekId, cell_text) {
    if (!initiative) return;
    if (initiative.status === 'completed') return;
    const key = activityKey(initiativeId, weekId);
    setBusyWeekId(weekId);
    const prev = activityByKey.get(key);
    setActivityByKey((m) =>
      new Map(m).set(key, {
        ...(prev || {}),
        initiative_id: initiativeId,
        week_id: weekId,
        cell_text,
        updated_at: new Date().toISOString(),
      })
    );
    try {
      const row = await api('/api/activity', {
        method: 'POST',
        body: {
          initiative_id: initiativeId,
          week_id: weekId,
          cell_text,
        },
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
      setBusyWeekId(null);
    }
  }

  if (!initiative) {
    return (
      <div className="muted" style={{ padding: 24 }}>
        Loading…
      </div>
    );
  }

  const completed = initiative.status === 'completed';

  return (
    <div style={{ minHeight: '100%', background: 'var(--page-bg)' }}>
      <header
        style={{
          padding: '12px 16px',
          background: 'var(--warm)',
          borderBottom: '1px solid var(--rule)',
        }}
      >
        <Link
          to="/"
          className="btn-link"
          style={{ fontSize: 10, textDecoration: 'none' }}
        >
          ← Back
        </Link>
      </header>
      <main style={{ padding: '18px 18px 32px' }}>
        <h1
          className="section-title"
          style={{ fontSize: 16, marginBottom: 8, fontFamily: 'var(--font-serif)' }}
        >
          {initiative.name}
        </h1>
        <div className="muted" style={{ fontSize: 11, marginBottom: 22 }}>
          {(initiative.owner || '—') + ' · ' + (initiative.theme_name || '—')}
        </div>

        {currentWeek ? (
          <div
            style={{
              marginBottom: 18,
              padding: '10px 12px',
              border: '1px solid var(--rule)',
              background: 'var(--surface)',
            }}
          >
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              This week
            </div>
            <div style={{ fontSize: 12, marginBottom: 10 }}>
              W{currentWeek.week_number} · {formatUS(currentWeek.start_date)}
            </div>
            <ActivityCellInput
              initiativeId={initiative.id}
              weekId={currentWeek.id}
              cell={activityByKey.get(activityKey(initiative.id, currentWeek.id))}
              disabled={completed}
              busy={busyWeekId === currentWeek.id}
              onSave={handleCellSave}
              inputStyle={{ maxWidth: '100%', margin: 0 }}
            />
          </div>
        ) : null}

        <div className="eyebrow" style={{ marginBottom: 8 }}>
          Recent weeks
        </div>
        <div
          className="content-wrap"
          style={{ padding: '4px 0', marginBottom: 20 }}
        >
          {weeks.map((w) => {
            const key = activityKey(initiative.id, w.id);
            return (
              <div
                key={w.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '10px 14px',
                  borderBottom: '0.5px solid var(--rule)',
                }}
              >
                <div style={{ fontSize: 12, flexShrink: 0 }}>
                  W{w.week_number} · {formatUS(w.start_date)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <ActivityCellInput
                    initiativeId={initiative.id}
                    weekId={w.id}
                    cell={activityByKey.get(key)}
                    disabled={completed}
                    busy={busyWeekId === w.id}
                    onSave={handleCellSave}
                    inputStyle={{ maxWidth: '100%', margin: 0 }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="content-wrap"
          style={{ padding: '12px 14px', fontSize: 11, color: 'var(--ink-muted)' }}
        >
          {lastUpdated ? (
            <>Last updated · {formatUSDateTime(lastUpdated.updated_at)}</>
          ) : (
            <>No entries yet for these weeks.</>
          )}
        </div>
      </main>
    </div>
  );
}
