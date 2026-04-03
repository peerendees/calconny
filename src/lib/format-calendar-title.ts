/**
 * Deutscher Zeitraum-Titel für FullCalendar (end ist exklusiv).
 * z. B. "15. – 21. Juni 2026", "28. Apr. – 4. Mai 2026".
 */
export function formatGermanRangeTitle(start: Date, endExclusive: Date): string {
  const end = new Date(endExclusive);
  end.setMilliseconds(end.getMilliseconds() - 1);

  const y1 = start.getFullYear();
  const y2 = end.getFullYear();
  const m1 = start.getMonth();
  const m2 = end.getMonth();
  const d1 = start.getDate();
  const d2 = end.getDate();

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
    return `${d1}. ${monthShortPunct(start)} – ${d2}. ${monthLong(end)} ${y2}`;
  }
  return `${d1}. ${monthLong(start)} ${y1} – ${d2}. ${monthLong(end)} ${y2}`;
}
