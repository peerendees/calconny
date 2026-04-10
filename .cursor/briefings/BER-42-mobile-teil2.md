# Cursor-Briefing: BER-42 Teil 2 – Mobile Feinschliff

**Datum:** 10.04.2026
**Linear-Issue:** [BER-42](https://linear.app/berent/issue/BER-42/mobile-first-radikale-android-optimierung-360px)
**Projekt:** CalConny
**Komplexität:** Mittel
**Priorität:** URGENT
**Bezug:** Offene Punkte aus `FEEDBACK.md` vom 10.04.2026

## Ziel

Die 5 offenen Feedback-Punkte abarbeiten. Fokus: Alles muss auf einem Android-Smartphone (360px) gut aussehen und bedienbar sein.

## Umsetzung

### 1. EventCard Layout: Datum links, Uhrzeit rechts, Beschreibung darunter

Betrifft: `src/components/calendar/EventCard.tsx`

Die EventCard (Listenansicht + Event-Detail-Modal) soll folgendes Layout bekommen:

```
┌─────────────────────────────────────────┐
│ Mo., 14. Apr. 2026              14:00   │  ← Datum links, Uhrzeit rechts, eine Zeile
│ Kundengespräch Firma Müller             │  ← Titel (Lora, 400, --text)
│ Besprechung der Q2-Ergebnisse           │  ← Description (Lora, 300, --muted2, line-clamp-2)
│ 📍 Büro München                         │  ← Location, falls vorhanden
└─────────────────────────────────────────┘
```

Konkret in der EventCard:
- Erste Zeile: `flex justify-between` → `dateLabel` links, `timeLabel` rechts
- Beide in `font-mono`, `text-xs`, `--muted`
- Ganztägige Events: `timeLabel` zeigt "Ganztägig" statt Uhrzeit
- Titel darunter: `font-body`, `font-normal`, `--text`
- Description darunter: `font-body`, `font-light`, `text-sm`, `--muted2`, `line-clamp-2`
- Location ganz unten, falls vorhanden

### 2. Monatsübersicht: Kompakter, max. Zeilen begrenzen

Betrifft: `src/app/globals.css`, evtl. `CalendarShell.tsx`

**Problem:** Die Monatsansicht zeigt Überhang-Tage (Tage des Vor-/Folgemonats), was auf Mobile zu viele Zeilen erzeugt. Zellen wachsen, wenn ein Tag mehrere Events hat.

**Lösung:**
a) FullCalendar-Option `fixedWeekCount: false` setzen → zeigt nur die Wochen, die der Monat tatsächlich braucht (4-5 statt immer 6)
b) CSS auf Mobile: Zeilenhöhe begrenzen, Events begrenzen:

```css
@media (max-width: 639px) {
  .fc .fc-daygrid-body .fc-daygrid-day-frame {
    min-height: 2.5rem;
    max-height: 3.5rem;
    overflow: hidden;
  }
  .fc .fc-daygrid-day-events {
    max-height: 1.2rem;
    overflow: hidden;
  }
  /* "Mehr anzeigen"-Link von FullCalendar nutzen */
  .fc .fc-daygrid-more-link {
    font-family: var(--font-mono);
    font-size: 0.6rem;
    color: var(--copper);
  }
}
```

c) FullCalendar-Option `dayMaxEvents: 2` auf Mobile (zeigt max. 2 Events pro Tag, dann "+3 mehr"-Link). In CalendarShell:

```typescript
dayMaxEvents={narrow ? 2 : undefined}
```

### 3. Wochenansicht: Typografie weiter verkleinern

Betrifft: `src/app/globals.css`, `CalendarShell.tsx`

**Problem:** Tageszahl und "Ganztägig"-Label sind auf Mobile noch zu wuchtig.

**Lösung in `globals.css`:**

