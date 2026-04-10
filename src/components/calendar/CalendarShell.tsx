"use client";

import type { EventApi, EventClickArg, EventInput } from "@fullcalendar/core";
import deLocale from "@fullcalendar/core/locales/de";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { formatGermanRangeTitle } from "@/lib/format-calendar-title";
import { formatListEventDateLabel } from "@/lib/format-list-event-date";
import { formatWeekAxisTime } from "@/lib/format-week-time";
import type { CalendarEvent, CalendarView } from "@/lib/types";
import { EventCard } from "./EventCard";
import { EventDetailModal } from "./EventDetailModal";
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

/** Wochenansicht: sichtbarer Bereich ~6 h, ab 7:00 nach unten scrollbar (Tagesfenster 7–23 Uhr). */
const weekTimeGridOpts = {
  slotMinTime: "07:00:00",
  slotMaxTime: "23:00:00",
  scrollTime: "07:00:00",
  slotDuration: "00:30:00",
  height: 420,
  weekNumbers: true,
  slotLabelContent: (arg: { date: Date }) => formatWeekAxisTime(arg.date),
  eventTimeFormat: {
    hour: "numeric" as const,
    minute: "2-digit" as const,
    hour12: false,
  },
};

/** Custom-Views heißen slidingWeek / slidingWeekNarrow – nicht „timeGrid“ im view.type. */
function isWeekGridView(viewType: string): boolean {
  return (
    viewType === "slidingWeek" ||
    viewType === "slidingWeekNarrow" ||
    viewType.includes("timeGrid")
  );
}

function weekdayAbbrevDe(d: Date): string {
  const short = new Intl.DateTimeFormat("de-DE", { weekday: "short" }).format(d);
  const base = short.replace(/\.$/, "").trim();
  return `${base.toUpperCase()}.`;
}

function formatEventTimeLabel(ev: EventApi): string {
  if (ev.allDay) {
    return "Ganztägig";
  }
  const start = ev.start;
  const end = ev.end;
  if (!start) {
    return "";
  }
  if (end) {
    return `${formatWeekAxisTime(start)} – ${formatWeekAxisTime(end)}`;
  }
  return formatWeekAxisTime(start);
}

type EventDetailState = {
  title: string;
  dateLabel: string;
  timeLabel: string;
  location?: string;
  description?: string;
};

const SWIPE_MIN_PX = 50;

