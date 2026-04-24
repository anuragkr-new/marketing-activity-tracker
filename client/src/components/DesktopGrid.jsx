import ActivityGridTable from './ActivityGridTable.jsx';

export default function DesktopGrid({
  initiatives,
  weeks,
  activityByKey,
  onCellSave,
  busyKey,
  showOffsetControls = true,
  setOffset,
}) {
  return (
    <div style={{ overflow: 'auto', maxWidth: '100%' }}>
      {showOffsetControls && setOffset ? (
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
      ) : null}
      <ActivityGridTable
        initiatives={initiatives}
        weeks={weeks}
        activityByKey={activityByKey}
        onCellSave={onCellSave}
        busyKey={busyKey}
      />
    </div>
  );
}