```css
@media (max-width: 639px) {
  /* Tageszahl im Wochen-Header kleiner */
  .calconny-week-day-head .text-2xl {
    font-size: 1.25rem;
  }
  /* Ganztägig-Achse kompakter */
  .fc .fc-timegrid-axis-cushion,
  .fc .fc-timegrid-slot-label-cushion.fc-scrollgrid-shrink-cushion {
    font-size: 0.6rem;
    padding: 0 2px;
  }
  /* Ganztags-Zeile Höhe begrenzen */
  .fc .fc-daygrid-body {
    font-size: 0.7rem;
  }
}
```

Alternativ in `CalendarShell.tsx`: Das Label "Ganztägig" durch "GT" oder ein Icon ersetzen via FullCalendar's `allDayText`-Option:

```typescript
allDayText="GT"
```

### 4. Monatsansicht Dots: Analyse und Verbesserung

Betrifft: `src/app/globals.css`

**Problem:** Die Dots (Event-Markierungen in der Monatsansicht) sind unklar – Herkunft und Tap-Verhalten müssen geklärt werden.

**Analyse-Schritte:**
1. Öffne Chrome DevTools im Responsive-Modus (360px)
2. Inspiziere eine Tageszelle mit Events
3. Prüfe: Sind die Dots die FullCalendar-Events mit `font-size: 0` + `border-radius: 50%` aus BER-42 §3?
4. Prüfe: Reagiert ein Tap auf einen Dot? Auf die Tageszelle?

**Erwartetes Verhalten:**
- Dots zeigen visuell an: "Dieser Tag hat Termine"
- Tap auf den Tag → FullCalendar wechselt zur Tagesansicht (navLinks ist aktiv)
- In der Tagesansicht: Events mit vollem Text sichtbar

Falls Dots nicht tappbar sind: `navLinks: true` stellt sicher, dass die **Tageszahl** klickbar ist. Die Dots selbst müssen nicht klickbar sein – der User tippt auf die Zahl.

Falls die Dots optisch unklar sind, verbessere:

```css
@media (max-width: 639px) {
  .fc-daygrid-event {
    font-size: 0 !important;
    line-height: 0;
    min-height: 6px;
    max-height: 6px;
    width: 6px;
    border-radius: 50%;
    padding: 0;
    margin: 1px auto;
    display: block;
    background: var(--copper);
    border: none;
  }
}
```

### 5. Toolbar-Hinweis (kein Code-Change)

Nur Klarstellung: Die Ansichtsbuttons (L/W/M) liegen korrekt im `ViewSwitcher.tsx`, nicht im Footer. Der Footer enthält nur Impressum + Zurück-Link. Das ist gewollt und korrekt.

→ Diesen Punkt in FEEDBACK.md nach "Erledigt" verschieben.

## Akzeptanzkriterien

- [ ] EventCard: Datum links, Uhrzeit rechts in einer Zeile, Beschreibung darunter
- [ ] Monatsansicht: Max. 2 Events pro Zelle auf Mobile, "+mehr"-Link bei Überlauf
- [ ] Monatsansicht: `fixedWeekCount: false` → nur 4-5 Wochen statt 6
- [ ] Wochenansicht: Tageszahl und "Ganztägig" deutlich kleiner auf Mobile
- [ ] Dots in Monatsansicht: Sauber als kupferfarbene Kreise, Tap auf Tag → Tagesdetail
- [ ] Toolbar-Hinweis in FEEDBACK.md nach "Erledigt" verschoben
- [ ] Kein horizontales Scrollen auf 360px

## Betroffene Dateien

- `src/components/calendar/EventCard.tsx`
- `src/components/calendar/CalendarShell.tsx`
- `src/app/globals.css`
- `FEEDBACK.md` (Toolbar-Hinweis verschieben)

## Abschluss

```bash
git add -A
git commit -m "BER-42: Mobile Feinschliff – EventCard Layout, Monatsansicht kompakt, Wochen-Typo"
git push
```
