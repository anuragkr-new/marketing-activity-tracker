export function formatUS(isoDateOrString) {
  const d =
    typeof isoDateOrString === 'string'
      ? parseYMD(isoDateOrString)
      : isoDateOrString;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

export function formatUSDateTime(iso) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

function parseYMD(s) {
  const [y, m, d] = s.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function mondayOfCalendarWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function parseStartDate(startDateStr) {
  return parseYMD(startDateStr);
}

export function isDateInWeekRange(startDateStr, ref = new Date()) {
  const start = parseYMD(startDateStr);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const t = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  return t >= start && t <= end;
}

export function weekRangeLabel(startDateStr) {
  const start = parseYMD(startDateStr);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const a = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(start);
  const b = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(end);
  return `${a} to ${b}`;
}
