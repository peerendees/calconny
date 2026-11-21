# Deployment auf Coolify (Vorbereitung)

Stand: Vorbereitung, nichts umgestellt. Produktiv läuft CalConny weiter auf Vercel; dieses
Dokument beschreibt, was für einen Betrieb als Docker-Container (z. B. unter Coolify) nötig ist.

## Was im Repo dafür vorhanden ist

| Datei | Zweck |
|-------|-------|
| `Dockerfile` | Multi-Stage-Build (deps → builder → runner), Node 24 LTS (Alpine), läuft als Benutzer `node` (non-root) |
| `.dockerignore` | hält `node_modules`, `.next`, `.env*` und Doku aus dem Build-Kontext |
| `next.config.ts` → `output: "standalone"` | erzeugt `.next/standalone/server.js`; Vercel ignoriert die Option |

## Umgebungsvariablen (nur Namen)

Alle Variablen werden **zur Laufzeit** gelesen – in Coolify als Runtime-Variablen setzen, nicht als
Build-Argumente. Es gibt keine `NEXT_PUBLIC_*`-Variablen.

| Name | Pflicht | Bedeutung |
|------|---------|-----------|
| `ICAL_FEED_URL` | eine der drei Feed-Varianten | einzelnes Kalender-Abo (`https://` oder `webcal://`) |
| `ICAL_FEED_URLS` | – | mehrere Abos, komma-, semikolon- oder zeilengetrennt |
| `ICAL_FEED_URL_2` … `ICAL_FEED_URL_10` | – | weitere Abos als Einzelvariablen |
| `CALCONNY_DEBUG_ICS` | nein | `1` schreibt eine Stichprobe geparster Termine ins Server-Log. Enthält Kalenderinhalte – nur kurzzeitig zur Fehlersuche setzen |
| `PORT` | nein | Port des Servers im Container (Standard im Image: `3000`) |
| `HOSTNAME` | nein | Bind-Adresse (Standard im Image: `0.0.0.0`) |

Die Abo-URLs sind Zugangsgeheimnisse. Sie gehören ausschließlich in die Secret-Verwaltung der
Plattform, nie ins Repo, in Logs oder in Tickets. Fehlt jede Feed-Variable, antwortet
`/api/calendar` mit HTTP 500 und die Oberfläche zeigt „Kalender nicht verfügbar“ mit „Neu laden“.

## Einrichtung in Coolify

1. Neue Ressource aus dem Git-Repository anlegen, Build Pack **Dockerfile** (Pfad `./Dockerfile`).
2. Port der Anwendung: `3000`.
3. Runtime-Variablen setzen (siehe Tabelle), anschließend deployen.
4. Domain zuweisen und TLS aktivieren. Ohne HTTPS registriert der Browser keinen Service Worker,
   die PWA ist dann nicht installierbar.
5. Healthcheck: Das Image bringt einen `HEALTHCHECK` auf `/manifest.webmanifest` mit. Wer in
   Coolify einen eigenen Pfad einträgt, nimmt ebenfalls `/manifest.webmanifest` – nicht
   `/api/calendar`, sonst ruft jeder Check die Feeds ab.

Lokal prüfen (ohne echten Feed, mit einer selbst erstellten Test-ICS-Datei auf einem lokalen
Webserver):

```bash
docker build -t calconny .
docker run --rm -p 3000:3000 -e ICAL_FEED_URL=<URL der Test-ICS> calconny
```

## Vercel-spezifische Annahmen im Code

| Stelle | Annahme | Auswirkung außerhalb von Vercel |
|--------|---------|---------------------------------|
| `src/app/api/calendar/route.ts`: `Cache-Control: s-maxage=300, stale-while-revalidate=60` | Ein CDN vor der App hält die Antwort bis zu ~6 Minuten vor | Ohne CDN/Proxy-Cache ruft jeder Seitenaufruf die Feeds direkt ab (funktioniert, aber mehr Last beim Kalender-Anbieter und längere Ladezeit). Bei Bedarf Proxy-Cache vorschalten oder serverseitigen Kurzzeit-Cache ergänzen |
| `CalendarShell.tsx`: `?refresh=1&t=<Zeit>` beim manuellen Neu-laden | Der Query-Parameter umgeht den CDN-Cache | Ohne CDN wirkungslos, aber unschädlich |
| `src/lib/fetch-ical-feed.ts`: IPv4 zuerst, Browser-User-Agent | Für Vercel-Functions eingeführt | Plattformneutral; im Container muss ausgehender HTTPS-Verkehr zu den Kalender-Anbietern erlaubt sein |
| Build-Script `next build --webpack` | Vercel ruft `npm run build` auf | Im Dockerfile identisch. `--webpack` ist Pflicht, weil `@ducanh2912/next-pwa` ein Webpack-Plugin ist |
| `public/sw.js`, `public/workbox-*.js` | Entstehen beim Build und sind nicht eingecheckt | Das Dockerfile kopiert `public/` aus der Build-Stufe; bei eigenem Build-Weg darauf achten |
| HTTPS, Kompression, HTTP/2 | Erledigt Vercel | Übernimmt der Reverse Proxy von Coolify (Traefik/Caddy) |
| Umgebungsvariablen | In den Vercel-Projekteinstellungen gepflegt | Müssen in Coolify separat gesetzt werden – ein Wechsel des DNS-Ziels allein überträgt sie nicht |
| `src/proxy.ts` | Platzhalter ohne Matcher (läuft für keine Route) | Keine |

Nicht Vercel-gebunden: Es gibt keine `vercel.json`, keine Vercel-Pakete (Analytics, KV, Blob) und
keine Edge-Runtime; die API-Route läuft mit `runtime = "nodejs"`.

## Offene Punkte vor einer Umstellung

- Entscheidung zum Caching ohne CDN (siehe erste Tabellenzeile).
- Erst-Deployment parallel unter einer Test-Domain prüfen, erst danach DNS umstellen.
- Installierte PWAs sind an die Domain gebunden: Bleibt die Domain gleich, aktualisiert sich der
  Service Worker von selbst; bei neuer Domain muss die App neu installiert werden.
