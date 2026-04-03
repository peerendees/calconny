"use client";

import type { EventInput } from "@fullcalendar/core";
import deLocale from "@fullcalendar/core/locales/de";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CalendarEvent, CalendarView } from "@/lib/types";
import { EventCard } from "./EventCard";
import { ViewSwitcher } from "./ViewSwitcher";

function mapToInputs(events: CalendarEvent[]): EventInput[] {
  return events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    allDay: e.allDay,
    extendedProps: {
      description: e.description,
      location: e.location,
    },
  }));
}

function parseCalendarApi(data: unknown): { events: CalendarEvent[]; warnings?: string[] } {
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    (!("events" in data) || !(data as { events?: unknown }).events)
  ) {
    throw new Error(String((data as { error: unknown }).error));
  }
  if (Array.isArray(data)) {
    return { events: data as CalendarEvent[] };
  }
  if (
    data &&
    typeof data === "object" &&
    "events" in data &&
    Array.isArray((data as { events: unknown }).events)
  ) {
    const o = data as { events: CalendarEvent[]; warnings?: string[] };
    return { events: o.events, warnings: o.warnings };
  }
  throw new Error("Ungültige Kalender-Antwort");
}

async function loadCalendar(refresh: boolean): Promise<{ events: CalendarEvent[]; warnings?: string[] }> {
  const url = refresh ? `/api/calendar?refresh=1&t=${Date.now()}` : "/api/calendar";
  const res = await fetch(url, {
    cache: "no-store",
    headers: refresh
      ? { "Cache-Control": "no-cache", Pragma: "no-cache" }
      : {},
  });
  const data: unknown = await res.json();
  if (!res.ok) {
    throw new Error(
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : "Kalender konnte nicht geladen werden.",
    );
  }
  return parseCalendarApi(data);
}

export function CalendarShell() {
  const calRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<EventInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [rangeTitle, setRangeTitle] = useState("");
  const [activeView, setActiveView] = useState<CalendarView>("dayGridMonth");
  const [narrow, setNarrow] = useState(false);

  const weekViewId = narrow ? "slidingWeekNarrow" : "slidingWeek";

  const runLoad = useCallback(async (refresh: boolean) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const { events: evs, warnings: w } = await loadCalendar(refresh);
      setEvents(mapToInputs(evs));
      setWarnings(w ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
      setWarnings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void runLoad(false);
  }, [runLoad]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const syncViewFromCalendar = useCallback((viewType: string) => {
    if (viewType === "dayGridMonth") setActiveView("dayGridMonth");
    else if (viewType === "listWeek") setActiveView("listWeek");
    else if (viewType === "slidingWeek" || viewType === "slidingWeekNarrow") {
      setActiveView("slidingWeek");
    }
  }, []);

  useEffect(() => {
    const api = calRef.current?.getApi();
    if (!api) return;
    if (activeView !== "slidingWeek") return;
    api.changeView(weekViewId);
  }, [narrow, activeView, weekViewId]);

  function goView(view: CalendarView) {
    const api = calRef.current?.getApi();
    if (!api) return;
    setActiveView(view);
    if (view === "dayGridMonth") api.changeView("dayGridMonth");
    else if (view === "listWeek") api.changeView("listWeek");
    else api.changeView(weekViewId);
  }

  function goPrev() {
    calRef.current?.getApi().prev();
  }

  function goNext() {
    calRef.current?.getApi().next();
  }

  if (loading) {
    return (
      <div className="rounded border border-[var(--border)] bg-[var(--card)] px-6 py-16 text-center font-[family-name:var(--font-body)] text-[var(--muted)]">
        Kalender wird geladen …
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded border border-[var(--border)] bg-[var(--card)] px-6 py-8 text-center">
        <p className="font-[family-name:var(--font-body)] text-[var(--text)]">{error}</p>
        <button
          type="button"
          onClick={() => void runLoad(true)}
          className="mt-4 rounded border border-[var(--copper)] bg-[var(--copper)] px-4 py-2 font-[family-name:var(--font-mono)] text-sm uppercase text-[var(--bg)]"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden px-0">
      {warnings.length > 0 ? (
        <div
          className="mb-4 rounded border border-[var(--border)] bg-[var(--card)] px-3 py-2 font-[family-name:var(--font-body)] text-sm text-[var(--muted2)]"
          role="status"
        >
          <p className="font-[family-name:var(--font-mono)] text-xs uppercase text-[var(--muted)]">
            Hinweis zu Feeds
          </p>
          <ul className="mt-1 list-inside list-disc">
            {warnings.map((w, i) => (
              <li key={`${i}-${w.slice(0, 40)}`}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <ViewSwitcher
        active={activeView}
        rangeTitle={rangeTitle}
        onViewChange={goView}
        onPrev={goPrev}
        onNext={goNext}
        onRefresh={() => void runLoad(true)}
        refreshing={refreshing}
      />
      <div className="mt-4 min-h-[480px] w-full max-w-full">
        <FullCalendar
          ref={calRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          locale={deLocale}
          initialView="dayGridMonth"
          firstDay={1}
          height="auto"
          headerToolbar={false}
          navLinks
          events={events}
          views={{
            slidingWeek: {
              type: "timeGrid",
              duration: { days: 7 },
              dateIncrement: { days: 1 },
            },
            slidingWeekNarrow: {
              type: "timeGrid",
              duration: { days: 3 },
              dateIncrement: { days: 1 },
            },
          }}
          datesSet={(arg) => {
            setRangeTitle(arg.view.title);
          }}
          viewDidMount={(arg) => {
            syncViewFromCalendar(arg.view.type);
          }}
          eventContent={(arg) => {
            if (arg.view.type.startsWith("list")) {
              return (
                <EventCard
                  title={arg.event.title}
                  timeLabel={arg.timeText}
                  location={arg.event.extendedProps?.location as string | undefined}
                />
              );
            }
            return undefined;
          }}
        />
      </div>
    </div>
  );
}
