# CalConny – Cursor-Briefing

> **Projektverzeichnis:** `/Users/kunkel/Entwicklung/projekte/calconny`
> **Lies diese Datei vollständig, bevor du irgendetwas erstellst oder installierst.**
> **Arbeite die Schritte der Reihe nach ab. Frage nach jedem Schritt, ob du fortfahren sollst.**

---

## 1. Projektübersicht

CalConny ist eine Web-basierte Kalender-App für den internen Gebrauch bei BERENT.AI.
Sie liest einen öffentlichen iCloud-Kalender (ICS-Feed) und stellt ihn in einer
Monats-, Wochen- und Listenansicht dar.

**Keine Datenbank, kein Auth, kein Schreibzugriff in V1.**

Die Architektur ist so angelegt, dass in späteren Versionen Supabase Auth,
DSGVO-konforme Terminbuchung und CalDAV-Schreibzugriff ergänzt werden können,
ohne die bestehende Struktur umzubauen.

### Datenfluss V1

```
iCloud (öffentlicher ICS-Feed)
        ↓ HTTPS (serverseitig)
Next.js API-Route /api/calendar
   → Fetcht ICS-Datei
   → Parst mit ical.js
   → Gibt JSON-Array zurück
        ↓
React Frontend
   → FullCalendar (Monats-, Wochen-, Listenansicht)
   → BERENT CI (Dark/Light)
        ↓
Vercel → kalender.berent.ai
```

---

## 2. Tech-Stack

| Komponente       | Technologie                  | Version / Hinweis                          |
|------------------|------------------------------|--------------------------------------------|
| Framework        | Next.js (App Router)         | Aktuelle stabile Version                   |
| Paketmanager     | npm                          | Kein yarn, kein pnpm                       |
| ICS-Parsing      | `ical.js`                    | npm: `ical.js`                             |
| Kalender-UI      | FullCalendar React           | `@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/list` |
| Styling          | Tailwind CSS v4              | Plus CSS Custom Properties für CI          |
| Fonts            | Lokal gehostet (DSGVO)       | Kein Google Fonts CDN!                     |
| Hosting          | Vercel                       | Subdomain: `kalender.berent.ai`            |
| Auth (V2-Vorbereitung) | Supabase Auth          | Nur Platzhalter-Dateien, nicht installieren |

---

## 3. Corporate Identity – BERENT.AI

### 3.1 Farbpalette

```css
/* === DARK MODE (Standard) === */
:root {
  --bg:       #090806;
  --card:     #110e0a;
  --border:   #2a2118;
  --copper:   #B5742A;
  --gold:     #E8C98A;
  --text:     #C4BCB1;
  --muted:    #7A6A58;
  --muted2:   #9a8870;
}

/* === LIGHT MODE === */
[data-theme="light"] {
  --bg:       #F5EFE4;
  --card:     #FFFFFF;
  --border:   #D4C9B8;
  --copper:   #B5742A;
  --gold:     #8B5E1A;    /* Dunkleres Gold für Lesbarkeit auf hellem Grund */
  --text:     #2A1A08;
  --muted:    #7A6A58;
  --muted2:   #9a8870;
}
```

**Regeln:**
- Niemals `#000000` oder `#FFFFFF` als Hintergrund- oder Textfarbe
- Gold `#E8C98A` ist im Dark Mode ausschließlich dem `+` Symbol vorbehalten
- Kupfer `#B5742A` ist die Leitfarbe für Akzente, Hover-States, aktive Elemente
- Alle Farben über CSS-Variablen referenzieren, niemals Hardcoded-Werte

### 3.2 Typografie

| Einsatz          | Font               | Gewicht         | Besonderheit               |
|------------------|--------------------|-----------------|----------------------------|
| Headlines        | Bebas Neue         | Regular (400)   | Immer `text-transform: uppercase`, `letter-spacing: 0.04em` |
| Body / Fließtext | Lora               | 300, 400, 600   | Niemals `font-style: italic` |
| Code / Labels    | JetBrains Mono     | 300, 400, 700   | Technische Inhalte, Metadaten |

**Fonts lokal hosten.** Lege die WOFF2-Dateien ab unter:

