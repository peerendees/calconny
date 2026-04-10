# CalConny – Feedback & Änderungswünsche

> Diese Datei ist die zentrale Sammelstelle für Auffälligkeiten, Bugs und Wünsche.
> Einfach unten anhängen. Format: Datum, was auffällt, ggf. Screenshot-Beschreibung.
> Claude liest diese Datei und erstellt daraus Issues/Briefings.
> Cursor liest diese Datei und kann Punkte direkt abarbeiten.

**„Dokumentieren“:** meint **nur** einen Eintrag in **`FEEDBACK.md`** (Anforderung festhalten, ggf. Screenshot verlinken). **Umsetzung im Code** erfolgt im **nächsten Briefing** bzw. wenn ausdrücklich zum Bearbeiten aufgefordert – nicht automatisch beim Wort „dokumentieren“.

---

## Offen

<!-- Neue Einträge hier einfügen, Format:
### [Datum] Kurze Beschreibung
Was genau passiert / was erwartet wird / wo genau (Ansicht, Gerät)
-->

### [2026-04-10] Datum/Uhrzeit: Abgleich mit Sonner-Referenz (optional)

**Schrift:** positiv beibehalten.

**Offen (niedrige Priorität):** Ob die **Anordnung** langfristig dem Muster aus **`berent-ai-mail/src/components/ui/sonner.tsx`** folgen soll (Titel/Beschreibung/Zeilenführung), ist **nicht zwingend** – Layout in **EventCard** und Modal ist nach **BER-42 Teil 2** umgesetzt (Datum links, Uhrzeit rechts, Beschreibung darunter).

---

## Erledigt

<!-- Abgearbeitete Punkte hierher verschieben -->

### [2026-04-10] BER-42 Teil 2 – Mobile Feinschliff (Briefing `.cursor/briefings/BER-42-mobile-teil2.md`)

- **EventCard + EventDetailModal:** Erste Zeile `justify-between` – Datum links, Uhrzeit rechts (`font-mono`, `text-xs`, `--muted`); Titel (`--text`); Beschreibung (`font-light`, `text-sm`, `--muted2`, `line-clamp-2`); Ort mit 📍 falls gesetzt.
- **Monatsansicht:** `fixedWeekCount={false}`; mobil `dayMaxEvents={2}`; CSS: Zellenrahmen `min/max-height`, `daygrid-more-link` kupfer/mono; Dots: kupferfarbene 6px-Kreise; Hinweis: **Tap auf Tageszahl** nutzt `navLinks` zur Tagesdetail-Ansicht (Dots nur Indikator).
- **Wochenansicht:** Kleinere Tageszahl (`.calconny-week-day-num`), Achsen- und Slot-Typo; mobil `allDayText="GT"`; Ganztags-Zeile im Zeitraster kompakter.
- **Toolbar:** Ansichtsbuttons liegen in **`ViewSwitcher.tsx`**, nicht im Footer – dokumentiert und gewollt.

### [2026-04-10] Monatsübersicht: Zeilenhöhe, Umfang, Navigation

Umgesetzt in **BER-42 Teil 2** (`fixedWeekCount`, `dayMaxEvents`, kompakte Zellen, „mehr“-Link). Weitere Iteration nur bei neuem Feedback.

### [2026-04-10] Wochenansicht: Kopfzeile & „Ganztägig“ – Feintuning offen

Umgesetzt in **BER-42 Teil 2** (siehe oben). CI-Farben im Betrieb prüfen bleibt Nutzer-Feedback.

### [2026-04-10] Toolbar: Ansichtsbuttons liegen nicht im Footer (Hinweis)

Die **Ansichtsbuttons** sind in **`ViewSwitcher.tsx`**, nicht in **`Footer.tsx`** (dort nur Impressum und Link zur Hauptseite). Gewollt.

### [2026-04-10] Monatsansicht: Punkte im Raster – Analyse nötig

