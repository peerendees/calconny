/** Datum für Listenansicht und Event-Detail (de-DE, kompakt). */
export function formatListEventDateLabel(d: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}
