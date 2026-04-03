import { NextResponse } from "next/server";
import { parseIcsToCalendarEvents } from "@/lib/ics-parser";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.ICAL_FEED_URL;
  if (!url?.trim()) {
    return NextResponse.json(
      { error: "ICAL_FEED_URL ist nicht gesetzt." },
      { status: 500 },
    );
  }

  let res: Response;
  try {
    res = await fetch(url, {
      next: { revalidate: 300 },
      headers: { Accept: "text/calendar, text/plain, */*" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unbekannter Netzwerkfehler";
    return NextResponse.json(
      { error: `Kalender-Fetch fehlgeschlagen: ${message}` },
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
