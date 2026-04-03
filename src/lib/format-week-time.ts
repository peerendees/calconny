/** Zeit wie 7:00 oder 12:30 — ohne führende Stunden-Null, ohne „Uhr“. */
export function formatWeekAxisTime(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  return `${h}:${m.toString().padStart(2, "0")}`;
}
