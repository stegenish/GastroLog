import "server-only";
import { database } from "./database";
import { entryFromRow } from "./entry-row";
import type { Entry } from "./entries";

export async function listNeonEntries(): Promise<Entry[]> {
  const rows = await database()`SELECT id, kind, occurred_at, payload FROM entries ORDER BY occurred_at DESC`;
  return rows.map((row) => entryFromRow({
    id: String(row.id),
    kind: row.kind,
    occurred_at: row.occurred_at,
    payload: row.payload,
  }));
}

export async function saveNeonEntry(entry: Entry) {
  await database()`INSERT INTO entries (id, kind, occurred_at, payload)
    VALUES (${entry.id}, ${entry.kind}, ${entry.occurredAt}, ${JSON.stringify(entry.payload)}::jsonb)`;
}

export async function removeNeonEntry(id: string) {
  await database()`DELETE FROM entries WHERE id = ${id}`;
}
