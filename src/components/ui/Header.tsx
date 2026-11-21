import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="calconny-safe-x mx-auto flex max-w-6xl items-center justify-between gap-3 py-2">
        <a
          href="https://berent.ai"
          className="nav-brand group flex min-h-11 min-w-0 items-center gap-3 text-[var(--text)]"
        >
          <div className="plus-mark" aria-hidden />
          <span className="min-w-0 font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.04em] text-[var(--text)] sm:text-base">
            BERENT.AI — Beratung + Entwicklung
          </span>
        </a>
        <ThemeToggle />
      </div>
    </header>
  );
}
