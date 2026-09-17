import { isAuthenticated } from "@/lib/auth";
import { listEntries } from "@/lib/store";
import { entriesToCsv } from "@/lib/csv";

export async function GET() {
  if (!(await isAuthenticated())) return new Response("Ingen tilgang", { status: 401 });
  const entries = await listEntries();
  return new Response(entriesToCsv(entries), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="magelogg-registreringer.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
