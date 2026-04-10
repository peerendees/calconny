import ICAL from "ical.js";
import type { CalendarEvent } from "./types";

const EXPAND_UNTIL_MS = 2 * 365 * 24 * 60 * 60 * 1000;
const MAX_OCCURRENCES = 2000;

function isCancelled(vevent: ICAL.Component): boolean {
  const status = vevent.getFirstPropertyValue("status");
  return status === "CANCELLED";
}

function timeToStartISO(t: ICAL.Time): string {
  if (t.isDate) {
    const y = t.year;
    const m = String(t.month).padStart(2, "0");
    const d = String(t.day).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return t.toJSDate().toISOString();
}

function timeToEndISO(t: ICAL.Time): string {
  if (t.isDate) {
    const y = t.year;
    const m = String(t.month).padStart(2, "0");
    const d = String(t.day).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return t.toJSDate().toISOString();
}

function mapOccurrence(
  ev: ICAL.Event,
  start: ICAL.Time,
  end: ICAL.Time,
  uidSuffix: string,
): CalendarEvent {
  let endNorm = end;
  if (start.isDate && endNorm.isDate && endNorm.compare(start) <= 0) {
    endNorm = start.clone();
    endNorm.day += 1;
  }

  const allDay = start.isDate;
  const title = ev.summary ?? "(Ohne Titel)";
  const description =
    typeof ev.description === "string" ? ev.description : undefined;
  const location = typeof ev.location === "string" ? ev.location : undefined;

  return {
    id: `${ev.uid}-${uidSuffix}`,
    title,
    start: timeToStartISO(start),
    end: timeToEndISO(endNorm),
    allDay,
    description,
    location,
  };
}

function expandEvent(ev: ICAL.Event): CalendarEvent[] {
  const out: CalendarEvent[] = [];
  const until = Date.now() + EXPAND_UNTIL_MS;

  if (!ev.isRecurring()) {
    const start = ev.startDate;
    const end = ev.endDate;
    return [
      mapOccurrence(ev, start, end, `${start.toICALString()}-${end.toICALString()}`),
    ];
  }

  const it = ev.iterator();
  let next: ICAL.Time | null;
  let count = 0;

  while (count < MAX_OCCURRENCES) {
    next = it.next();
    if (!next) break;
    const js = next.toJSDate().getTime();
    if (js > until) break;

    const details = ev.getOccurrenceDetails(next);
    out.push(
      mapOccurrence(
        details.item,
        details.startDate,
        details.endDate,
        details.startDate.toICALString(),
      ),
    );
    count += 1;
  }

  return out;
}

export function parseIcsToCalendarEvents(icsText: string): CalendarEvent[] {
  const jcal = ICAL.parse(icsText);
  const root = new ICAL.Component(jcal);
  const vevents = root.getAllSubcomponents("vevent");
  const results: CalendarEvent[] = [];

  for (const vevent of vevents) {
    if (isCancelled(vevent)) continue;
    try {
      const ev = new ICAL.Event(vevent);
      if (ev.isRecurrenceException()) continue;
      results.push(...expandEvent(ev));
    } catch {
      continue;
    }
  }

  return results;
}
