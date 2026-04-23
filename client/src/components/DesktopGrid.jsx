import React, { useMemo, useState } from 'react';
import { formatUS, isDateInWeekRange, formatUSDateTime } from '../utils/dates.js';
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

export default function DesktopGrid({
  initiatives,
  weeks,
  activityByKey,
  onCellSave,
  offset,
  setOffset,
  busyKey,
}) {
  const [tip, setTip] = useState(null);
  const groups = useMemo(() => groupInitiatives(initiatives), [initiatives]);

  return (
    <div style={{ overflow: 'auto', maxWidth: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 8,
          marginBottom: 10,
        }}
      >
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setOffset((o) => o - 1)}
          aria-label="Previous weeks"
        >
          ←
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setOffset((o) => o + 1)}
          aria-label="Next weeks"
        >
          →
        </button>
      </div>
      <table
        className="table-plain"
        style={{ width: '100%', minWidth: 720, tableLayout: 'fixed' }}
      >
        <thead>
          <tr>
            <th
              style={{
                position: 'sticky',
                left: 0,
                zIndex: 3,
                background: 'var(--surface)',
                width: '28%',
                minWidth: 180,
                maxWidth: 320,
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
                    width: `${72 / Math.max(weeks.length, 1)}%`,
                    minWidth: 0,
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
                        width: '28%',
                        minWidth: 180,
                        maxWidth: 320,
                        boxSizing: 'border-box',
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
                      const hasText = Boolean((cell?.cell_text || '').trim());
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
                            padding: '4px 4px',
                            width: `${72 / Math.max(weeks.length, 1)}%`,
                            minWidth: 0,
                          }}
                          onMouseEnter={(e) => {
                            if (!cell?.updated_at) return;
                            setTip({
                              x: e.clientX,
                              y: e.clientY,
                              text: `Last updated · ${formatUSDateTime(cell.updated_at)}`,
                            });
                          }}
                          onMouseMove={(e) => {
                            if (!cell?.updated_at) return;
                            setTip((t) =>
                              t
                                ? {
                                    ...t,
                                    x: e.clientX,
                                    y: e.clientY,
                                  }
                                : t
                            );
                          }}
                          onMouseLeave={() => setTip(null)}
                        >
                          <ActivityCellInput
                            initiativeId={ini.id}
                            weekId={w.id}
                            cell={cell}
                            disabled={completed}
                            busy={loading}
                            onSave={onCellSave}
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
      {tip ? (
        <div
          style={{
            position: 'fixed',
            left: tip.x + 12,
            top: (tip.y || 0) + 12,
            zIndex: 50,
            fontSize: 11,
            background: 'var(--surface)',
            border: '1px solid var(--rule)',
            padding: '6px 10px',
            pointerEvents: 'none',
            maxWidth: 280,
          }}
        >
          {tip.text}
        </div>
      ) : null}
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
    </div>
  );
}
