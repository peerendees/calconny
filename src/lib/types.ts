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
