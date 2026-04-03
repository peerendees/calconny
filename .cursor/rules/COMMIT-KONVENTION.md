# CalConny – Commit-Konvention

Projektübergreifend gilt **Englisch** und **Conventional Commits** (siehe Root-`CLAUDE.md` im Workspace).

## Linear (optional)

Wenn ihr Issues in Linear verknüpfen wollt, **einen** der folgenden Stile nutzen (Team einheitlich festlegen):

- Präfix im Subject: `BER-40: feat(api): parse ICS with ical.js`
- Oder Referenz am Ende: `feat(api): parse ICS with ical.js (BER-40)`

Relevante Issues (Orientierung):

| Issue   | Thema |
|---------|--------|
| BER-39  | Projekt-Setup (Next.js, Tailwind, CI, Fonts) |
| BER-40  | API-Route (ICS-Feed fetchen und parsen) |
| BER-41  | Kalenderansichten (Monat, Woche, Liste) |
| BER-42  | Responsive + Mobile |
| BER-43  | Vercel Deployment + Subdomain |

Neues Feature ohne Issue: normal committen; in Linear nachziehen, wenn ihr dort trackt.

## Format (Conventional Commits)

```
<type>(<scope>): <kurze Beschreibung im Imperativ>
```

Typen: `feat`, `fix`, `docs`, `chore`, `refactor`, …

## Beispiele (wie im Repo)

```
feat: add CalConny calendar app with FullCalendar and ICS API
fix(api): normalize webcal:// and webcals:// to https for ICS fetch
fix(api): robust ICS fetch for Vercel (User-Agent, IPv4-first, no-store)
feat: multi-feed env, refresh button, and PWA with auto-update
docs: add briefing status and commit rules for CalConny
```

## Regeln

- **Sprache der Message:** Englisch.
- Kein erzwungenes `BER-XX`-Präfix, solange das Team nichts anderes vereinbart.
