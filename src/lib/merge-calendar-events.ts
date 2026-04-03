import type { CalendarEvent } from "./types";

/** Duplikate über mehrere Feeds hinweg vermeiden (gleiche UID + Start). */
export function mergeCalendarEvents(chunks: CalendarEvent[][]): CalendarEvent[] {
  const map = new Map<string, CalendarEvent>();
  for (const chunk of chunks) {
    for (const e of chunk) {
      const key = `${e.id}|${e.start}`;
      if (!map.has(key)) map.set(key, e);
    }
  }
  return [...map.values()];
}
