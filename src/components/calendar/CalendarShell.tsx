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

export function CalendarShell() {
  const calRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<EventInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rangeTitle, setRangeTitle] = useState("");
  const [activeView, setActiveView] = useState<CalendarView>("dayGridMonth");
  const [narrow, setNarrow] = useState(false);

  const weekViewId = narrow ? "slidingWeekNarrow" : "slidingWeek";

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/calendar");
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            typeof data.error === "string" ? data.error : "Kalender konnte nicht geladen werden.",
          );
        }
        if (!cancelled) {
          setEvents(mapToInputs(data as CalendarEvent[]));
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Unbekannter Fehler");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
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
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden px-0">
      <ViewSwitcher
        active={activeView}
        rangeTitle={rangeTitle}
        onViewChange={goView}
        onPrev={goPrev}
        onNext={goNext}
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
