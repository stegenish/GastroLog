import { EntryValidationError, parseEntry, type Entry } from "./entries";

export type SaveResult = { error?: string };

export async function saveFormEntry(
  formData: FormData,
  persist: (entry: Entry) => Promise<void>,
  now = new Date(),
): Promise<SaveResult> {
  let entry: Entry;
  try {
    entry = parseEntry(formData, now);
  } catch (error) {
    return { error: error instanceof EntryValidationError ? error.message : "Kunne ikke lese registreringen." };
  }

  try {
    await persist(entry);
    return {};
  } catch {
    return { error: "Kunne ikke lagre registreringen. Prøv igjen." };
  }
}
