"use client";

import type { CalendarView } from "@/lib/types";

type ViewSwitcherProps = {
  active: CalendarView;
  rangeTitle: string;
  onViewChange: (view: CalendarView) => void;
  /** Monat / Liste: ein Schritt (Monat bzw. Listenzeitraum) */
  onPrevPeriod: () => void;
  onNextPeriod: () => void;
  /** Nur Wochenansicht: Tag-Schritt (einzelner Pfeil) */
  onPrevDay: () => void;
  onNextDay: () => void;
  /** Nur Wochenansicht: Wochen-Schritt (Doppelpfeil) */
  onPrevWeek: () => void;
  onNextWeek: () => void;
  showWeekStepNav: boolean;
  onRefresh: () => void;
  refreshing: boolean;
};

/** Reihenfolge: Liste → Woche → Monat (mittig in der Zeile). */
const views: { id: CalendarView; label: string; short: string }[] = [
  { id: "listWeek", label: "Liste", short: "L" },
  { id: "slidingWeek", label: "Woche", short: "W" },
  { id: "dayGridMonth", label: "Monat", short: "M" },
];

const viewBtnClass = [
  "touch-manipulation min-h-11 min-w-[2.75rem] rounded border px-2 py-2 font-[family-name:var(--font-mono)] text-[0.65rem] uppercase tracking-wide transition-colors sm:min-h-0 sm:min-w-0 sm:px-3 sm:py-1.5 sm:text-xs",
].join(" ");

const navBtnClass =
  "touch-manipulation flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded border border-[var(--border)] bg-[var(--card)] font-[family-name:var(--font-mono)] text-base text-[var(--text)] hover:border-[var(--copper)] active:bg-[var(--card)]";

const refreshBtnClass =
  "touch-manipulation flex min-h-11 shrink-0 items-center justify-center rounded border border-[var(--border)] bg-[var(--card)] px-3 font-[family-name:var(--font-mono)] text-[0.65rem] uppercase tracking-wide text-[var(--text)] hover:border-[var(--copper)] disabled:opacity-50 sm:px-3 sm:text-xs";

export function ViewSwitcher({
  active,
  rangeTitle,
  onViewChange,
  onPrevPeriod,
  onNextPeriod,
  onPrevDay,
  onNextDay,
  onPrevWeek,
  onNextWeek,
  showWeekStepNav,
  onRefresh,
  refreshing,
}: ViewSwitcherProps) {
  return (
    <div className="flex w-full max-w-full flex-col gap-2">
      {/* Zeile 1: Links-Navigation | L / W / M (zentriert) | Rechts-Navigation + Aktualisieren */}
      <div className="grid min-w-0 min-h-[2.75rem] w-full grid-cols-[1fr_auto_1fr] items-center gap-x-1 gap-y-0">
        <div className="flex min-w-0 flex-nowrap items-center justify-start gap-0.5 sm:gap-1">
          {showWeekStepNav ? (
            <>
              <button
                type="button"
                onClick={onPrevWeek}
                className={navBtnClass}
                aria-label="Eine Woche zurück"
                title="Eine Woche zurück"
              >
                «
              </button>
              <button
                type="button"
                onClick={onPrevDay}
                className={navBtnClass}
                aria-label="Einen Tag zurück"
                title="Einen Tag zurück"
              >
                ‹
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onPrevPeriod}
              className={navBtnClass}
              aria-label="Vorheriger Zeitraum"
            >
              ←
            </button>
          )}
        </div>

        <div className="flex shrink-0 flex-nowrap items-center justify-center gap-0.5 sm:gap-1">
          {views.map((v) => {
            const isOn = active === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onViewChange(v.id)}
                className={[
                  viewBtnClass,
                  isOn
                    ? "border-[var(--copper)] bg-[var(--copper)] text-[var(--bg)]"
                    : "border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:border-[var(--copper)]",
                ].join(" ")}
              >
                <span className="sm:hidden">{v.short}</span>
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex min-w-0 flex-nowrap items-center justify-end gap-0.5 sm:gap-1">
          {showWeekStepNav ? (
            <>
              <button
                type="button"
                onClick={onNextDay}
                className={navBtnClass}
                aria-label="Einen Tag vor"
                title="Einen Tag vor"
              >
                ›
              </button>
              <button
                type="button"
                onClick={onNextWeek}
                className={navBtnClass}
                aria-label="Eine Woche vor"
                title="Eine Woche vor"
              >
                »
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onNextPeriod}
              className={navBtnClass}
              aria-label="Nächster Zeitraum"
            >
              →
            </button>
          )}
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className={`${refreshBtnClass} hidden sm:flex`}
            aria-label="Kalenderdaten neu laden"
            title="Kalenderdaten neu laden"
          >
            {refreshing ? "…" : "↻"}
            <span className="ml-1 hidden sm:inline">{refreshing ? "Lädt …" : "Aktualisieren"}</span>
          </button>
        </div>
      </div>

      <p className="w-full text-center font-[family-name:var(--font-body)] text-sm text-[var(--text)] sm:text-left sm:text-base">
        {rangeTitle}
      </p>
    </div>
  );
}
