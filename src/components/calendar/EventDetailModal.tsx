"use client";

type EventDetailModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  dateLabel: string;
  timeLabel: string;
  location?: string;
  description?: string;
};

export function EventDetailModal({
  open,
  onClose,
  title,
  dateLabel,
  timeLabel,
  location,
  description,
}: EventDetailModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="calconny-event-detail-title"
        className="relative z-[101] max-h-[min(85dvh,720px)] w-full max-w-lg overflow-y-auto rounded-t-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-xl sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2
            id="calconny-event-detail-title"
            className="font-[family-name:var(--font-body)] text-lg font-normal text-[var(--text)]"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="touch-manipulation shrink-0 rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 font-[family-name:var(--font-mono)] text-xs uppercase text-[var(--muted)] hover:border-[var(--copper)] hover:text-[var(--copper)]"
          >
            Schließen
          </button>
        </div>
        {dateLabel ? (
          <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--muted)]">{dateLabel}</p>
        ) : null}
        <p className={`font-[family-name:var(--font-mono)] text-sm text-[var(--muted2)] ${dateLabel ? "mt-1" : ""}`}>
          {timeLabel}
        </p>
        {location ? (
          <p className="mt-3 font-[family-name:var(--font-body)] text-sm text-[var(--muted2)]">{location}</p>
        ) : null}
        {description ? (
          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <p className="font-[family-name:var(--font-mono)] text-xs uppercase text-[var(--muted)]">Beschreibung</p>
            <p className="mt-2 whitespace-pre-wrap font-[family-name:var(--font-body)] text-sm leading-relaxed text-[var(--text)]">
              {description}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
