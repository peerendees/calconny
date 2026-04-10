/**
 * Deutscher Zeitraum-Titel für FullCalendar (end ist exklusiv).
 * z. B. "15. – 21. Juni 2026", "28. Apr. – 4. Mai 2026".
 * Ein Tag: "Do., 24. April 2026" (kein "24. – 24.").
 */

function formatSingleDayGerman(d: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** Monatsansicht: nur Monat und Jahr, z. B. "April 2026". */
export function formatMonthYearGerman(d: Date): string {
  return new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" }).format(d);
}

function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatGermanRangeTitle(start: Date, endExclusive: Date): string {
  const endInclusive = new Date(endExclusive);
  endInclusive.setMilliseconds(endInclusive.getMilliseconds() - 1);

  if (sameCalendarDay(start, endInclusive)) {
    return formatSingleDayGerman(start);
  }

  const y1 = start.getFullYear();
  const y2 = endInclusive.getFullYear();
  const m1 = start.getMonth();
  const m2 = endInclusive.getMonth();
  const d1 = start.getDate();
  const d2 = endInclusive.getDate();

  const monthLong = (d: Date) =>
    new Intl.DateTimeFormat("de-DE", { month: "long" }).format(d);
  const monthShortPunct = (d: Date) => {
    const s = new Intl.DateTimeFormat("de-DE", { month: "short" }).format(d);
    return s.endsWith(".") ? s : `${s}.`;
  };

  if (y1 === y2 && m1 === m2) {
    return `${d1}. – ${d2}. ${monthLong(start)} ${y1}`;
  }
  if (y1 === y2) {
    return `${d1}. ${monthShortPunct(start)} – ${d2}. ${monthLong(endInclusive)} ${y2}`;
  }
  return `${d1}. ${monthLong(start)} ${y1} – ${d2}. ${monthLong(endInclusive)} ${y2}`;
}
