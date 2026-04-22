/** Monday (local) of the calendar week containing `date` (Mon–Sun convention for display). */
function mondayOfCalendarWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

/**
 * ISO 8601: Monday start; week 1 is the week with the year's first Thursday.
 * Returns { week_number, year, monday } where `year` is the ISO week-year.
 */
function isoWeekFromDate(date) {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const monday = mondayOfCalendarWeek(day);
  const thursday = new Date(monday);
  thursday.setDate(monday.getDate() + 3);
  const isoYear = thursday.getFullYear();

  const jan4 = new Date(isoYear, 0, 4);
  const week1Monday = mondayOfCalendarWeek(jan4);

  const msDay = 86400000;
  let weekNumber = Math.round((monday - week1Monday) / msDay / 7) + 1;

  if (weekNumber < 1) {
    return isoWeekFromDate(new Date(isoYear - 1, 11, 31));
  }

  const dec31 = new Date(isoYear, 11, 31);
  const lastMonday = mondayOfCalendarWeek(dec31);
  const weeksInIsoYear =
    Math.round((lastMonday - week1Monday) / msDay / 7) + 1;

  if (weekNumber > weeksInIsoYear) {
    const nextJan4 = new Date(isoYear + 1, 0, 4);
    const nextMonday = mondayOfCalendarWeek(nextJan4);
    return { week_number: 1, year: isoYear + 1, monday: nextMonday };
  }

  return { week_number: weekNumber, year: isoYear, monday };
}

function normalizeIsoWeekParts(w) {
  const { week_number, year, monday } = w;
  return { week_number, year, monday };
}

/** All ISO week Mondays that overlap Gregorian calendar year `y`. */
function allMondaysOverlappingYear(y) {
  const jan1 = new Date(y, 0, 1);
  const dec31 = new Date(y, 11, 31);
  let mon = mondayOfCalendarWeek(jan1);
  const out = [];
  while (mon <= dec31) {
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    if (sun >= jan1 && mon <= dec31) {
      const iso = normalizeIsoWeekParts(isoWeekFromDate(mon));
      out.push({
        week_number: iso.week_number,
        year: iso.year,
        start_date: new Date(mon.getTime()),
      });
    }
    const next = new Date(mon.getTime());
    next.setDate(next.getDate() + 7);
    mon = next;
  }
  return out;
}

/** Also include early weeks of y+1 whose Monday is after Dec 31 but week overlaps — covered by loop until mon > dec31. Actually weeks starting late Dec may belong to next ISO year; loop handles. */
function allWeekRowsForSeedYears(startYear, endYear) {
  const map = new Map();
  for (let y = startYear; y <= endYear; y += 1) {
    for (const row of allMondaysOverlappingYear(y)) {
      const key = `${row.year}-W${row.week_number}`;
      map.set(key, row);
    }
  }
  return [...map.values()].sort(
    (a, b) =>
      a.start_date.getTime() - b.start_date.getTime() || a.year - b.year
  );
}

function addDays(date, days) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

module.exports = {
  mondayOfCalendarWeek,
  isoWeekFromDate,
  allMondaysOverlappingYear,
  allWeekRowsForSeedYears,
  addDays,
};
