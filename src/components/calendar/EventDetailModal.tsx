"use client";

import { useEffect } from "react";

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
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      {/* touch-none: Wischen auf dem Hintergrund scrollt nicht die Seite dahinter */}
      <div className="absolute inset-0 touch-none bg-black/55 backdrop-blur-[2px]" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="calconny-event-detail-title"
        className="relative z-[101] max-h-[min(85dvh,720px)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-xl border border-[var(--border)] bg-[var(--card)] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-4 shadow-xl sm:rounded-xl sm:p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 justify-between gap-2 font-[family-name:var(--font-mono)] text-xs text-[var(--muted)]">
            <span className="min-w-0 truncate">{dateLabel || ""}</span>
            <span className="shrink-0 tabular-nums">{timeLabel}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-manipulation flex min-h-11 shrink-0 items-center rounded border border-[var(--border)] bg-[var(--bg)] px-3 font-[family-name:var(--font-mono)] text-xs uppercase text-[var(--muted)] hover:border-[var(--copper)] hover:text-[var(--copper)]"
          >
            Schließen
          </button>
        </div>
        <h2
          id="calconny-event-detail-title"
          className="break-words font-[family-name:var(--font-body)] text-lg font-normal text-[var(--text)]"
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-3 whitespace-pre-wrap break-words font-[family-name:var(--font-body)] font-light text-sm leading-relaxed text-[var(--muted2)]">
            {description}
          </p>
        ) : null}
        {location ? (
          <p className="mt-3 break-words font-[family-name:var(--font-body)] font-light text-sm text-[var(--muted2)]">
            📍 {location}
          </p>
        ) : null}
      </div>
    </div>
  );
}
