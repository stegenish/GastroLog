import type { Entry } from "./entries";

type EntryRow = {
  id: string;
  kind: Entry["kind"];
  occurred_at: string | Date;
  payload: Entry["payload"];
};

export function entryFromRow(row: EntryRow): Entry {
  return {
    id: row.id,
    kind: row.kind,
    occurredAt: new Date(row.occurred_at).toISOString(),
    payload: row.payload,
  } as Entry;
}
