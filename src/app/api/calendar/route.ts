import { NextResponse } from "next/server";
import { fetchIcsFeed, getFetchErrorDetail } from "@/lib/fetch-ical-feed";
import { normalizeIcalFeedUrl } from "@/lib/ical-feed-url";
import { parseIcsToCalendarEvents } from "@/lib/ics-parser";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const url = process.env.ICAL_FEED_URL;
  if (!url?.trim()) {
    return NextResponse.json(
      {
        error:
          "ICAL_FEED_URL ist nicht gesetzt. In Vercel: Project → Settings → Environment Variables → ICAL_FEED_URL (https:// oder webcal://) für Production setzen und neu deployen.",
      },
      { status: 500 },
    );
  }

  const fetchUrl = normalizeIcalFeedUrl(url);

  let res: Response;
  try {
    res = await fetchIcsFeed(fetchUrl);
  } catch (e) {
    const detail = getFetchErrorDetail(e);
    return NextResponse.json(
      {
        error: `Kalender-Fetch fehlgeschlagen: ${detail}`,
      },
      { status: 502 },
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: `Kalender-Fetch: HTTP ${res.status}` },
      { status: 502 },
    );
  }

  const text = await res.text();

  let events;
  try {
    events = parseIcsToCalendarEvents(text);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unbekannter Parserfehler";
    return NextResponse.json(
      { error: `ICS konnte nicht gelesen werden: ${message}` },
      { status: 500 },
    );
  }

  return NextResponse.json(events, {
    headers: {
      "Cache-Control": "s-maxage=300, stale-while-revalidate=60",
    },
  });
}
