/**
 * Normalisiert Abo-URLs für fetch(). `webcal://` und `webcals://` sind
 * dasselbe Ziel wie HTTPS; der Server kann nur http(s) abfragen.
 */
export function normalizeIcalFeedUrl(raw: string): string {
  const u = raw.trim();
  if (u.startsWith("webcal://")) {
    return `https://${u.slice("webcal://".length)}`;
  }
  if (u.startsWith("webcals://")) {
    return `https://${u.slice("webcals://".length)}`;
  }
  return u;
}
