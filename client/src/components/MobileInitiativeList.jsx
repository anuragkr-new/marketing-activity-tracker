import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { weekRangeLabel } from '../utils/dates.js';

function groupInitiatives(rows) {
  const map = new Map();
  for (const row of rows) {
    const label = row.theme_name || 'Uncategorized';
    if (!map.has(label)) map.set(label, []);
    map.get(label).push(row);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => a.name.localeCompare(b.name));
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function activityKey(initiativeId, weekId) {
  return `${initiativeId}_${weekId}`;
}

export default function MobileInitiativeList({
  initiatives,
  currentWeek,
  activityByKey,
  onToggle,
  busyKey,
}) {
  const navigate = useNavigate();
  const groups = useMemo(() => groupInitiatives(initiatives), [initiatives]);

  if (!currentWeek) {
    return (
      <p className="muted" style={{ padding: 16 }}>
        Loading week…
      </p>
    );
  }

  return (
    <div style={{ padding: '0 0 24px' }}>
      <div className="muted" style={{ fontSize: 12, marginBottom: 16 }}>
        W{currentWeek.week_number} · {weekRangeLabel(currentWeek.start_date)}
      </div>
      {groups.map(([themeName, items]) => (
        <div key={themeName} style={{ marginBottom: 20 }}>
          <div
            className="eyebrow"
            style={{
              background: 'var(--warm)',
              padding: '8px 12px',
              width: '100%',
            }}
          >
            {themeName}
          </div>
          {items.map((ini) => {
            const completed = ini.status === 'completed';
            const key = activityKey(ini.id, currentWeek.id);
            const cell = activityByKey.get(key);
            const on = Boolean(cell?.worked_on);
            const loading = busyKey === key;
            return (
              <div
                key={ini.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 4px',
                  borderBottom: '0.5px solid var(--rule)',
                  gap: 12,
                }}
              >
                <button
                  type="button"
                  className="btn-link"
                  style={{
                    textAlign: 'left',
                    flex: 1,
                    color: 'var(--blue)',
                    fontSize: 12,
                  }}
                  onClick={() => navigate(`/initiative/${ini.id}`)}
                >
                  <div style={{ fontWeight: 400 }}>{ini.name}</div>
                  <div className="muted" style={{ fontSize: 10 }}>
                    {ini.owner_username || '—'}
                  </div>
                </button>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    opacity: completed ? 0.35 : 1,
                    pointerEvents: completed ? 'none' : 'auto',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={completed || loading}
                    onChange={() => {
                      if (completed || loading) return;
                      onToggle(ini.id, currentWeek.id, key);
                    }}
                    style={{ accentColor: 'var(--teal)', width: 18, height: 18 }}
                  />
                </label>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
