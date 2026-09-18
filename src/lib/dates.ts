import { severityLevels, type Entry } from "./entries";

export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function localDateTime(date: Date) {
  return `${dateKey(date)}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function localDateTimeOnDay(day: string, now: Date) {
  return `${day}${localDateTime(now).slice(10)}`;
}

export function parseLocalDateTime(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return undefined;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && localDateTime(date) === value ? date : undefined;
}

export function entryTimeForSubmission(when: string, touched: boolean, initialDay: string | undefined, now: Date) {
  return touched ? when : initialDay ? localDateTimeOnDay(initialDay, now) : localDateTime(now);
}

export function shiftDate(key: string, days: number) {
  const date = new Date(`${key}T12:00:00`);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

export function formatDay(key: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("nb-NO", options).format(new Date(`${key}T12:00:00`));
}

export function entryDay(entry: Entry) {
  return dateKey(new Date(entry.occurredAt));
}

export function hasSymptoms(entry: Extract<Entry, { kind: "symptom" }>) {
  return entry.payload.pain !== "none" || entry.payload.nausea !== "none" ||
    entry.payload.headache !== "none" || entry.payload.vomited || entry.payload.fever;
}

export function getWeekOverview(entries: Entry[], today: string) {
  const days = Array.from({ length: 7 }, (_, index) => ({
    key: shiftDate(today, index - 6),
    registrations: 0,
    highestPain: 0,
  }));
  const byDay = new Map(days.map((day) => [day.key, day]));
  let symptomatic = 0;

  for (const entry of entries) {
    const day = byDay.get(entryDay(entry));
    if (!day) continue;
    day.registrations += 1;
    if (entry.kind !== "symptom") continue;
    day.highestPain = Math.max(day.highestPain, severityLevels.indexOf(entry.payload.pain));
    if (hasSymptoms(entry)) symptomatic += 1;
  }

  return {
    days,
    registrations: days.reduce((total, day) => total + day.registrations, 0),
    symptomatic,
  };
}
