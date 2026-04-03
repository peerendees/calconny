"use client";

import type { CalendarView } from "@/lib/types";

type ViewSwitcherProps = {
  active: CalendarView;
  rangeTitle: string;
  onViewChange: (view: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onRefresh: () => void;
  refreshing: boolean;
};

const views: { id: CalendarView; label: string; short: string }[] = [
  { id: "dayGridMonth", label: "Monat", short: "M" },
  { id: "slidingWeek", label: "Woche", short: "W" },
  { id: "listWeek", label: "Liste", short: "L" },
];

export function ViewSwitcher({
  active,
  rangeTitle,
  onViewChange,
  onPrev,
  onNext,
  onRefresh,
  refreshing,
}: ViewSwitcherProps) {
  return (
    <div className="flex w-full max-w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-center justify-center gap-1 sm:justify-start">
        <button
          type="button"
          onClick={onPrev}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-[var(--border)] bg-[var(--card)] font-[family-name:var(--font-mono)] text-[var(--text)] hover:border-[var(--copper)]"
          aria-label="Vorheriger Zeitraum"
        >
          ←
        </button>
        <p className="min-w-0 flex-1 truncate text-center font-[family-name:var(--font-body)] text-sm text-[var(--text)] sm:text-left sm:text-base">
          {rangeTitle}
        </p>
        <button
          type="button"
          onClick={onNext}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-[var(--border)] bg-[var(--card)] font-[family-name:var(--font-mono)] text-[var(--text)] hover:border-[var(--copper)]"
          aria-label="Nächster Zeitraum"
        >
          →
        </button>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="ml-1 flex h-9 shrink-0 items-center justify-center rounded border border-[var(--border)] bg-[var(--card)] px-2 font-[family-name:var(--font-mono)] text-[0.65rem] uppercase tracking-wide text-[var(--text)] hover:border-[var(--copper)] disabled:opacity-50 sm:px-3 sm:text-xs"
          aria-label="Kalenderdaten neu laden"
          title="Kalenderdaten neu laden"
        >
          {refreshing ? "…" : "↻"}
          <span className="ml-1 hidden sm:inline">{refreshing ? "Lädt …" : "Aktualisieren"}</span>
        </button>
      </div>

      <div className="flex justify-center gap-1 sm:justify-end">
        {views.map((v) => {
          const isOn = active === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onViewChange(v.id)}
              className={[
                "rounded border px-2 py-1.5 font-[family-name:var(--font-mono)] text-[0.65rem] uppercase tracking-wide transition-colors sm:px-3 sm:text-xs",
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
    </div>
  );
}
