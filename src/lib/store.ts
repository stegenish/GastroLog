import "server-only";
import { join } from "node:path";
import { usesLocalStorage } from "./storage-mode";
import { createLocalEntryStore } from "./local-entry-store";
import { listNeonEntries, removeNeonEntry, saveNeonEntry } from "./neon-entry-store";
import type { Entry } from "./entries";

const local = createLocalEntryStore(join(process.cwd(), "data", "local-entries.json"));

export function listEntries(): Promise<Entry[]> {
  return usesLocalStorage() ? local.list() : listNeonEntries();
}

export function saveEntry(entry: Entry): Promise<void> {
  return usesLocalStorage() ? local.save(entry) : saveNeonEntry(entry);
}

export function removeEntry(id: string): Promise<void> {
  return usesLocalStorage() ? local.remove(id) : removeNeonEntry(id);
}
