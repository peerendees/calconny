# Cursor-Briefing: BER-42 – Mobile-First Android-Optimierung

**Datum:** 10.04.2026
**Linear-Issue:** [BER-42](https://linear.app/berent/issue/BER-42/mobile-first-radikale-android-optimierung-360px)
**Projekt:** CalConny
**Komplexität:** Mittel
**Priorität:** URGENT – 99% der Nutzung ist auf dem Android-Smartphone

## Ziel

Die App muss auf einem Android-Smartphone (360px Viewport, Chrome) einwandfrei und komfortabel nutzbar sein. Desktop ist sekundär. Alles was auf Mobile stört, muss radikal vereinfacht werden. Und: Die Termine müssen inhaltlich erkennbar sein – aktuell zeigen die Events keinen Text.

## Umsetzung (Prioritätsreihenfolge)

### 0. EVENT-INHALTE SICHTBAR MACHEN (HÖCHSTE PRIORITÄT)

**Problem:** Die importierten Kalendereinträge werden in der App angezeigt, enthalten aber keinen sichtbaren Text. Der Benutzer kann nicht erkennen, worum es bei einem Termin geht.

**Diagnose – drei mögliche Ursachen:**

**A) ICS-Parser extrahiert Felder nicht vollständig:**
In `src/lib/ics-parser.ts` wird `ev.summary` für den Titel verwendet. Prüfe:
- Ob der ICS-Feed tatsächlich SUMMARY-Felder enthält (Debug-Logging einbauen)
- Ob iCloud-Kalender die Events evtl. unter einem anderen Property-Namen liefert
- Ob `ev.summary` bei manchen Events `null` oder leer ist → dann zeigt die App "(Ohne Titel)"

Debug-Schritt: Füge temporär ein Logging in die API-Route ein:
```typescript
// In route.ts, nach dem Parsen:
console.log('Parsed events:', JSON.stringify(events.slice(0, 3), null, 2));
```
Prüfe die Vercel-Logs (oder lokales `npm run dev`), ob title, description, location befüllt sind.

**B) Frontend zeigt Felder nicht an:**
In `CalendarShell.tsx`, `eventContent` Callback:
- In der Monatsansicht (`dayGridMonth`) gibt `eventContent` `undefined` zurück → FullCalendar nutzt seinen Default-Renderer, der nur `event.title` zeigt
- In der Wochenansicht (`timeGrid`) wird nur Uhrzeit + Titel gezeigt
- In der Listenansicht wird `EventCard` mit `title`, `timeText`, `location` gerendert
- **Aber:** `description` wird NIE angezeigt – es wird zwar als `extendedProps` durchgereicht, aber nirgends gerendert

**C) FullCalendar rendert Events zu klein:**
Auf Mobile sind die Event-Elemente so schmal, dass der Text nicht sichtbar ist, selbst wenn er vorhanden ist.

**Lösung:**
1. Baue Debug-Logging in die API-Route ein, prüfe was der Feed tatsächlich liefert
2. Erweitere `EventCard.tsx` um `description`:
```typescript
type EventCardProps = {
  title: string;
  timeLabel: string;
  location?: string;
  description?: string;  // NEU
};
```
3. In `CalendarShell.tsx`, übergib `description` an EventCard:
```typescript
<EventCard
  title={arg.event.title}
  timeLabel={arg.timeText}
  location={arg.event.extendedProps?.location as string | undefined}
  description={arg.event.extendedProps?.description as string | undefined}
/>
```
4. Zeige die Description in der EventCard als zusätzliche Zeile (gekürzt auf 2 Zeilen mit `line-clamp-2`)
5. In der Monatsansicht: Tap auf Tag → Detail mit vollem Event-Text (nicht nur Dots)

**Akzeptanzkriterium:** Jeder Termin zeigt mindestens Titel + Uhrzeit. Falls Description vorhanden, wird sie in Listenansicht und bei Tap-auf-Event angezeigt.

---

### 1. Mobile-Default: Listenansicht

In `CalendarShell.tsx`:
- Prüfe beim Mount ob `narrow` (< 640px) → setze `initialView` auf `listWeek` statt `dayGridMonth`
- `activeView` State initial abhängig von `narrow`
- Die Listenansicht ist die lesbarste Ansicht auf dem Smartphone

### 2. Touch-Swipe-Navigation

Implementiere Swipe-Gesten auf dem FullCalendar-Container:
- Swipe links → `next()`
- Swipe rechts → `prev()`
- Nutze native Touch-Events (kein extra Package nötig):

