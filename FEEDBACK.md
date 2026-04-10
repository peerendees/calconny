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

### [2026-04-10] Monatsübersicht: Zeilenhöhe, Umfang, Navigation

Die Zeilenhöhe wächst, wenn mehr als ein Termin in einer Zelle steht. Hier braucht es eine Logik mit einem Button zum Erweitern (drei Punkte oder ähnliches).

Insgesamt ist die Monatsübersicht noch zu groß, weil dort mehr als nur die Tage des aktuellen Monats angezeigt werden. Das müssen wir radikal kürzen, oder wir überlegen, auf vier Zeilen zu verkürzen und durch weiches Scrollen weiterzukommen statt durch Links- und Rechts-Pfeile. Details klären wir im nächsten Briefing.

### [2026-04-10] Wochenansicht: Kopfzeile & „Ganztägig“ – Feintuning offen

**Positiv:** Die Eintragung mit **Wochentag** und darunter **Tagesdatum** ist grundsätzlich stimmig; **CI-Farbe** (Kupfer) für Akzente ist erwünscht – bitte im Betrieb prüfen.

**Nachholbedarf:** Die Darstellung ist **insgesamt noch zu groß** (v. a. die **Tageszahl**). Typografie und Abstände weiter verkleinern, bis es sich „richtig“ anfühlt.

**„Ganztägig“** (Achsen-Beschriftung links in der Ganztags-Zeile): weiterhin **zu groß** bzw. wuchtig – hier ist noch **Nachholbedarf** (kleinere Schrift, ggf. kürzeres Label oder schmalere Spalte).

### [2026-04-10] Toolbar: Ansichtsbuttons liegen nicht im Footer (Hinweis)

Die **Ansichtsbuttons** sind in **`ViewSwitcher.tsx`**, nicht in **`Footer.tsx`** (dort nur Impressum und Link zur Hauptseite).

### [2026-04-10] Monatsansicht: Punkte im Raster – Analyse nötig

**Screenshot:** [docs/feedback/month-grid-dots-2026-04-10.png](docs/feedback/month-grid-dots-2026-04-10.png)

In der **Monatsübersicht** erscheinen **markante Punkte** (z. B. braune Kreise in einzelnen Tageszellen) sowie **weitere kleine Symbole**. Es ist **unklar**, wie diese **genau zustande kommen** (z. B. FullCalendar-Event-Darstellung, **BER-42 §3**-CSS mit verstecktem Text, Mehrfach-Events, `navLinks`, andere FullCalendar-Standard-Elemente).

**Aufgabe:** **Analyse** im nächsten Schritt/Briefing – Datenfluss, DOM/CSS und erwartetes Nutzerfeedback (Lesbarkeit, Klick/Tap) klären, bevor weitere Designänderungen.

### [2026-04-10] Datum/Uhrzeit: Anordnung prüfen; Referenz Sonner; Schrift positiv; Layout-Wunsch

**Schrift:** Die verwendete **Schrift** wird **positiv** bewertet.

**Anordnung „Thema Datum“:** Es muss **geprüft** werden, ob die **Anordnung** (bzw. das stilistische Muster) so **bleiben** soll wie bei **`berent-ai-mail/src/components/ui/sonner.tsx`** (Toaster/Sonner-Komponente – ggf. als Referenz für Titel/Beschreibung/Zeilenführung, nicht zwingend 1:1 übertragbar).

**Layout-Wunsch (gefühlsmäßig, nächstes Briefing):** Das **Datum** soll **links** stehen, die **Uhrzeit** **rechts**, **über** der **Beschreibung des Termins** (eine Zeile: Datum links · Uhrzeit rechts, darunter der Beschreibungstext). Bezug genannt: **`calconny/src/components/ui/Footer.tsx`** – die **aktuelle** CalConny-`Footer.tsx` enthält **kein** Termin-Datum/-Uhrzeit (nur Branding und Links). Vermutlich ist die **Termin-Detailansicht** (z. B. Modal nach Tap, Listenkarte) gemeint; **exakte Komponente und Umsetzung** klären wir im **nächsten Briefing**.

---

## Erledigt

<!-- Abgearbeitete Punkte hierher verschieben -->

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
