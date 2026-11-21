export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  description?: string;
  location?: string;
  organizer?: string;
  attendees?: string[];
  status?: "confirmed" | "tentative" | "cancelled";
  bookingMeta?: Record<string, unknown>;
}

export type CalendarView = "dayGridMonth" | "slidingWeek" | "listWeek";

/** Antwort von GET /api/calendar */
export interface CalendarApiResponse {
  events: CalendarEvent[];
  warnings?: string[];
  /** Zeitpunkt, zu dem der Server die Antwort erzeugt hat (ISO 8601). */
  generatedAt?: string;
}
