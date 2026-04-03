type EventCardProps = {
  title: string;
  timeLabel: string;
  location?: string;
};

export function EventCard({ title, timeLabel, location }: EventCardProps) {
  return (
    <div className="flex gap-3 border-l-4 border-[var(--copper)] bg-[var(--card)]/80 py-1 pl-3 pr-2">
      <div className="min-w-0 flex-1">
        <p className="font-[family-name:var(--font-body)] font-normal text-[var(--text)]">
          {title}
        </p>
        <p className="mt-0.5 font-[family-name:var(--font-mono)] text-xs text-[var(--muted)]">
          {timeLabel}
        </p>
        {location ? (
          <p className="mt-1 font-[family-name:var(--font-body)] font-light text-sm text-[var(--muted2)]">
            {location}
          </p>
        ) : null}
      </div>
    </div>
  );
}
