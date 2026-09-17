import { formatDay, getWeekOverview } from "@/lib/dates";
import type { Entry } from "@/lib/entries";

export function WeekOverview({ entries, today, selectedDay, onSelectDay }: {
  entries: Entry[];
  today: string;
  selectedDay: string;
  onSelectDay: (day: string) => void;
}) {
  const overview = today ? getWeekOverview(entries, today) : { days: [], checkins: 0, symptomatic: 0 };

  return (
    <section className="week-card" aria-label="De siste sju dagene">
      <div className="week-heading">
        <div><span className="section-kicker">KORT FORTALT</span><h2>De siste 7 dagene</h2></div>
        <p><span className="week-count">{overview.checkins}</span> registreringer <span className="count-separator">·</span> <span className="week-count">{overview.symptomatic}</span> med symptomer</p>
      </div>
      <div className="week-days">
        {overview.days.map((day) => (
          <button key={day.key} className={`week-day ${selectedDay === day.key ? "active" : ""}`} onClick={() => onSelectDay(day.key)} type="button" aria-pressed={selectedDay === day.key}>
            <span>{formatDay(day.key, { weekday: "short" })}</span>
            <strong>{formatDay(day.key, { day: "numeric" })}</strong>
            <span className={`day-indicator ${day.checkins ? `indicator-${day.highestPain}` : ""}`} />
          </button>
        ))}
      </div>
      <div className="week-legend"><span><i className="legend-dot no-log" /> Ikke registrert</span><span><i className="legend-dot logged" /> Ingen smerter</span><span><i className="legend-dot pain" /> Smerter registrert</span></div>
    </section>
  );
}