```
/public/fonts/
  bebas-neue-regular.woff2
  lora-300.woff2
  lora-400.woff2
  lora-600.woff2
  jetbrains-mono-400.woff2
```

Lade die Fonts von Google Fonts als WOFF2 herunter (z.B. über google-webfonts-helper)
und binde sie per `@font-face` in `globals.css` ein. Kein Google Fonts CDN-Link.

**Verbotene Fonts:** Inter, Roboto, Arial, system-ui, sans-serif als primäre Schrift.

### 3.3 Plus-Symbol

Das `+` ist das zentrale Markenelement von BERENT.AI. Verwende es als:
- Bullet-Ersatz in Listen
- Trennelement
- Dekoration in Header/Footer

Immer in Gold (`--gold`), niemals in Kupfer.

```css
.plus-mark {
  width: 18px; height: 18px;
  position: relative; flex-shrink: 0;
}
.plus-mark::before,
.plus-mark::after {
  content: '';
  position: absolute;
  background: var(--gold);
  border-radius: 1px;
}
.plus-mark::before { width: 2px; height: 100%; left: 50%; top: 0; transform: translateX(-50%); }
.plus-mark::after  { width: 100%; height: 2px; top: 50%; left: 0; transform: translateY(-50%); }
```

### 3.4 Header

```html
<header>
  <a href="https://berent.ai" class="nav-brand">
    <div class="plus-mark"></div>
    <span>BERENT.AI — Beratung + Entwicklung</span>
  </a>
  <!-- Theme-Toggle rechts -->
  <!-- View-Switcher (Monat / Woche / Liste) -->
</header>
```

- Brand-Link zeigt immer auf `https://berent.ai`
- `BERENT.AI` immer in Großbuchstaben

### 3.5 Footer

```html
<footer>
  <div class="footer-brand">
    <div class="plus-mark"></div>
    BERENT
  </div>
  <span>CalConny · berent.ai</span>
  <div class="footer-links">
    <a href="https://berent.ai/impressum.html">Impressum</a>
    <a href="https://berent.ai">← Zurück zur Hauptseite</a>
  </div>
</footer>
```

**Pflichtlinks:** Impressum + Zurück zur Hauptseite. Immer.

### 3.6 Dark/Light Toggle

Implementiere einen Toggle-Button im Header (rechts), der zwischen Dark und Light
wechselt. Speichere die Präferenz in `localStorage`. Respektiere `prefers-color-scheme`
als Initialwert, wenn kein gespeicherter Wert vorhanden ist.

Mechanismus: `data-theme="light"` auf `<html>` setzen/entfernen.

---

## 4. Ordnerstruktur

Erstelle exakt diese Struktur im Projektverzeichnis:

