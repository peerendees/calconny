import { normalizeIcalFeedUrl } from "./ical-feed-url";

/**
 * Liest alle Kalender-URLs aus der Umgebung:
 * - ICAL_FEED_URL (einzelnes Abo, Abwärtskompatibilität)
 * - ICAL_FEED_URLS: mehrere URLs, komma- oder zeilengetrennt
 * - ICAL_FEED_URL_2 … ICAL_FEED_URL_10 (optional, z. B. in Vercel übersichtlich)
 *
 * Nach Normalisierung (webcal → https) werden Duplikate entfernt.
 */
export function getCalendarFeedUrlsFromEnv(): string[] {
  const raw = new Set<string>();

  const add = (s: string | undefined) => {
    const t = s?.trim();
    if (t) raw.add(t);
  };

  add(process.env.ICAL_FEED_URL);

  const list = process.env.ICAL_FEED_URLS?.trim();
  if (list) {
    for (const part of list.split(/[,;\n]+/)) {
      add(part);
    }
  }

  const env = process.env as Record<string, string | undefined>;
  for (let i = 2; i <= 10; i++) {
    add(env[`ICAL_FEED_URL_${i}`]);
  }

  const normalized = [...raw].map((u) => normalizeIcalFeedUrl(u));
  return [...new Set(normalized)];
}
