"use client";

import { useState } from "react";

type EventCardProps = {
  title: string;
  /** Kalendertag (z. B. Mo., 10. Apr. 2026) */
  dateLabel?: string;
  timeLabel: string;
  location?: string;
  description?: string;
};

export function EventCard({ title, dateLabel, timeLabel, location, description }: EventCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = Boolean(description?.trim() || location?.trim());

  return (
    <div className="flex gap-3 border-l-4 border-[var(--copper)] bg-[var(--card)]/80 py-1 pl-3 pr-2">
      <button
        type="button"
        disabled={!hasDetails}
        aria-expanded={hasDetails ? expanded : undefined}
        onClick={(e) => {
          e.stopPropagation();
          if (!hasDetails) return;
          setExpanded((x) => !x);
        }}
        className={[
          "min-w-0 flex-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--copper)]",
          hasDetails ? "cursor-pointer" : "cursor-default",
        ].join(" ")}
      >
        <div className="flex justify-between gap-2 font-[family-name:var(--font-mono)] text-xs text-[var(--muted)]">
          <span className="min-w-0 truncate">{dateLabel ?? ""}</span>
          <span className="shrink-0 tabular-nums">{timeLabel}</span>
        </div>
        <p
          className={[
            "mt-1.5 font-[family-name:var(--font-body)] font-normal text-[var(--text)] transition-colors duration-200 ease-out",
            expanded ? "" : "line-clamp-1",
          ].join(" ")}
        >
          {title}
        </p>
        <div
          className={[
            "grid transition-[grid-template-rows] duration-200 ease-out",
            expanded && hasDetails ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          ].join(" ")}
        >
          <div className="min-h-0 overflow-hidden">
            {description?.trim() ? (
              <p className="mt-1 line-clamp-2 font-[family-name:var(--font-body)] font-light text-sm text-[var(--muted2)]">
                {description.trim()}
              </p>
            ) : null}
            {location?.trim() ? (
              <p className="mt-1 font-[family-name:var(--font-body)] font-light text-sm text-[var(--muted2)]">
                📍 {location.trim()}
              </p>
            ) : null}
          </div>
        </div>
      </button>
    </div>
  );
}
