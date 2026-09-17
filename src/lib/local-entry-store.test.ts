import { afterEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createLocalEntryStore } from "./local-entry-store";
import type { Entry } from "./entries";

const testPaths: string[] = [];

function temporaryStore() {
  const path = join(tmpdir(), `gastrolog-test-${randomUUID()}.json`);
  testPaths.push(path);
  return { path, store: createLocalEntryStore(path) };
}

function entry(id: string, occurredAt: string): Entry {
  return { id, kind: "symptom", occurredAt, payload: { pain: "none", nausea: "none", headache: "none", vomited: false, fever: false, note: "" } };
}

afterEach(async () => {
  for (const path of testPaths.splice(0)) {
    await unlink(path).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
});

describe("local entry store", () => {
  it("serializes concurrent saves, sorts newest first, and removes by id", async () => {
    const { path, store } = temporaryStore();
    expect(await store.list()).toEqual([]);
    await Promise.all([
      store.save(entry("older", "2026-09-15T08:00:00Z")),
      store.save(entry("newer", "2026-09-16T08:00:00Z")),
    ]);
    expect((await store.list()).map((item) => item.id)).toEqual(["newer", "older"]);
    expect(JSON.parse(await readFile(path, "utf8"))).toHaveLength(2);
    await store.remove("older");
    expect((await store.list()).map((item) => item.id)).toEqual(["newer"]);
  });

  it("does not overwrite a malformed local file", async () => {
    const { path, store } = temporaryStore();
    await writeFile(path, "not-json", "utf8");
    await expect(store.save(entry("one", "2026-09-16T08:00:00Z"))).rejects.toThrow();
    expect(await readFile(path, "utf8")).toBe("not-json");
  });
});
