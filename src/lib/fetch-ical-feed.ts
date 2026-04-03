import dns from "node:dns";

let dnsIpv4Preferred = false;

function preferIpv4First() {
  if (dnsIpv4Preferred) return;
  dnsIpv4Preferred = true;
  try {
    dns.setDefaultResultOrder("ipv4first");
  } catch {
    /* ältere Node-Versionen */
  }
}

const ICS_HEADERS = {
  Accept: "text/calendar, text/plain, application/octet-stream, */*",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
} as const;

export function getFetchErrorDetail(e: unknown): string {
  if (!(e instanceof Error)) return String(e);
  let out = e.message;
  if (e.cause instanceof Error) {
    out += ` — ${e.cause.message}`;
  }
  return out;
}

/**
 * Ruft den ICS-Feed ab. Viele Anbieter (inkl. iCloud) erwarten einen
 * Browser-ähnlichen User-Agent; IPv4 zuerst hilft bei TLS/DNS auf Servern.
 */
export async function fetchIcsFeed(url: string): Promise<Response> {
  preferIpv4First();
  const controller = new AbortController();
  const timeoutMs = 30_000;
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
      headers: ICS_HEADERS,
    });
  } finally {
    clearTimeout(t);
  }
}