**Screenshot:** [docs/feedback/month-grid-dots-2026-04-10.png](docs/feedback/month-grid-dots-2026-04-10.png)

**Klarstellung:** Punkte sind **FullCalendar-Events** mit **BER-42**-CSS (Text ausgeblendet, Kreise). **Tap:** Tageszahl über **`navLinks`** → Wechsel in die Tagesansicht; Dots müssen nicht separat tappbar sein. CSS in **BER-42 Teil 2** nachgezogen (kupferfarbene Kreise).

### [2026-04-10] Datum/Uhrzeit: Layout-Wunsch (Listenkarte / Modal)

Layout **Datum links · Uhrzeit rechts · Beschreibung darunter** in **EventCard** und Modal umgesetzt (**BER-42 Teil 2**). Bezug **Footer.tsx** im ursprünglichen Feedback war irreführend; relevant sind **EventCard** / **EventDetailModal**.

### [2026-04-10] Listenansicht + Event-Detail: Kalenderdatum angezeigt

In `EventCard` und im Tap-Modal wird das Event-Datum deutsch formatiert (Wochentag, Tag, Monat, Jahr), zusätzlich zu Uhrzeit bzw. „Ganztägig“.

### [2026-04-10] Wochenansicht: Tages-Header, Ganztags- und Termin-Texte

**Ausgang (Screenshot):** [docs/feedback/week-view-missing-day-headers-2026-04-10.png](docs/feedback/week-view-missing-day-headers-2026-04-10.png)

**Problem:** Kopfzeile neben „KW …“ ohne **Tages-Datum**; Ganztags-Zeile mit abgeschnittenem „Ganztäg…“; **Titel/Beschreibung** bei Ganztags- und Zeit-Events in der Wochenansicht fehlten oder griffen Custom-Rendering nicht.

**Ursache:** `view.type` bei Custom-Views ist `slidingWeek` / `slidingWeekNarrow`, nicht der String `timeGrid` – Bedingungen mit `includes("timeGrid")` schlugen fehl.

**Umsetzung:** Hilfsfunktion `isWeekGridView()` in `CalendarShell.tsx`; `dayHeaderContent` und `eventContent` für Woche angepasst; Ganztags: Titel + optional Beschreibung (`line-clamp-2`); zeitgebunden: Zeit + Titel + Beschreibung; CSS: Achsen-Spalte „Ganztägig“ umbrechen/mindestens Breite.

### [2026-04-10] BER-42: Wisch-Navigation + kleineres Wochen-Header-Typo

- Horizontal wischen auf dem Kalender-Container: **>50px**, dominanter Horizontalzug gegenüber Vertikal → `prev()` / `next()` (Monat, Liste, Woche).
- Wochen-Kopf: **Tageszahl** etwas kleiner, **Kupfer** (`--copper`); **„Ganztägig“**-Achse kleinere Schrift (weiteres Feintuning offen, siehe „Offen“).

### [2026-04-10] ViewSwitcher: eine Zeile Steuerung, Zeitraum darunter; L–W–M; Monat mobil (Dots)

- **ViewSwitcher:** **Grid** `1fr auto 1fr`: **Links-Navigation** | **L / W / M** (mittig) | **Rechts-Navigation + Aktualisieren**; **Zeitraum** in der zweiten Zeile.
- **BER-42 §3:** Unter `max-width: 639px` Monatsraster: Events als **kleine Punkte** (Text ausgeblendet), kompaktere **Wochentags-** und **Tageszahlen**-Typo.

### [2026-04-10] BER-42 §4 + §5: Typografie mobil, Wochen-Höhe

- **§4:** `max-width: 639px` – kleinere **Header-Cushions**, **Slot-Zeiten**, **`fc-list-event-title`** 0,85rem.
- **§5:** **`.fc-timegrid`** `max-height: calc(100dvh - 220px)`, `overflow-y: auto` (mobil).