export function CalendarShell() {
  const calRef = useRef<FullCalendar>(null);
  const swipeAreaRef = useRef<HTMLDivElement>(null);
  const swipeStartRef = useRef({ x: 0, y: 0 });
  const [events, setEvents] = useState<EventInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [rangeTitle, setRangeTitle] = useState("");
  const [activeView, setActiveView] = useState<CalendarView>("dayGridMonth");
  const [narrow, setNarrow] = useState(false);
  const [eventDetail, setEventDetail] = useState<EventDetailState | null>(null);

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

  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  /** BER-42: Wisch links → nächster Zeitraum, rechts → vorheriger (alle Ansichten). */
  useEffect(() => {
    const el = swipeAreaRef.current;
    if (!el) return;

    function onTouchStart(e: TouchEvent) {
      const t = e.touches[0];
      swipeStartRef.current = { x: t.clientX, y: t.clientY };
    }

    function onTouchEnd(e: TouchEvent) {
      const t = e.changedTouches[0];
      const dx = t.clientX - swipeStartRef.current.x;
      const dy = t.clientY - swipeStartRef.current.y;
      if (Math.abs(dx) < SWIPE_MIN_PX) return;
      if (Math.abs(dx) < Math.abs(dy)) return;

      const api = calRef.current?.getApi();
      if (!api) return;
      if (dx > 0) api.prev();
      else api.next();
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
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

  function goPrevPeriod() {
    calRef.current?.getApi().prev();
  }

  function goNextPeriod() {
    calRef.current?.getApi().next();
  }

  function goPrevDay() {
    calRef.current?.getApi().prev();
  }

  function goNextDay() {
    calRef.current?.getApi().next();
  }

  function goPrevWeek() {
    calRef.current?.getApi().incrementDate({ days: -7 });
  }

  function goNextWeek() {
    calRef.current?.getApi().incrementDate({ days: 7 });
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

  function handleEventClick(info: EventClickArg) {
    info.jsEvent.preventDefault();
    const ev = info.event;
    const start = ev.start;
    const dateLabel = start ? formatListEventDateLabel(start) : "";
    setEventDetail({
      title: (ev.title && String(ev.title).trim()) || "(Ohne Titel)",
      dateLabel,
      timeLabel: formatEventTimeLabel(ev),
      location: ev.extendedProps?.location as string | undefined,
      description: ev.extendedProps?.description as string | undefined,
    });
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden px-0">
      {eventDetail ? (
        <EventDetailModal
          open
          onClose={() => setEventDetail(null)}
          title={eventDetail.title}
          dateLabel={eventDetail.dateLabel}
          timeLabel={eventDetail.timeLabel}
          location={eventDetail.location}
          description={eventDetail.description}
        />
      ) : null}
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
        onPrevPeriod={goPrevPeriod}
        onNextPeriod={goNextPeriod}
        onPrevDay={goPrevDay}
        onNextDay={goNextDay}
        onPrevWeek={goPrevWeek}
        onNextWeek={goNextWeek}
        showWeekStepNav={activeView === "slidingWeek"}
        onRefresh={() => void runLoad(true)}
        refreshing={refreshing}
      />
      <div
        ref={swipeAreaRef}
        className="calconny-calendar-swipe mt-4 min-h-[480px] w-full max-w-full touch-pan-y"
      >
        <FullCalendar
          ref={calRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          locale={deLocale}
          initialView={narrow ? "listWeek" : "dayGridMonth"}
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
              ...weekTimeGridOpts,
            },
            slidingWeekNarrow: {
              type: "timeGrid",
              duration: { days: 3 },
              dateIncrement: { days: 1 },
              ...weekTimeGridOpts,
            },
          }}
          datesSet={(arg) => {
            setRangeTitle(formatGermanRangeTitle(arg.start, arg.end));
          }}
          dayHeaderContent={(arg) => {
            if (!isWeekGridView(arg.view.type)) {
              return undefined;
            }
            const d = arg.date;
            return (
              <div className="calconny-week-day-head flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-t-lg bg-[var(--card)] px-0.5 py-1.5">
                <span className="font-[family-name:var(--font-mono)] text-[0.6rem] font-medium uppercase tracking-wide text-[var(--muted)]">
                  {weekdayAbbrevDe(d)}
                </span>
                <span className="font-[family-name:var(--font-body)] text-lg font-semibold leading-none tabular-nums text-[var(--copper)]">
                  {d.getDate()}
                </span>
              </div>
            );
          }}
          viewDidMount={(arg) => {
            syncViewFromCalendar(arg.view.type);
          }}
          eventClick={handleEventClick}
          eventContent={(arg) => {
            if (arg.view.type.startsWith("list")) {
              const start = arg.event.start;
              const dateLabel = start ? formatListEventDateLabel(start) : "";
              return (
                <EventCard
                  title={arg.event.title}
                  dateLabel={dateLabel}
                  timeLabel={arg.timeText}
                  location={arg.event.extendedProps?.location as string | undefined}
                  description={arg.event.extendedProps?.description as string | undefined}
                />
              );
            }
            if (arg.view.type === "dayGridMonth") {
              const title = arg.event.title || "(Ohne Titel)";
              const timeLabel = arg.event.allDay ? "Ganztägig" : arg.timeText || "";
              return (
                <div className="calconny-month-event flex min-w-0 flex-col gap-px py-0.5">
                  {timeLabel ? (
                    <div className="fc-event-time text-[0.65rem] leading-tight text-[var(--muted)]">
                      {timeLabel}
                    </div>
                  ) : null}
                  <div className="fc-event-title min-w-0 truncate text-[0.75rem] leading-snug text-[var(--text)]">
                    {title}
                  </div>
                </div>
              );
            }
            if (isWeekGridView(arg.view.type) && !arg.event.allDay) {
              const start = arg.event.start;
              if (!start) return undefined;
              const end = arg.event.end;
              const timeStr = end
                ? `${formatWeekAxisTime(start)} – ${formatWeekAxisTime(end)}`
                : formatWeekAxisTime(start);
              const desc = (arg.event.extendedProps?.description as string | undefined)?.trim();
              return (
                <div className="calconny-week-timed-event flex min-w-0 flex-col gap-0.5">
                  <div className="fc-event-time">{timeStr}</div>
                  <div className="fc-event-title">{arg.event.title}</div>
                  {desc ? (
                    <div className="line-clamp-2 font-[family-name:var(--font-body)] text-[0.65rem] leading-snug text-[var(--muted2)]">
                      {desc}
                    </div>
                  ) : null}
                </div>
              );
            }
            if (isWeekGridView(arg.view.type) && arg.event.allDay) {
              const title = arg.event.title || "(Ohne Titel)";
              const desc = (arg.event.extendedProps?.description as string | undefined)?.trim();
              return (
                <div className="calconny-week-allday-event flex min-w-0 flex-col gap-0.5">
                  <div className="fc-event-title text-[0.8rem] leading-tight">{title}</div>
                  {desc ? (
                    <div className="line-clamp-2 font-[family-name:var(--font-body)] text-[0.65rem] leading-snug text-[var(--muted2)]">
                      {desc}
                    </div>
                  ) : null}
                </div>
              );
            }
            return undefined;
          }}
        />
      </div>
    </div>
  );
}
