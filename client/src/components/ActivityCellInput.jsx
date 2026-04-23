import { useEffect, useState } from 'react';

/**
 * Free-text cell for initiative × week; syncs from server row, commits on blur when changed.
 */
export default function ActivityCellInput({
  initiativeId,
  weekId,
  cell,
  disabled,
  busy,
  onSave,
  inputStyle,
}) {
  const serverText = cell?.cell_text ?? '';
  const [value, setValue] = useState(serverText);

  useEffect(() => {
    setValue(serverText);
  }, [serverText, cell?.updated_at, initiativeId, weekId]);

  return (
    <input
      type="text"
      className="input"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (disabled || busy) return;
        const next = value;
        if (next === serverText) return;
        onSave(initiativeId, weekId, next);
      }}
      disabled={disabled || busy}
      placeholder="—"
      style={{
        width: '100%',
        minWidth: 64,
        maxWidth: 140,
        margin: '0 auto',
        display: 'block',
        fontSize: 11,
        padding: '4px 6px',
        textAlign: 'left',
        boxSizing: 'border-box',
        ...inputStyle,
      }}
    />
  );
}
