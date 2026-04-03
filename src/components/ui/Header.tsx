import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <a
          href="https://berent.ai"
          className="nav-brand group flex items-center gap-3 text-[var(--text)]"
        >
          <div className="plus-mark" aria-hidden />
          <span className="font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.04em] text-[var(--text)] sm:text-base">
            BERENT.AI — Beratung + Entwicklung
          </span>
        </a>
        <ThemeToggle />
      </div>
    </header>
  );
}
