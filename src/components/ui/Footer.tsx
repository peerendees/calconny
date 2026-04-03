export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--card)] px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-[var(--text)]">
          <div className="footer-brand flex items-center gap-2 font-[family-name:var(--font-display)] text-lg uppercase tracking-[0.04em]">
            <div className="plus-mark" aria-hidden />
            BERENT
          </div>
          <span className="font-[family-name:var(--font-body)] text-sm text-[var(--muted)]">
            CalConny · berent.ai
          </span>
        </div>
        <div className="footer-links flex flex-wrap gap-4 text-sm font-[family-name:var(--font-mono)] font-medium uppercase">
          <a href="https://berent.ai/impressum.html">Impressum</a>
          <a href="https://berent.ai">← Zurück zur Hauptseite</a>
        </div>
      </div>
    </footer>
  );
}
