# CalConny

Kalender-PWA für BERENT.AI: lädt ein oder mehrere iCal-Abos serverseitig, führt sie zusammen und
zeigt sie als Liste, Woche oder Monat – in erster Linie für das Smartphone (Android/iPhone,
installierbar als App), Hell- und Dunkelmodus.

- **Stack:** Next.js 16 (App Router), React 19, FullCalendar 6, ical.js, Tailwind CSS 4,
  Service Worker über `@ducanh2912/next-pwa`
- **Datenweg:** Browser → `GET /api/calendar` → Abruf der Abos (`ICAL_FEED_*`) → JSON
  `{ events, warnings?, generatedAt }`. Die Abo-URLs verlassen den Server nie.

## Setup

Voraussetzung: Node.js 20.9 oder neuer (empfohlen: aktuelle LTS) und npm.

```bash
npm ci
cp .env.example .env.local   # danach die Abo-URL(s) eintragen
npm run dev                  # http://localhost:3000
```

`.env.local` wird nicht eingecheckt. Der Service Worker ist im Entwicklungsmodus abgeschaltet;
PWA-Verhalten lässt sich nur mit `npm run build && npm run start` prüfen.

## Umgebungsvariablen

| Name | Bedeutung |
|------|-----------|
| `ICAL_FEED_URL` | einzelnes Kalender-Abo (`https://` oder `webcal://`) |
| `ICAL_FEED_URLS` | mehrere Abos, komma-, semikolon- oder zeilengetrennt |
| `ICAL_FEED_URL_2` … `ICAL_FEED_URL_10` | weitere Abos als Einzelvariablen |
| `CALCONNY_DEBUG_ICS` | optional, `1` = Stichprobe geparster Termine ins Server-Log (enthält Kalenderinhalte, nur zur Fehlersuche) |

Mindestens eine Feed-Variable muss gesetzt sein. Die URLs sind Zugangsgeheimnisse: nicht
committen, nicht loggen, nicht in Tickets kopieren.

## Scripts

| Befehl | Zweck |
|--------|-------|
| `npm run dev` | Entwicklungsserver |
| `npm run build` | Produktions-Build (`next build --webpack` – Webpack ist wegen next-pwa nötig) |
| `npm run start` | Produktionsserver aus dem Build (meldet wegen `output: "standalone"` einen Hinweis; für den Container-Betrieb gilt `node .next/standalone/server.js`, siehe Coolify-Doku) |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Typprüfung |

Vor jedem Commit müssen Typprüfung, Lint und Build fehlerfrei durchlaufen.

## Deployment

- **Vercel (aktuell produktiv):** Deployment über das mit dem Repository verbundene
  Vercel-Projekt. Die Feed-Variablen stehen in den Projekteinstellungen; nach einer Änderung neu
  deployen.
- **Docker / Coolify (vorbereitet):** `Dockerfile` und `output: "standalone"` sind vorhanden,
  Details und Variablen in [docs/deployment-coolify.md](docs/deployment-coolify.md).

Zeigt die Oberfläche „Kalender nicht verfügbar“, antwortet `/api/calendar` mit einem Fehler –
meist fehlt am jeweiligen Server die Feed-Variable.

## Projektstruktur

```
src/app/api/calendar/route.ts   API: Abos abrufen, parsen, zusammenführen
src/app/layout.tsx, manifest.ts Metadaten, Viewport, PWA-Manifest
src/components/calendar/        CalendarShell (Laden, Ansichten, Wischen), ViewSwitcher, EventCard, Modal
src/components/pwa/             Update-Erkennung des Service Workers
src/lib/                        ICS-Parser, Feed-Abruf, Formatierung, Typen
next.config.ts                  PWA-/Caching-Regeln, standalone-Ausgabe
```

Weitere Unterlagen: `FEEDBACK.md` (Rückmeldungen und Erledigtes), `.cursor/briefings/`
(Arbeitsaufträge), `.cursor/rules/COMMIT-KONVENTION.md`.
