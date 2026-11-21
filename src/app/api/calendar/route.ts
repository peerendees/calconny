import { type NextRequest, NextResponse } from "next/server";
import { getCalendarFeedUrlsFromEnv } from "@/lib/calendar-feed-env";
import { fetchIcsFeed, getFetchErrorCode } from "@/lib/fetch-ical-feed";
import { parseIcsToCalendarEvents } from "@/lib/ics-parser";
import { mergeCalendarEvents } from "@/lib/merge-calendar-events";
import type { CalendarEvent } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Fehlerantworten dürfen weder CDN noch Browser noch Service Worker zwischenspeichern. */
const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

/**
 * Erste Events als JSON in Logs – nur mit ausdrücklichem CALCONNY_DEBUG_ICS=1,
 * damit Kalenderinhalte nie versehentlich in Server-Logs landen.
 */
function logParsedEventsDebug(events: CalendarEvent[]): void {
  if (process.env.CALCONNY_DEBUG_ICS !== "1") return;

  const sample = events.slice(0, 3).map((e) => ({
    title: e.title,
    start: e.start,
    end: e.end,
    location: e.location ?? null,
    descriptionLen: e.description?.length ?? 0,
    descriptionPreview:
      e.description && e.description.length > 0
        ? `${e.description.slice(0, 120)}${e.description.length > 120 ? "…" : ""}`
        : null,
  }));
  const placeholderTitles = events.filter(
    (e) => !e.title.trim() || e.title === "(Ohne Titel)",
  ).length;

  console.log(
    "[calconny/api/calendar] Parsed events sample (first 3):",
    JSON.stringify(sample, null, 2),
  );
  console.log("[calconny/api/calendar] stats:", {
    total: events.length,
    placeholderOrEmptyTitles: placeholderTitles,
  });

  const multiDayAllDay = events.filter(
    (e) => e.allDay && e.end && e.start.slice(0, 10) !== e.end.slice(0, 10),
  );
  if (multiDayAllDay.length > 0) {
    console.log(
      "[calconny/api/calendar] multi-day all-day sample:",
      JSON.stringify(
        multiDayAllDay.slice(0, 2).map((e) => ({
          title: e.title,
          start: e.start,
          end: e.end,
        })),
        null,
        2,
      ),
    );
  }
}

export async function GET(request: NextRequest) {
  const forceRefresh =
    request.nextUrl.searchParams.has("refresh") ||
    request.headers.get("cache-control")?.toLowerCase().includes("no-cache") === true ||
    request.headers.get("pragma") === "no-cache";

  const urls = getCalendarFeedUrlsFromEnv();

  if (urls.length === 0) {
    return NextResponse.json(
      {
        error:
          "Kein Kalender-Abo konfiguriert. Auf dem Server fehlt ICAL_FEED_URL bzw. ICAL_FEED_URLS (Umgebungsvariable setzen und neu starten bzw. deployen).",
      },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }

  const chunks: CalendarEvent[][] = [];
  const warnings: string[] = [];

  for (const [index, fetchUrl] of urls.entries()) {
    // Abo-URLs enthalten Zugriffstoken: nie an den Client oder in Logs geben, nur die Position.
    const label = `Kalender ${index + 1}`;

    let res: Response;
    try {
      res = await fetchIcsFeed(fetchUrl);
    } catch (e) {
      console.warn(`[calconny/api/calendar] ${label}: Abruf fehlgeschlagen (${getFetchErrorCode(e)})`);
      warnings.push(`${label}: nicht erreichbar`);
      continue;
    }

    if (!res.ok) {
      warnings.push(`${label}: HTTP ${res.status}`);
      continue;
    }

    const text = await res.text();
    try {
      chunks.push(parseIcsToCalendarEvents(text));
    } catch {
      // Parser-Meldungen können Zeilen aus dem Feed enthalten – nicht weiterreichen.
      warnings.push(`${label}: Antwort ist kein gültiger iCal-Feed`);
    }
  }

  if (chunks.length === 0) {
    return NextResponse.json(
      {
        error: "Kein Kalender konnte geladen werden.",
        warnings,
      },
      { status: 502, headers: NO_STORE_HEADERS },
    );
  }

  const events = mergeCalendarEvents(chunks);
  logParsedEventsDebug(events);

  const cacheControl = forceRefresh
    ? "private, no-store, must-revalidate"
    : "s-maxage=300, stale-while-revalidate=60";

  return NextResponse.json(
    {
      events,
      warnings: warnings.length ? warnings : undefined,
      generatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": cacheControl,
      },
    },
  );
}
