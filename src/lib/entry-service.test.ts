import { describe, expect, it, vi } from "vitest";
import { saveFormEntry } from "./entry-service";

function symptomForm(occurredAt = "2026-09-16T08:00:00Z") {
  const form = new FormData();
  for (const [key, value] of Object.entries({ kind: "symptom", occurredAt, pain: "none", nausea: "mild", headache: "none" })) {
    form.set(key, value);
  }
  return form;
}

const now = new Date("2026-09-16T12:00:00Z");

describe("saving an entry", () => {
  it("passes a valid entry to persistence", async () => {
    const persist = vi.fn().mockResolvedValue(undefined);
    expect(await saveFormEntry(symptomForm(), persist, now)).toEqual({});
    expect(persist).toHaveBeenCalledOnce();
    expect(persist.mock.calls[0][0]).toMatchObject({ kind: "symptom", occurredAt: "2026-09-16T08:00:00.000Z" });
  });

  it("returns validation feedback without writing", async () => {
    const persist = vi.fn();
    const form = symptomForm();
    form.set("nausea", "invalid");
    expect(await saveFormEntry(form, persist, now)).toEqual({ error: "Velg en gyldig grad for kvalme." });
    expect(persist).not.toHaveBeenCalled();
  });

  it("does not expose persistence error details", async () => {
    const persist = vi.fn().mockRejectedValue(new Error("password authentication failed for neon_user at internal.host"));
    expect(await saveFormEntry(symptomForm(), persist, now)).toEqual({ error: "Kunne ikke lagre registreringen. Prøv igjen." });
  });
});
