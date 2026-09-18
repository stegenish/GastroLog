import { describe, expect, it } from "vitest";
import { entryTimeForSubmission, formatDay, getWeekOverview, localDateTimeOnDay, parseLocalDateTime, shiftDate } from "./dates";
import type { Entry } from "./entries";

function symptom(id: string, occurredAt: string, pain: "none" | "mild" | "medium" | "severe", nausea: "none" | "mild" = "none"): Entry {
  return { id, kind: "symptom", occurredAt, payload: { pain, nausea, headache: "none", vomited: false, fever: false, note: "" } };
}

describe("journal dates", () => {
  it("formats days in Norwegian", () => {
    expect(formatDay("2026-09-16", { weekday: "long" })).toBe("onsdag");
    expect(formatDay("2026-09-16", { day: "numeric", month: "long", year: "numeric" })).toBe("16. september 2026");
  });
  it("moves across month boundaries by calendar day", () => {
    expect(shiftDate("2026-09-01", -1)).toBe("2026-08-31");
    expect(shiftDate("2024-02-28", 1)).toBe("2024-02-29");
  });

  it("prefills the selected calendar day at the current local time", () => {
    expect(localDateTimeOnDay("2026-09-15", new Date("2026-09-16T08:30:00"))).toBe("2026-09-15T08:30");
  });

  it("uses a fresh default at submission but preserves a manually chosen time", () => {
    const now = new Date("2026-09-16T11:45:00");
    expect(entryTimeForSubmission("2026-09-16T08:30", false, undefined, now)).toBe("2026-09-16T11:45");
    expect(entryTimeForSubmission("2026-09-15T08:30", false, "2026-09-15", now)).toBe("2026-09-15T11:45");
    expect(entryTimeForSubmission("2026-09-14T07:00", true, "2026-09-15", now)).toBe("2026-09-14T07:00");
  });

  it("rejects a local time skipped by the Oslo daylight-saving transition", () => {
    const previousZone = process.env.TZ;
    process.env.TZ = "Europe/Oslo";
    try {
      expect(parseLocalDateTime("2026-03-29T02:30")).toBeUndefined();
      expect(parseLocalDateTime("2026-03-29T03:30")?.toISOString()).toBe("2026-03-29T01:30:00.000Z");
      expect(parseLocalDateTime("2026-02-31T12:00")).toBeUndefined();
    } finally {
      if (previousZone === undefined) delete process.env.TZ;
      else process.env.TZ = previousZone;
    }
  });

  it("counts check-ins and symptoms in the last seven calendar days", () => {
    const entries: Entry[] = [
      symptom("older", "2026-09-09T08:00:00Z", "severe"),
      symptom("none", "2026-09-10T08:00:00Z", "none"),
      symptom("nausea", "2026-09-16T08:00:00Z", "none", "mild"),
      symptom("pain", "2026-09-16T09:00:00Z", "medium"),
      { id: "food", kind: "food", occurredAt: "2026-09-16T10:00:00Z", payload: { categories: ["fruit"], note: "" } },
      { id: "bowel", kind: "bowel", occurredAt: "2026-09-16T11:00:00Z", payload: { bowelType: "normal", note: "" } },
    ];
    const result = getWeekOverview(entries, "2026-09-16");
    expect(result.days.map((day) => day.key)).toEqual([
      "2026-09-10", "2026-09-11", "2026-09-12", "2026-09-13", "2026-09-14", "2026-09-15", "2026-09-16",
    ]);
    expect(result.registrations).toBe(5);
    expect(result.symptomatic).toBe(2);
    expect(result.days[0]).toMatchObject({ registrations: 1, highestPain: 0 });
    expect(result.days[6]).toMatchObject({ registrations: 4, highestPain: 2 });
  });
});