```
calconny/
├── .cursor/
│   └── rules/
│       └── berent-ci.md          ← Diese Datei (oder Kopie der CI-Sektion)
├── public/
│   └── fonts/
│       ├── bebas-neue-regular.woff2
│       ├── lora-300.woff2
│       ├── lora-400.woff2
│       ├── lora-600.woff2
│       └── jetbrains-mono-400.woff2
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── calendar/
│   │   │       └── route.ts      ← ICS-Fetch + Parse → JSON
│   │   ├── layout.tsx            ← Root Layout mit Header, Footer, Theme
│   │   ├── page.tsx              ← Hauptseite mit Kalenderansicht
│   │   └── globals.css           ← CI-Variablen, Font-Face, Dark/Light
│   ├── components/
│   │   ├── calendar/
│   │   │   ├── CalendarShell.tsx  ← Wrapper um FullCalendar
│   │   │   ├── EventCard.tsx     ← Einzelnes Event (Popup/Tooltip)
│   │   │   └── ViewSwitcher.tsx  ← Monat / Woche / Liste Toggle
│   │   └── ui/
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── ThemeToggle.tsx
│   ├── lib/
│   │   ├── ics-parser.ts         ← ICS-Datei → CalendarEvent[]
│   │   ├── types.ts              ← TypeScript-Interfaces
│   │   └── theme.ts              ← CI-Farben als JS-Konstanten (für FullCalendar)
│   └── middleware.ts             ← PLATZHALTER für Auth (V2) – nur Kommentar
├── .env.local                    ← ICAL_FEED_URL=https://...
├── .env.example                  ← ICAL_FEED_URL=https://dein-ical-feed-url
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 5. Implementierung – Schritt für Schritt

### Schritt 1: Projekt initialisieren

```bash
cd /Users/kunkel/Entwicklung/projekte/calconny
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias
```

Falls das Verzeichnis nicht leer ist, bestätige das Überschreiben.

Dann installiere die Abhängigkeiten:

```bash
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/list @fullcalendar/interaction ical.js
```

Erstelle `.env.local`:

```env
ICAL_FEED_URL=https://DEIN-ICAL-FEED-URL-HIER
```

Erstelle `.env.example`:

```env
ICAL_FEED_URL=https://dein-ical-feed-url
```

**Frage den Benutzer nach der ICS-Feed-URL und trage sie in `.env.local` ein.**

→ Warte auf Bestätigung.

---

### Schritt 2: CI-Grundgerüst (globals.css, Layout, Header, Footer, Theme-Toggle)

#### 2a: `src/app/globals.css`

Entferne den gesamten von create-next-app generierten Inhalt und ersetze ihn durch:

- Tailwind-Direktiven (`@tailwind base; @tailwind components; @tailwind utilities;`)
- `@font-face`-Deklarationen für alle Fonts (lokal gehostet)
- CSS Custom Properties (Dark Mode als `:root`, Light Mode als `[data-theme="light"]`)
- Basis-Styles für `body`, `a`, Scrollbar-Styling

Die Farben und Fonts sind exakt wie in Abschnitt 3 definiert.

#### 2b: `src/lib/types.ts`

```typescript
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;       // ISO 8601
  end?: string;        // ISO 8601
  allDay: boolean;
  description?: string;
  location?: string;
  // V2-Felder (vorbereitet, optional)
  organizer?: string;
  attendees?: string[];
  status?: 'confirmed' | 'tentative' | 'cancelled';
  bookingMeta?: Record<string, unknown>;
}

export type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'listWeek';
```

#### 2c: `src/lib/theme.ts`

Exportiere die CI-Farben als JS-Objekt, damit FullCalendar sie programmatisch
nutzen kann (FullCalendar akzeptiert nicht immer CSS-Variablen).

```typescript
export const BERENT_COLORS = {
  copper: '#B5742A',
  gold: '#E8C98A',
  bg: '#090806',
  card: '#110e0a',
  border: '#2a2118',
  text: '#C4BCB1',
  muted: '#7A6A58',
} as const;
```

#### 2d: Komponenten `Header.tsx`, `Footer.tsx`, `ThemeToggle.tsx`

Implementiere gemäß den Vorgaben in Abschnitt 3.4, 3.5, 3.6.

Der ThemeToggle soll:
- Ein einfacher Button sein (Sonnen-/Mond-Icon, kein externer Icon-Pack nötig – Unicode reicht: ☀ / ☾)
- `data-theme` auf `<html>` setzen
- Wert in `localStorage` unter `calconny-theme` speichern
- Beim Laden: `localStorage` prüfen, Fallback auf `prefers-color-scheme`

#### 2e: `src/app/layout.tsx`

Root Layout mit:
- `<html lang="de">` (wichtig: deutsch)
- Header-Komponente
- `{children}` als Hauptbereich
- Footer-Komponente
- Script oder Effect für initiales Theme-Loading (Flicker vermeiden!)

#### 2f: `src/middleware.ts`

Nur ein Platzhalter:

```typescript
// CalConny V2: Supabase Auth Middleware
// In V2 wird hier die Session-Prüfung implementiert.
// Geschützte Routen: /app/*, /api/calendar/book
// Öffentliche Routen: /, /login, /api/calendar (lesend)

export function middleware() {
  // V1: kein Auth, alles durchlassen
}

