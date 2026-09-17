import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import type { Entry } from "./entries";

export function createLocalEntryStore(filePath: string) {
  let queue: Promise<void> = Promise.resolve();

  async function read(): Promise<Entry[]> {
    try {
      const parsed: unknown = JSON.parse(await readFile(filePath, "utf8"));
      if (!Array.isArray(parsed)) throw new Error("Local entry file is invalid.");
      return parsed as Entry[];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }

  async function update(change: (entries: Entry[]) => Entry[]) {
    const operation = queue.then(async () => {
      const entries = change(await read());
      await mkdir(dirname(filePath), { recursive: true });
      const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
      try {
        await writeFile(temporaryPath, JSON.stringify(entries, null, 2), "utf8");
        await rename(temporaryPath, filePath);
      } finally {
        await unlink(temporaryPath).catch((error: NodeJS.ErrnoException) => {
          if (error.code !== "ENOENT") throw error;
        });
      }
    });
    queue = operation.catch(() => undefined);
    await operation;
  }

  return {
    async list() {
      await queue;
      return (await read()).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    },
    save(entry: Entry) {
      return update((entries) => [...entries, entry]);
    },
    remove(id: string) {
      return update((entries) => entries.filter((entry) => entry.id !== id));
    },
  };
}
