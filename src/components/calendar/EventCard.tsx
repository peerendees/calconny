type EventCardProps = {
  title: string;
  /** Kalendertag (z. B. Mo., 10. Apr. 2026); leer = Zeile auslassen */
  dateLabel?: string;
  timeLabel: string;
  location?: string;
  description?: string;
};

export function EventCard({ title, dateLabel, timeLabel, location, description }: EventCardProps) {
  return (
    <div className="flex gap-3 border-l-4 border-[var(--copper)] bg-[var(--card)]/80 py-1 pl-3 pr-2">
      <div className="min-w-0 flex-1">
        <p className="font-[family-name:var(--font-body)] font-normal text-[var(--text)]">
          {title}
        </p>
        {dateLabel ? (
          <p className="mt-0.5 font-[family-name:var(--font-mono)] text-xs text-[var(--muted)]">{dateLabel}</p>
        ) : null}
        <p className="mt-0.5 font-[family-name:var(--font-mono)] text-xs text-[var(--muted2)]">{timeLabel}</p>
        {location ? (
          <p className="mt-1 font-[family-name:var(--font-body)] font-light text-sm text-[var(--muted2)]">
            {location}
          </p>
        ) : null}
        {description ? (
          <p className="mt-1 line-clamp-2 font-[family-name:var(--font-body)] font-light text-sm text-[var(--muted2)]">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
