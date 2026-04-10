# Cursor-Briefing: BER-42 Teil 3 – Bugfixes und UX-Feinschliff

**Datum:** 10.04.2026
**Linear-Issue:** [BER-42](https://linear.app/berent/issue/BER-42/mobile-first-radikale-android-optimierung-360px)
**Projekt:** CalConny
**Komplexität:** Mittel
**Priorität:** URGENT

## Ziel

Konkrete Bugs und UX-Probleme aus dem Live-Test fixen. Jeder Punkt ist mit einem Screenshot belegt. Nichts interpretieren – genau das umsetzen, was hier steht.

## Umsetzung

### 1. Listenansicht: Kompakter, Tap zum Aufklappen

**Problem:** Die Listeneinträge zeigen zu viel Text auf einmal und nehmen zu viel Platz ein.

**Lösung in `EventCard.tsx`:**
- **Zugeklappt (Default):** Nur Datum + Uhrzeit (eine Zeile: Datum links, Uhrzeit rechts) und Titel (eine Zeile, `line-clamp-1`).
- **Aufgeklappt (nach Tap auf den Eintrag):** Description und Location werden sichtbar, sanfte Transition.
- Implementiere mit `useState` für `expanded`, Toggle per `onClick`.

**Layout zugeklappt:**
```
Datum links                    Uhrzeit rechts
Titel (einzeilig, abgeschnitten wenn zu lang)
```

**Layout aufgeklappt:**
```
Datum links                    Uhrzeit rechts
Titel (vollständig)
Beschreibung (max 2 Zeilen)
📍 Ort
```

### 2. BUG: Tap auf Tag in Monatsansicht → falsche Tagesansicht

**Problem:** Wenn man in der Monatsansicht auf einen Tag tippt, erscheint eine Ansicht mit dem Titel "24. – 24. April 2026" – also Start und Ende sind der gleiche Tag. Das ist kein Bug in `formatGermanRangeTitle`, sondern FullCalendar wechselt offenbar in eine Tagesansicht (vermutlich via `navLinks`), und die Range-Formatierung zeigt dann denselben Tag zweimal.

**Fix in `src/lib/format-calendar-title.ts`:**
- Wenn `start` und `end` der gleiche Tag sind (oder `end` = `start + 1 Tag` bei FullCalendar-Konvention): Zeige nur "Do., 24. April 2026" (Wochentag + Datum), nicht den Bereich.
- Wenn Start und Ende im gleichen Monat liegen: "6. – 12. April 2026" (wie jetzt, korrekt)
- Wenn Monatsansicht: Nur "April 2026"

Zusätzlich prüfen: Was zeigt diese Tagesansicht inhaltlich? Dort sollten die Events des angeklickten Tages als Liste erscheinen, nicht ein leeres Grid mit einem einzelnen Dot.

### 3. BUG: Mehrtägige ganztägige Events werden nicht korrekt angezeigt (Wochenansicht)

**Problem (Screenshot 3):** Ein ganztägiges Event, das über mehrere Tage geht (z.B. Freitag bis Sonntag), wird in der Wochenansicht nur am Freitag als kleiner Punkt angezeigt. Am Samstag und Sonntag fehlt es komplett.

**Diagnose:**
- Prüfe in `ics-parser.ts` ob mehrtägige Events korrekt geparst werden: `DTSTART` = Freitag, `DTEND` = Montag (iCal-Konvention: DTEND ist exklusiv)
- Prüfe ob FullCalendar das Event korrekt als mehrtägig erkennt: `start` und `end` müssen als ISO-Strings korrekt übergeben werden
- Problem könnte sein: Ganztägige Events werden mit `allDay: true` markiert, aber `end` fehlt oder ist identisch mit `start`

**Fix in `ics-parser.ts`:**
- Bei ganztägigen Events: Stelle sicher, dass `end` korrekt gesetzt ist (DTEND aus dem iCal, nicht auf `start` fallen lassen)
- Debug: Logge ein mehrtägiges Event in der API-Route und prüfe ob `start` und `end` korrekt sind

**Fix in CSS (Wochenansicht):**
- Prüfe ob der Ganztags-Bereich mehrtägige Events visuell durchzieht (FullCalendar sollte das nativ können, wenn die Daten stimmen)

### 4. "GT" durch "Ganztägig" oder ☀ ersetzen

**Problem:** "GT" in der Wochenansicht (linke Achse) ist eine kryptische Abkürzung.

**Fix in `CalendarShell.tsx`:**
```typescript
allDayText="☀"
```

Oder alternativ `allDayText="Ganztägig"` mit kleiner Schrift via CSS:

```css
@media (max-width: 639px) {
  .fc .fc-timegrid-axis-cushion {
    font-size: 0.55rem;
    word-break: break-word;
    line-height: 1.2;
  }
}
```

Teste beides, nimm was besser aussieht. ☀ ist kompakt und visuell sofort verständlich.

### 5. Toolbar: Navigation auf eine Zeile, Aktualisieren-Button entfernen auf Mobile

**Problem (Screenshot 1):** Die Navigations-Buttons (Pfeile) und die Ansichts-Buttons (L/W/M) brechen auf Mobile schlecht um – über mehrere Zeilen verteilt.

**Lösung:**
- **Aktualisieren-Button auf Mobile komplett ausblenden:** `hidden sm:flex` auf den Refresh-Button. Auf Mobile wird sowieso durch Pull-to-Refresh oder Swipe aktualisiert.
- **Navigation auf eine Zeile erzwingen:** `← | L W M | →` alles auf einer Linie, kein Umbruch. `flex-nowrap` und ggf. `gap` verkleinern.
- Zeitraum-Titel darunter, wie jetzt.

### 6. Monatsansicht: Wochentag-Header und Dots-Verbesserung

**Problem (Screenshot 4):** Die Monatsansicht zeigt das Grid, aber die Wochentag-Abkürzungen (Mo, Di, Mi...) fehlen oben. Die Dots markieren korrekt Tage mit Events, sind aber zum Tippen zu klein.

**Fix Wochentag-Header:**
- Prüfe ob FullCalendar `columnHeaderFormat` oder `dayHeaderContent` für die Monatsansicht aktiv ist
- Die Monatsansicht braucht eine Kopfzeile mit Mo | Di | Mi | Do | Fr | Sa | So

**Fix Dots tippbar:**
- Die Dots selbst müssen nicht tippbar sein – der User tippt auf die **Tageszahl** (navLinks ist aktiv)
- Aber die Tageszahl muss groß genug sein als Touch-Target (min 44x44px Tap-Area)
- CSS: `.fc .fc-daygrid-day-number { min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center; }`
- Optional: Die gesamte Tageszelle als Tap-Target, nicht nur die Zahl

## Akzeptanzkriterien

- [ ] Listenansicht: Einträge zugeklappt (Datum+Uhrzeit+Titel), Tap klappt auf
- [ ] Tap auf Tag in Monatsansicht zeigt "Do., 24. April 2026" (nicht "24. – 24.")
- [ ] Mehrtägige ganztägige Events werden über alle Tage hinweg angezeigt
- [ ] "GT" ersetzt durch "☀" oder "Ganztägig"
- [ ] Toolbar: Eine Zeile, kein Aktualisieren-Button auf Mobile
- [ ] Monatsansicht: Wochentag-Header (Mo–So) sichtbar
- [ ] Tageszahlen als Touch-Target min 44x44px
- [ ] Kein horizontales Scrollen auf 360px

## Betroffene Dateien

- `src/components/calendar/EventCard.tsx`
- `src/components/calendar/CalendarShell.tsx`
- `src/components/calendar/ViewSwitcher.tsx`
- `src/lib/format-calendar-title.ts`
- `src/lib/ics-parser.ts` (Debug mehrtägige Events)
- `src/app/globals.css`

## Abschluss

```bash
git add -A
git commit -m "BER-42: Bugfixes – mehrtägige Events, Tagesansicht-Titel, EventCard Tap, Toolbar kompakt"
git push
```
