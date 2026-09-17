import { requireAuth } from "@/lib/auth";
import { listEntries } from "@/lib/store";
import { Dashboard } from "@/components/dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  await requireAuth();
  const entries = await listEntries();
  return <Dashboard entries={entries} />;
}