export const config = {
  matcher: [],
};
```

→ Warte auf Bestätigung.

---

### Schritt 3: API-Route (ICS-Fetch + Parse)

#### `src/app/api/calendar/route.ts`

Diese Route:
1. Liest `ICAL_FEED_URL` aus `process.env`
2. Fetcht die ICS-Datei serverseitig (kein CORS-Problem)
3. Parst sie mit `ical.js`
4. Transformiert VEVENT-Einträge in `CalendarEvent[]`
5. Gibt JSON zurück mit `Cache-Control: s-maxage=300` (5 Min Cache)

Fehlerbehandlung:
- Wenn `ICAL_FEED_URL` nicht gesetzt: 500 mit Fehlermeldung
- Wenn Fetch fehlschlägt: 502 mit Fehlermeldung
- Wenn Parsing fehlschlägt: 500 mit Fehlermeldung

#### `src/lib/ics-parser.ts`

Separater Parser, der die rohe ICS-Textdatei entgegennimmt und `CalendarEvent[]` zurückgibt.
Nutze `ICAL.parse()` und `ICAL.Component` aus `ical.js`.

Mapping:
- `SUMMARY` → `title`
- `DTSTART` → `start` (als ISO-String)
- `DTEND` → `end` (als ISO-String, falls vorhanden)
- `DESCRIPTION` → `description`
- `LOCATION` → `location`
- `UID` → `id`
- Ganztägige Events erkennen: Wenn `DTSTART` nur ein Datum (kein Zeitanteil) hat → `allDay: true`

→ Warte auf Bestätigung.

---

### Schritt 4: Kalenderansicht (FullCalendar + CI-Styling)

#### `src/components/calendar/CalendarShell.tsx`

Client Component (`'use client'`), die:
1. Beim Mount `/api/calendar` fetcht
2. Events in FullCalendar lädt
3. Drei Ansichten bereitstellt: `dayGridMonth`, `timeGridWeek`, `listWeek`
4. Den ViewSwitcher einbindet

FullCalendar-Konfiguration:
- `locale: 'de'` (deutsche Wochentage, Monatsnamen)
- `firstDay: 1` (Woche beginnt Montag)
- `height: 'auto'`
- `headerToolbar: false` (wir bauen unseren eigenen Header mit ViewSwitcher)
- `navLinks: true` (Klick auf Tag → Tagesansicht)
- Navigation (vor/zurück) über eigene Buttons im ViewSwitcher

**Wochenansicht tageweise verschiebbar:**
FullCalendar's `timeGridWeek` zeigt standardmäßig eine volle Woche.
Um tageweises Verschieben zu ermöglichen, nutze die FullCalendar-API:
- `prev()` und `next()` mit `duration: { days: 1 }` statt Wochensprung
- Oder alternativ: `dateIncrement: { days: 1 }` in einer Custom View

Implementiere das so:

```typescript
// Custom View Definition
const views = {
  slidingWeek: {
    type: 'timeGrid',
    duration: { days: 7 },
    dateIncrement: { days: 1 },  // Tageweise verschieben statt wochenweise
  }
};
```

#### `src/components/calendar/ViewSwitcher.tsx`

Drei Buttons: **Monat** | **Woche** | **Liste**
Plus Navigations-Pfeile (← →) und aktueller Zeitraum-Titel.

Styling:
- Aktiver View-Button: Kupfer-Hintergrund (`--copper`), heller Text
- Inaktive Buttons: `--card` Hintergrund, `--muted` Text
- Hover: Kupfer-Border
- Font: JetBrains Mono, uppercase, klein

#### `src/components/calendar/EventCard.tsx`

Für die Darstellung einzelner Events in der Listenansicht und als Popover/Tooltip
in Monats-/Wochenansicht.

Zeigt:
- Titel (Lora, 400)
- Uhrzeit (JetBrains Mono, `--muted`)
- Ort, falls vorhanden (Lora, 300, `--muted2`)
- Farbiger Streifen links: Kupfer

#### FullCalendar CI-Overrides

FullCalendar bringt eigenes CSS mit. Überschreibe es in `globals.css`:

```css
/* FullCalendar CI-Overrides */
.fc {
  --fc-border-color: var(--border);
  --fc-button-bg-color: var(--card);
  --fc-button-border-color: var(--border);
  --fc-button-text-color: var(--text);
  --fc-button-hover-bg-color: var(--copper);
  --fc-button-hover-border-color: var(--copper);
  --fc-button-active-bg-color: var(--copper);
  --fc-event-bg-color: var(--copper);
  --fc-event-border-color: var(--copper);
  --fc-event-text-color: var(--text);
  --fc-today-bg-color: rgba(181, 116, 42, 0.08);
  --fc-page-bg-color: var(--bg);
  --fc-neutral-bg-color: var(--card);
  --fc-list-event-hover-bg-color: var(--card);
  font-family: 'Lora', serif;
}