```typescript
let startX = 0;
const container = containerRef.current;
container.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; });
container.addEventListener('touchend', (e) => {
  const diff = e.changedTouches[0].clientX - startX;
  if (Math.abs(diff) > 50) {
    diff > 0 ? calRef.current?.getApi().prev() : calRef.current?.getApi().next();
  }
});
```

- Mindest-Swipe-Distanz: 50px (verhindert versehentliches Blättern)
- In allen drei Ansichten aktiv

### 3. Monatsansicht Mobile-optimieren

In `globals.css` unter einem `@media (max-width: 639px)` Block:
- Event-Text ausblenden, stattdessen nur farbige Dots zeigen
- `.fc-daygrid-event { font-size: 0; padding: 2px; border-radius: 50%; max-width: 8px; max-height: 8px; }`
- Wochentage-Header kleiner: `.fc .fc-col-header-cell-cushion { font-size: 0.6rem; }`
- Tages-Zahlen kompakter: `.fc .fc-daygrid-day-number { font-size: 0.75rem; padding: 2px 4px; }`

Tap auf Tag → `navLinks: true` ist bereits aktiv, das sollte zur Tagesdetailansicht führen. Prüfe ob das auf Mobile auslöst. Wenn der User auf einen Tag tippt, soll eine Detail-Ansicht (Liste für diesen Tag) erscheinen, in der alle Events mit vollem Text sichtbar sind.

### 4. Responsive Typografie

In `globals.css`:

```css
@media (max-width: 639px) {
  .fc .fc-col-header-cell-cushion,
  .fc .fc-daygrid-day-number {
    font-size: 0.65rem;
  }
  .fc .fc-timegrid-slot-label,
  .fc .fc-timegrid-slot-label-cushion {
    font-size: 0.65rem;
  }
  .fc .fc-list-event-title {
    font-size: 0.85rem;
  }
}
```

### 5. Wochenansicht Höhe dynamisch

In `CalendarShell.tsx`, `weekTimeGridOpts`:
- Ersetze `height: 420` durch `height: 'auto'` oder besser: berechne dynamisch
- Auf Mobile: nutze CSS auf dem Container statt FullCalendar-Option

```css
@media (max-width: 639px) {
  .fc .fc-timegrid {
    max-height: calc(100dvh - 220px);
    overflow-y: auto;
  }
}
```

Nutze `dvh` statt `vh` – Android Chrome URL-Bar verändert die Höhe.

### 6. Android PWA-Icon fix

Die `manifest.ts` hat bereits separate `any` und `maskable` Icons – das ist korrekt.

Falls Android das Icon trotzdem falsch anzeigt:
1. Prüfe ob die Maskable-Datei (`icon-maskable-192.png`) tatsächlich 10% Padding hat
2. Teste mit https://maskable.app ob der Crop stimmt
3. Falls nötig: Padding auf 15% erhöhen (Android schneidet aggressiver als iOS)
4. PWA auf Android komplett deinstallieren und neu zum Homescreen hinzufügen (Cache!)

## Akzeptanzkriterien

- [ ] Events zeigen mindestens Titel + Uhrzeit in allen Ansichten
- [ ] Description wird in Listenansicht und bei Event-Tap angezeigt
- [ ] Listenansicht ist Default auf < 640px
- [ ] Swipe links/rechts blättert in allen Ansichten
- [ ] Monatsansicht: Events als Dots, Tap auf Tag → Detailansicht mit vollem Text
- [ ] Kein horizontales Scrollen auf 360px
- [ ] Wochenansicht nutzt verfügbaren Viewport dynamisch
- [ ] Alle Schriften lesbar auf 360px
- [ ] Android PWA-Icon zeigt Gesicht vollständig im runden Crop
- [ ] Touch-Targets überall mindestens 44x44px

## Betroffene Dateien

- `src/lib/ics-parser.ts` (Debug / Prüfung)
- `src/app/api/calendar/route.ts` (Debug-Logging)
- `src/components/calendar/CalendarShell.tsx`
- `src/components/calendar/EventCard.tsx`
- `src/app/globals.css`
- `src/app/manifest.ts`
- Evtl. `src/components/calendar/ViewSwitcher.tsx`

## Abschluss

```bash
git add -A
git commit -m "BER-42: Mobile-First Android-Optimierung + Event-Content sichtbar"
git push
```
