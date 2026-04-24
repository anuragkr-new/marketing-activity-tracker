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
  /** When set, notifies whether the field has non-whitespace text (for row tint); cleared on unmount. */
  onFillHint,
}) {
  const serverText = cell?.cell_text ?? '';
  const [value, setValue] = useState(serverText);

  useEffect(() => {
    setValue(serverText);
  }, [serverText, cell?.updated_at, initiativeId, weekId]);

  useEffect(() => {
    if (!onFillHint) return;
    onFillHint(initiativeId, weekId, value.trim().length > 0);
  }, [value, initiativeId, weekId, onFillHint]);

  useEffect(() => {
    if (!onFillHint) return undefined;
    return () => {
      onFillHint(initiativeId, weekId, false);
    };
  }, [initiativeId, weekId, onFillHint]);

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