.fc .fc-col-header-cell-cushion,
.fc .fc-daygrid-day-number {
  color: var(--muted);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  text-transform: uppercase;
}

.fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
  color: var(--copper);
  font-weight: 700;
}

.fc-theme-standard td,
.fc-theme-standard th {
  border-color: var(--border);
}
```

→ Warte auf Bestätigung.

---

### Schritt 5: Responsive + Feinschliff

Die App muss auf Android Chrome (Smartphone) gut funktionieren.

- FullCalendar auf kleinen Screens: Wochenansicht auf 3 Tage reduzieren (`duration: { days: 3 }` unter 640px)
- Touch-Swipe für Navigation: FullCalendar unterstützt das mit `@fullcalendar/interaction`
- ViewSwitcher: Auf Mobile als kompakte Icon-Leiste
- Font-Größen responsive anpassen
- Kein horizontales Scrollen

Teste auf:
- Desktop Chrome (breit)
- Android Chrome (360px Viewport)
- Querformat Tablet

→ Warte auf Bestätigung.

---

### Schritt 6: Vercel Deployment

1. Initialisiere Git-Repo und pushe auf GitHub (Repo: `peerendees/calconny`)
2. Verbinde das Repo in Vercel mit dem Team `peerendees-projects`
3. Setze die Umgebungsvariable `ICAL_FEED_URL` in Vercel (Settings → Environment Variables)
4. Deploy
5. Subdomain `kalender.berent.ai` wird separat eingerichtet (nicht Teil dieser Anweisung)

→ Warte auf Bestätigung.

---

## 6. Qualitäts-Checkliste

Prüfe vor dem finalen Commit:

- [ ] Keine Google Fonts CDN-Links (DSGVO)
- [ ] Alle Farben über CSS-Variablen, keine Hardcoded-Hex-Werte in Komponenten
- [ ] Dark/Light Toggle funktioniert ohne Flicker beim Laden
- [ ] Deutsche Lokalisierung (Wochentage, Monate, Uhrzeitformat)
- [ ] `ICAL_FEED_URL` nur aus Environment Variable, nirgends Hardcoded
- [ ] API-Route hat Cache-Header (`s-maxage=300`)
- [ ] Responsive: kein horizontales Scrollen auf 360px Viewport
- [ ] Footer enthält Impressum-Link und Zurück-zur-Hauptseite-Link
- [ ] Header-Brand verlinkt auf `https://berent.ai`
- [ ] TypeScript: keine `any`-Typen, alle Interfaces in `types.ts`
- [ ] `middleware.ts` existiert als V2-Platzhalter

---

## 7. Was NICHT in V1 gehört

Baue folgendes NICHT ein, auch wenn es naheliegend erscheint:

- Kein Supabase (nur Platzhalter-Datei)
- Keine Event-Erstellung oder -Bearbeitung
- Kein CalDAV-Schreibzugriff
- Keine Benutzerregistrierung / Login
- Keine Push-Benachrichtigungen
- Keine Mehrkalender-Unterstützung (nur ein Feed)
- Keine Drag-and-Drop-Funktionalität für Events
- Kein Service Worker / PWA

---

## 8. V2-Ausblick (nur zur Orientierung, NICHT umsetzen)

- Supabase Auth (E-Mail + Magic Link)
- Geschützte Routen mit Middleware
- DSGVO-konforme Terminbuchung (öffentliche Buchungsseite)
- Eigener CalDAV-Server für bidirektionale Sync
- Mehrere Kalender mit Farbcodierung
- Läuft unter separater Subdomain (z.B. `termine.berent.ai`)
