import { CalendarShell } from "@/components/calendar/CalendarShell";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1">
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl uppercase tracking-[0.04em] text-[var(--text)] sm:text-4xl">
        CalConny
      </h1>
      <p className="mb-8 font-[family-name:var(--font-body)] text-sm text-[var(--muted)] sm:text-base">
        Connys Kalender-Feed · Monat, Woche und Liste
      </p>
      <CalendarShell />
    </div>
  );
}
