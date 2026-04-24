import React, { useCallback, useMemo, useState } from 'react';
import { formatUS, isDateInWeekRange } from '../utils/dates.js';
import ActivityCellInput from './ActivityCellInput.jsx';

function activityKey(initiativeId, weekId) {
  return `${initiativeId}_${weekId}`;
}

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

export default function ActivityGridTable({
  initiatives,
  weeks,
  activityByKey,
  onCellSave,
  busyKey,
}) {
  const [fillDraft, setFillDraft] = useState(() => new Map());
  const reportFill = useCallback((iniId, wId, filled) => {
    const k = activityKey(iniId, wId);
    setFillDraft((prev) => {
      if (filled) {
        if (prev.get(k)) return prev;
        const next = new Map(prev);
        next.set(k, true);
        return next;
      }
      if (!prev.has(k)) return prev;
      const next = new Map(prev);
      next.delete(k);
      return next;
    });
  }, []);
  const groups = useMemo(() => groupInitiatives(initiatives), [initiatives]);

  if (!weeks.length) {
    return (
      <p className="muted" style={{ fontSize: 13, margin: 0 }}>
        No weeks available.
      </p>
    );
  }

  return (
    <>
      <table className="table-plain" style={{ minWidth: 720 }}>
        <thead>
          <tr>
            <th
              style={{
                position: 'sticky',
                left: 0,
                zIndex: 3,
                background: 'var(--surface)',
                minWidth: 200,
                borderRight: '1px solid var(--rule)',
              }}
            >
              Initiative
            </th>
            {weeks.map((w) => {
              const current = isDateInWeekRange(w.start_date);
              return (
                <th
                  key={w.id}
                  style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    background: current ? 'var(--blue-tint)' : 'var(--surface)',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    minWidth: 120,
                  }}
                >
                  <div>
                    W{w.week_number} · {formatUS(w.start_date)}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {groups.map(([themeName, items]) => (
            <React.Fragment key={`theme-${themeName}`}>
              <tr>
                <td
                  colSpan={weeks.length + 1}
                  style={{
                    background: 'var(--warm)',
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--ink-muted)',
                    fontWeight: 500,
                    borderBottom: '1px solid var(--rule)',
                  }}
                >
                  {themeName}
                </td>
              </tr>
              {items.map((ini) => {
                const completed = ini.status === 'completed';
                return (
                  <tr
                    key={ini.id}
                    className={completed ? 'row-completed' : undefined}
                  >
                    <td
                      style={{
                        position: 'sticky',
                        left: 0,
                        zIndex: 2,
                        background: 'var(--surface)',
                        borderRight: '1px solid var(--rule)',
                      }}
                    >
                      {ini.landing_page_url ? (
                        <a
                          href={ini.landing_page_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: 12,
                            color: completed ? 'var(--ink-muted)' : 'var(--blue)',
                            textDecoration: 'none',
                          }}
                        >
                          {ini.name}
                        </a>
                      ) : (
                        <span
                          style={{
                            fontSize: 12,
                            color: completed ? 'var(--ink-muted)' : 'var(--blue)',
                          }}
                        >
                          {ini.name}
                        </span>
                      )}
                      <div className="muted" style={{ fontSize: 10 }}>
                        {ini.owner || '—'}
                      </div>
                    </td>
                    {weeks.map((w) => {
                      const key = activityKey(ini.id, w.id);
                      const cell = activityByKey.get(key);
                      const loading = busyKey === key;
                      const hasText =
                        Boolean((cell?.cell_text || '').trim()) ||
                        fillDraft.get(key) === true;
                      return (
                        <td
                          key={w.id}
                          className="activity-cell"
                          style={{
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            background: hasText ? 'var(--teal-tint)' : 'var(--warm)',
                            opacity: completed ? 0.35 : 1,
                            position: 'relative',
                            padding: '4px 6px',
                          }}
                        >
                          <ActivityCellInput
                            initiativeId={ini.id}
                            weekId={w.id}
                            cell={cell}
                            disabled={completed}
                            busy={loading}
                            onSave={onCellSave}
                            onFillHint={reportFill}
                            inputStyle={{ background: 'transparent' }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <div
        style={{
          display: 'flex',
          gap: 24,
          marginTop: 16,
          fontSize: 10,
          color: 'var(--ink-muted)',
          flexWrap: 'wrap',
        }}
      >
        <span>Cells are free text; changes save when you leave the field.</span>
        <span style={{ opacity: 0.45 }}>
          Completed initiatives are read-only in the grid.
        </span>
      </div>
    </>
  );
}
