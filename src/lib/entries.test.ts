import { describe, expect, it } from "vitest";
import { parseEntry, summarizeEntry } from "./entries";

const now = new Date("2026-09-16T12:00:00.000Z");

function form(values: Record<string, string | string[]>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) {
    for (const item of Array.isArray(value) ? value : [value]) data.append(key, item);
  }
  return data;
}

describe("entry validation", () => {
  it("accepts a brief no-symptom check-in", () => {
    const entry = parseEntry(form({ kind: "symptom", occurredAt: "2026-09-16T08:30:00.000Z", pain: "none", nausea: "none", headache: "none" }), now);
    expect(entry.kind).toBe("symptom");
    expect(summarizeEntry(entry)).toBe("Ingen symptomer");
    if (entry.kind === "symptom") expect(entry.payload).toMatchObject({ vomited: false, fever: false, note: "" });
  });

  it("normalizes a time with an offset and trims optional notes", () => {
    const entry = parseEntry(form({ kind: "symptom", occurredAt: "2026-09-16T10:00:00+02:00", pain: "mild", nausea: "medium", headache: "none", note: "  after breakfast  ", vomited: "on" }), now);
    expect(entry.occurredAt).toBe("2026-09-16T08:00:00.000Z");
    if (entry.kind === "symptom") expect(entry.payload).toMatchObject({ nausea: "medium", vomited: true, note: "after breakfast" });
  });

  it("rejects future timestamps and invalid severity", () => {
    expect(() => parseEntry(form({ kind: "symptom", occurredAt: "2026-09-17T12:00:00Z", pain: "none", nausea: "none", headache: "none" }), now)).toThrow("fremtiden");
    expect(() => parseEntry(form({ kind: "symptom", occurredAt: "2026-09-16T08:00:00Z", pain: "extreme", nausea: "none", headache: "none" }), now)).toThrow("gyldig grad for magesmerter");
    expect(() => parseEntry(form({ kind: "symptom", occurredAt: "2026-09-16T08:00:00Z", nausea: "none", headache: "none" }), now)).toThrow("Velg magesmerter.");
  });

  it("rejects normalized calendar dates and timestamps without a timezone", () => {
    const basics = { kind: "symptom", pain: "none", nausea: "none", headache: "none" };
    expect(() => parseEntry(form({ ...basics, occurredAt: "2026-02-31T10:00:00Z" }), now)).toThrow("gyldig dato");
    expect(() => parseEntry(form({ ...basics, occurredAt: "2026-09-16T10:00:00" }), now)).toThrow("tidssone");
    expect(() => parseEntry(form({ ...basics, occurredAt: "2024-02-29T10:00:00Z" }), now)).not.toThrow();
  });

  it("requires a food group from the last day and removes duplicates", () => {
    const basics = { kind: "food", occurredAt: "2026-09-16T08:00:00Z" };
    expect(() => parseEntry(form(basics), now)).toThrow("minst én matvaregruppe");
    expect(() => parseEntry(form({ ...basics, categories: ["invalid"] }), now)).toThrow("minst én matvaregruppe");
    const entry = parseEntry(form({ ...basics, categories: ["grains", "dairy", "grains"] }), now);
    if (entry.kind === "food") expect(entry.payload).toEqual({ categories: ["grains", "dairy"], note: "" });
  });

  it("requires a known bowel type and limits note length", () => {
    const basics = { kind: "bowel", occurredAt: "2026-09-16T08:00:00Z" };
    expect(() => parseEntry(form({ ...basics, bowelType: "unknown" }), now)).toThrow("gyldig type avføring");
    expect(() => parseEntry(form({ ...basics, bowelType: "normal", note: "x".repeat(501) }), now)).toThrow("500");
  });
});

describe("Norwegian summaries", () => {
  it("labels symptoms, food groups, and bowel movements without changing stored codes", () => {
    const symptoms = parseEntry(form({ kind: "symptom", occurredAt: "2026-09-16T08:00:00Z", pain: "mild", nausea: "medium", headache: "none", vomited: "on" }), now);
    const food = parseEntry(form({ kind: "food", occurredAt: "2026-09-16T08:00:00Z", categories: ["grains", "dairy"], note: "  yoghurt  " }), now);
    const bowel = parseEntry(form({ kind: "bowel", occurredAt: "2026-09-16T08:00:00Z", bowelType: "loose" }), now);
    expect(summarizeEntry(symptoms)).toBe("Magesmerter · lett  •  Kvalme · moderat  •  Kastet opp");
    expect(summarizeEntry(food)).toBe("Kornprodukter, Meieriprodukter");
    expect(summarizeEntry(bowel)).toBe("Avføring · løs");
    if (food.kind === "food") expect(food.payload).toEqual({ categories: ["grains", "dairy"], note: "yoghurt" });
  });
});
