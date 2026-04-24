import { isDateInWeekRange, mondayOfCalendarWeek, parseStartDate } from './dates.js';

/**
 * From an ordered list of week rows (e.g. GET /api/weeks?offset=0), return at most four
 * consecutive weeks: calendar current week through +3.
 */
export function selectCurrentPlusThreeWeeks(weeks, ref = new Date()) {
  if (!weeks?.length) return [];
  let i = weeks.findIndex((w) => isDateInWeekRange(w.start_date, ref));
  if (i === -1) {
    const mon = mondayOfCalendarWeek(ref);
    mon.setHours(0, 0, 0, 0);
    i = weeks.findIndex((w) => {
      const s = parseStartDate(w.start_date);
      s.setHours(0, 0, 0, 0);
      return s.getTime() >= mon.getTime();
    });
    if (i === -1) {
      return weeks.slice(0, Math.min(4, weeks.length));
    }
  }
  return weeks.slice(i, i + 4);
}
