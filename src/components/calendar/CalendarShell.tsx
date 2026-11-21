"use client";

import type { EventApi, EventClickArg, EventInput } from "@fullcalendar/core";
import deLocale from "@fullcalendar/core/locales/de";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { formatGermanRangeTitle, formatMonthYearGerman } from "@/lib/format-calendar-title";
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

type CalendarLoadResult = { events: CalendarEvent[]; warnings?: string[]; generatedAt?: string };

function readApiError(data: unknown): string | null {
  if (data && typeof data === "object" && "error" in data) {
    const text = String((data as { error: unknown }).error).trim();
    return text || null;
  }
  return null;
}

function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** Ganztags-Datum (YYYY-MM-DD) als lokale Mitternacht, sonst der ISO-Zeitpunkt. */
function parseEventDate(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
}

/**
 * Alle Kalendertage (lokal), an denen mindestens ein Termin liegt – mehrtägige Termine
 * zählen für jeden berührten Tag. Grundlage der Tagesmarkierung in der mobilen Monatsansicht.
 */
function collectBusyDays(events: CalendarEvent[]): Set<string> {
  const MAX_SPAN_DAYS = 400;
  const days = new Set<string>();
  for (const e of events) {
    const start = parseEventDate(e.start);
    if (Number.isNaN(start.getTime())) continue;
    let last = start;
    if (e.end) {
      const end = parseEventDate(e.end);
      // end ist exklusiv: ein Termin bis 00:00 berührt den Folgetag nicht mehr
      if (!Number.isNaN(end.getTime()) && end > start) last = new Date(end.getTime() - 1);
    }
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    for (let i = 0; i < MAX_SPAN_DAYS && cursor <= last; i++) {
      days.add(localDayKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return days;
}

function parseCalendarApi(data: unknown): CalendarLoadResult {
  if (Array.isArray(data)) {
    return { events: data as CalendarEvent[] };
  }
  if (
    data &&
    typeof data === "object" &&
    "events" in data &&
    Array.isArray((data as { events: unknown }).events)
  ) {
    const o = data as CalendarLoadResult;
    return { events: o.events, warnings: o.warnings, generatedAt: o.generatedAt };
  }
  throw new Error(readApiError(data) ?? "Ungültige Kalender-Antwort vom Server.");
}

async function loadCalendar(refresh: boolean): Promise<CalendarLoadResult> {
  const url = refresh ? `/api/calendar?refresh=1&t=${Date.now()}` : "/api/calendar";
  let res: Response;
  try {
    res = await fetch(url, {
      cache: "no-store",
      headers: refresh
        ? { "Cache-Control": "no-cache", Pragma: "no-cache" }
        : {},
    });
  } catch {
    throw new Error(
      "Keine Verbindung zum Kalender-Server. Bitte Internetverbindung prüfen und neu laden.",
    );
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* kein JSON, z. B. HTML-Fehlerseite eines vorgeschalteten Proxys */
  }
  if (!res.ok) {
    throw new Error(
      readApiError(data) ?? `Kalender konnte nicht geladen werden (HTTP ${res.status}).`,
    );
  }
  return parseCalendarApi(data);
}

/**
 * Ab diesem Alter gilt eine Antwort als Zwischenspeicher-Stand (z. B. offline aus dem
 * Service-Worker-Cache) – das CDN hält höchstens rund 6 Minuten vor.
 */
const STALE_AFTER_MS = 15 * 60 * 1000;
/** Kehrt die App in den Vordergrund zurück, wird ab diesem Alter still neu geladen. */
const AUTO_REFRESH_AFTER_MS = 5 * 60 * 1000;

function formatAsOf(ms: number): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ms));
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

const SWIPE_MIN_PX = 60;
/** Der Horizontalanteil muss klar überwiegen – sonst ist es (schräges) Scrollen oder Pull-to-Refresh. */
const SWIPE_DIRECTION_RATIO = 1.5;
/** Langsames Ziehen ist kein Wisch. */
const SWIPE_MAX_MS = 800;
/**
 * Randzone der System-Gesten (Android-Zurück, iOS-Wischen-zurück): dort beginnende
 * Berührungen gehören dem System und blättern nicht.
 */
const SWIPE_EDGE_GUARD_PX = 32;

type LoadMode = "blocking" | "refresh" | "silent";

export function CalendarShell() {
  const calRef = useRef<FullCalendar>(null);
  const swipeAreaRef = useRef<HTMLDivElement>(null);
  const swipeStartRef = useRef({ x: 0, y: 0, t: 0, active: false });
  const [events, setEvents] = useState<EventInput[]>([]);
  const [busyDays, setBusyDays] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  /** Nicht blockierender Hinweis: Aktualisierung fehlgeschlagen, alter Stand bleibt sichtbar. */
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [dataAsOf, setDataAsOf] = useState<number | null>(null);
  const [stale, setStale] = useState(false);
  const hasDataRef = useRef(false);
  const inFlightRef = useRef(false);
  const lastAttemptRef = useRef(0);
  const [rangeTitle, setRangeTitle] = useState("");
  const [activeView, setActiveView] = useState<CalendarView>("dayGridMonth");
  const [narrow, setNarrow] = useState(false);
  const [eventDetail, setEventDetail] = useState<EventDetailState | null>(null);

  const weekViewId = narrow ? "slidingWeekNarrow" : "slidingWeek";

  const applyResult = useCallback((result: CalendarLoadResult) => {
    const parsed = result.generatedAt ? Date.parse(result.generatedAt) : Number.NaN;
    const asOf = Number.isNaN(parsed) ? Date.now() : parsed;
    hasDataRef.current = true;
    setEvents(mapToInputs(result.events));
    setBusyDays(collectBusyDays(result.events));
    setWarnings(result.warnings ?? []);
    setDataAsOf(asOf);
    setStale(Date.now() - asOf > STALE_AFTER_MS);
    setError(null);
    setRefreshError(null);
  }, []);

  const applyFailure = useCallback((e: unknown) => {
    const message = e instanceof Error ? e.message : "Unbekannter Fehler";
    if (hasDataRef.current) {
      // Vorhandene Termine nicht wegwerfen – nur darauf hinweisen, dass sie alt sein können.
      setRefreshError(message);
    } else {
      setError(message);
      setWarnings([]);
    }
  }, []);

  const runLoad = useCallback(
    async (mode: LoadMode) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      lastAttemptRef.current = Date.now();
      if (mode === "blocking") setLoading(true);
      if (mode === "refresh") setRefreshing(true);
      try {
        applyResult(await loadCalendar(mode !== "silent"));
      } catch (e) {
        applyFailure(e);
      } finally {
        inFlightRef.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [applyResult, applyFailure],
  );

  /** Erstes Laden: Ladezustand ist bereits der Anfangszustand, State nur in den Callbacks setzen. */
  useEffect(() => {
    let cancelled = false;
    inFlightRef.current = true;
    lastAttemptRef.current = Date.now();
    loadCalendar(false)
      .then(
        (result) => {
          if (!cancelled) applyResult(result);
        },
        (e: unknown) => {
          if (!cancelled) applyFailure(e);
        },
      )
      .finally(() => {
        inFlightRef.current = false;
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applyResult, applyFailure]);

  /** Zurück im Vordergrund (PWA aus dem Hintergrund, Tab-Wechsel): veralteten Stand still erneuern. */
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== "visible") return;
      if (!hasDataRef.current) return;
      if (Date.now() - lastAttemptRef.current < AUTO_REFRESH_AFTER_MS) return;
      void runLoad("silent");
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [runLoad]);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  /**
   * BER-42: Wisch links → nächster Zeitraum, rechts → vorheriger (alle Ansichten).
   * Nur ein Finger, klar horizontal, zügig und nicht vom Bildschirmrand aus – so bleiben
   * vertikales Scrollen, Pull-to-Refresh, Pinch-Zoom und die Zurück-Geste des Systems unberührt.
   */
  useEffect(() => {
    const el = swipeAreaRef.current;
    if (!el) return;

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length !== 1) {
        swipeStartRef.current.active = false;
        return;
      }
      const t = e.touches[0];
      const fromEdge =
        t.clientX < SWIPE_EDGE_GUARD_PX || t.clientX > window.innerWidth - SWIPE_EDGE_GUARD_PX;
      swipeStartRef.current = { x: t.clientX, y: t.clientY, t: e.timeStamp, active: !fromEdge };
    }

    function onTouchCancel() {
      swipeStartRef.current.active = false;
    }

    function onTouchEnd(e: TouchEvent) {
      const start = swipeStartRef.current;
      if (!start.active) return;
      start.active = false;
      if (e.touches.length > 0) return;

      const t = e.changedTouches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      if (e.timeStamp - start.t > SWIPE_MAX_MS) return;
      if (Math.abs(dx) < SWIPE_MIN_PX) return;
      if (Math.abs(dx) < Math.abs(dy) * SWIPE_DIRECTION_RATIO) return;

      const api = calRef.current?.getApi();
      if (!api) return;
      if (dx > 0) api.prev();
      else api.next();
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchCancel, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchCancel);
    };
    // Der Wischbereich existiert erst nach dem Laden bzw. verschwindet im Fehlerzustand.
  }, [loading, error]);

  const dayCellClassNames = useMemo(
    () => (arg: { date: Date }) =>
      busyDays.has(localDayKey(arg.date)) ? ["calconny-day-has-events"] : [],
    [busyDays],
  );

  const syncViewFromCalendar = useCallback((viewType: string) => {
    if (viewType === "dayGridMonth") setActiveView("dayGridMonth");
    else if (viewType.startsWith("list")) setActiveView("listWeek");
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
      <div
        className="rounded border border-[var(--border)] bg-[var(--card)] px-6 py-8 text-center"
        role="alert"
      >
        <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-wide text-[var(--muted)]">
          Kalender nicht verfügbar
        </p>
        <p className="mt-2 break-words font-[family-name:var(--font-body)] text-[var(--text)]">
          {error}
        </p>
        <button
          type="button"
          onClick={() => void runLoad("blocking")}
          className="mt-4 min-h-11 touch-manipulation rounded border border-[var(--copper)] bg-[var(--copper)] px-5 py-2 font-[family-name:var(--font-mono)] text-sm uppercase text-[var(--bg)]"
        >
          Neu laden
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
      {stale || refreshError ? (
        <div
          className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded border border-[var(--copper)] bg-[var(--card)] px-3 py-2"
          role="status"
        >
          <p className="min-w-0 flex-1 basis-48 font-[family-name:var(--font-body)] text-sm text-[var(--text)]">
            {dataAsOf ? `Stand vom ${formatAsOf(dataAsOf)} – ` : ""}
            {refreshError ?? "Der Kalender konnte nicht aktualisiert werden (offline?)."}
          </p>
          <button
            type="button"
            onClick={() => void runLoad("refresh")}
            disabled={refreshing}
            className="min-h-11 shrink-0 touch-manipulation rounded border border-[var(--copper)] px-4 font-[family-name:var(--font-mono)] text-xs uppercase text-[var(--copper)] disabled:opacity-50"
          >
            {refreshing ? "Lädt …" : "Neu laden"}
          </button>
        </div>
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
        onRefresh={() => void runLoad("refresh")}
        refreshing={refreshing}
      />
      <div
        ref={swipeAreaRef}
        className="calconny-calendar-swipe mt-4 min-h-[480px] w-full max-w-full touch-pan-y touch-pinch-zoom"
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
          // Tap auf einen Tag: Tagesliste mit allen Terminen (dayGridDay würde bei 2 Einträgen kürzen)
          navLinkDayClick={(date) => calRef.current?.getApi().changeView("listDay", date)}
          fixedWeekCount={false}
          dayMaxEvents={narrow ? 2 : false}
          allDayText={narrow ? "☀" : undefined}
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
            setRangeTitle(
              arg.view.type === "dayGridMonth"
                ? formatMonthYearGerman(arg.view.calendar.getDate())
                : formatGermanRangeTitle(arg.start, arg.end),
            );
          }}
          dayCellClassNames={dayCellClassNames}
          dayHeaderContent={(arg) => {
            if (!isWeekGridView(arg.view.type)) {
              // true = Standard-Kopf von FullCalendar (undefined würde ihn leer rendern)
              return true;
            }
            const d = arg.date;
            return (
              <div className="calconny-week-day-head flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-t-lg bg-[var(--card)] px-0.5 py-1.5">
                <span className="font-[family-name:var(--font-mono)] text-[0.6rem] font-medium uppercase tracking-wide text-[var(--muted)]">
                  {weekdayAbbrevDe(d)}
                </span>
                <span className="calconny-week-day-num font-[family-name:var(--font-body)] text-lg font-semibold leading-none tabular-nums text-[var(--copper)]">
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
                  // In Listenansichten liefert FullCalendar keinen timeText (eigene Zeit-Spalte)
                  timeLabel={formatEventTimeLabel(arg.event)}
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
              if (!start) return true;
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
            return true;
          }}
        />
      </div>
    </div>
  );
}
