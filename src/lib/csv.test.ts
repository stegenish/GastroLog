import { describe, expect, it } from "vitest";
import { entriesToCsv } from "./csv";
import type { Entry } from "./entries";

describe("CSV export", () => {
  it("quotes notes and neutralizes spreadsheet formulas", () => {
    const entry: Entry = {
      id: "1",
      kind: "meal",
      occurredAt: "2026-09-16T08:00:00.000Z",
      payload: { mealType: "breakfast", categories: ["grains", "dairy"], note: '=HYPERLINK("https://example.test","click")' },
    };
    const csv = entriesToCsv([entry]);
    expect(csv.startsWith("\uFEFF\"Tidspunkt (UTC)\"")).toBe(true);
    expect(csv).toContain('"Frokost","Kornprodukter; Meieriprodukter"');
    expect(csv).toContain('"\'=HYPERLINK(""https://example.test"",""click"")"');
  });
  it("exports localized codes and yes values", () => {
    const entries: Entry[] = [
      { id: "1", kind: "symptom", occurredAt: "2026-09-16T08:00:00.000Z", payload: { pain: "severe", nausea: "none", headache: "mild", vomited: true, fever: false, note: "" } },
      { id: "2", kind: "bowel", occurredAt: "2026-09-16T09:00:00.000Z", payload: { bowelType: "loose", note: "" } },
    ];
    const csv = entriesToCsv(entries);
    expect(csv).toContain('"Symptomer","Magesmerter · sterk  •  Hodepine · lett  •  Kastet opp","Sterk","Ingen","Lett","Ja"');
    expect(csv).toContain('"Avføring","Avføring · løs"');
    expect(csv).toContain('"Løs"');
  });
});
