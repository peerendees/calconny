# CalConny – Briefing-Status (Abschnitt 5)

Kurzfassung anhand **`.cursor/rules/CALCONNY-CURSOR-BRIEFING.md`** (Abschnitt 5) und dem Stand im Repo.

## Erledigt (inhaltlich umgesetzt)

| Schritt | Inhalt |
|--------|--------|
| **1** | Next.js-Projekt, FullCalendar + `ical.js`, `.env.local` / `.env.example` |
| **2** | `globals.css` (CI, Fonts, FullCalendar-Overrides; Tailwind v4 mit `@import "tailwindcss"` statt klassischer `@tailwind`-Zeilen), `types.ts`, `theme.ts`, Header/Footer/ThemeToggle, `layout.tsx`, `middleware.ts`-Platzhalter |
| **3** | `GET /api/calendar`, `ics-parser.ts`, Fehlerbehandlung, Cache-Header (inkl. Erweiterungen: mehrere Feeds, `webcal`, robuster Fetch) |
| **4** | `CalendarShell`, `ViewSwitcher`, `EventCard`, Custom-Views `slidingWeek` / schmale Woche, FullCalendar-CI in CSS |
| **6** | Git/GitHub, Vercel, Env-Variablen, Live-Betrieb (Subdomain bei euch: z. B. `calconny.berent.ai`; `kalender.berent.ai` im Briefing war nur als Ziel genannt) |

**Zusätzlich** (nicht im ursprünglichen V1-Briefing): **mehrere Feeds**, **Aktualisieren-Button**, **PWA** (Briefing Abschnitt 7 sagte ursprünglich „kein PWA“ – gewünscht und umgesetzt).

## Offen / nur teilweise

| Schritt | Was fehlt oder ist nur grob da |
|--------|--------------------------------|
| **5** | **Responsive-Feinschliff** laut Briefing: explizite **Touch-Swipe-Navigation**, durchgängige **responsive Typo**, **kein horizontales Scrollen** auf 360 px – nicht als abgeschlossenes QA dokumentiert; Woche **3 Tage &lt; 640px** und **kompakte View-Buttons** sind drin. |
| **6** | Punkt 5 im Briefing (**Subdomain `kalender.berent.ai`**) nur **DNS/Hosting**, kein Code. |
| **Struktur §4** | **`berent-ci.md`** unter `.cursor/rules/` optional laut Briefing – nicht zwingend angelegt. |

## Abweichungen vom Briefing-Wortlaut

- **Kalender-API-Antwort:** jetzt `{ events, warnings? }` statt nur einem Array (Client bleibt kompatibel).
- **Abschnitt 7 „nicht in V1“:** **PWA/Service Worker** sind jetzt **drin** (bewusste Erweiterung).
- **Build:** `npm run build` = **`next build --webpack`** wegen **next-pwa** (Workbox).

## Commits

Maßgeblich ist die aktuelle Historie im Repo:

```bash
git log --oneline
```

*(Diese Datei listet keine festen SHAs mehr, damit sie nicht bei jedem Commit angepasst werden muss.)*

## Commit-Konvention im Repo

Siehe **`.cursor/rules/COMMIT-KONVENTION.md`** (Englisch, Conventional Commits; Linear `BER-XX` optional).
