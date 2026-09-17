import { describe, expect, it } from "vitest";
import { entryFromRow } from "./entry-row";

describe("Neon row mapping", () => {
  it("normalizes a database timestamp and retains the payload", () => {
    const payload = { bowelType: "hard" as const, note: "" };
    expect(entryFromRow({ id: "abc", kind: "bowel", occurred_at: new Date("2026-09-16T08:00:00Z"), payload })).toEqual({
      id: "abc", kind: "bowel", occurredAt: "2026-09-16T08:00:00.000Z", payload,
    });
  });
});
