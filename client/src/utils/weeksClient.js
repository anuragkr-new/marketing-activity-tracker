import { isDateInWeekRange } from './dates.js';

/** Merge /api/weeks?offset=-i for i=0..n until we have 4 weeks ending at current calendar week. */
export async function loadLastFourWeeksIncludingCurrent(api) {
  const byId = new Map();
  for (let i = 0; i < 30; i += 1) {
    const chunk = await api(`/api/weeks?offset=${-i}`);
    for (const w of chunk) byId.set(w.id, w);
    const sorted = [...byId.values()].sort((a, b) =>
      a.start_date.localeCompare(b.start_date)
    );
    const curIdx = sorted.findIndex((w) =>
      isDateInWeekRange(w.start_date)
    );
    if (curIdx >= 3) {
      return sorted.slice(curIdx - 3, curIdx + 1);
    }
  }
  const sorted = [...byId.values()].sort((a, b) =>
    a.start_date.localeCompare(b.start_date)
  );
  const curIdx = sorted.findIndex((w) => isDateInWeekRange(w.start_date));
  if (curIdx < 0) return sorted.slice(-4);
  return sorted.slice(Math.max(0, curIdx - 3), curIdx + 1);
}
