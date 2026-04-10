import { type NextRequest, NextResponse } from "next/server";
import { getCalendarFeedUrlsFromEnv } from "@/lib/calendar-feed-env";
import { fetchIcsFeed, getFetchErrorDetail } from "@/lib/fetch-ical-feed";
import { parseIcsToCalendarEvents } from "@/lib/ics-parser";
import { mergeCalendarEvents } from "@/lib/merge-calendar-events";
import type { CalendarEvent } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Erste Events als JSON in Logs (lokal, oder Vercel mit CALCONNY_DEBUG_ICS=1). */
function logParsedEventsDebug(events: CalendarEvent[]): void {
  const enabled =
    process.env.CALCONNY_DEBUG_ICS === "1" || process.env.NODE_ENV === "development";
  if (!enabled) return;

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
          "Kein Kalender-Abo konfiguriert. In Vercel: ICAL_FEED_URL und/oder ICAL_FEED_URLS (kommagetrennt) bzw. ICAL_FEED_URL_2 … setzen und neu deployen.",
      },
      { status: 500 },
    );
  }

  const chunks: CalendarEvent[][] = [];
  const warnings: string[] = [];

  for (const fetchUrl of urls) {
    let res: Response;
    try {
      res = await fetchIcsFeed(fetchUrl);
    } catch (e) {
      const detail = getFetchErrorDetail(e);
      const label = fetchUrl.length > 64 ? `${fetchUrl.slice(0, 64)}…` : fetchUrl;
      warnings.push(`${label}: ${detail}`);
      continue;
    }

    if (!res.ok) {
      const label = fetchUrl.length > 64 ? `${fetchUrl.slice(0, 64)}…` : fetchUrl;
      warnings.push(`${label}: HTTP ${res.status}`);
      continue;
    }

    const text = await res.text();
    try {
      chunks.push(parseIcsToCalendarEvents(text));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Parserfehler";
      const label = fetchUrl.length > 64 ? `${fetchUrl.slice(0, 64)}…` : fetchUrl;
      warnings.push(`${label}: ${message}`);
    }
  }

  if (chunks.length === 0) {
    return NextResponse.json(
      {
        error: "Kein Kalender konnte geladen werden.",
        warnings,
      },
      { status: 502 },
    );
  }

  const events = mergeCalendarEvents(chunks);
  logParsedEventsDebug(events);

  const cacheControl = forceRefresh
    ? "private, no-store, must-revalidate"
    : "s-maxage=300, stale-while-revalidate=60";

  return NextResponse.json(
    { events, warnings: warnings.length ? warnings : undefined },
    {
      headers: {
        "Cache-Control": cacheControl,
      },
    },
  );
}
