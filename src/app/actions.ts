"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSessionCookie, isAuthenticated, passwordMatches, setSessionCookie } from "@/lib/auth";
import { claimLoginAttempt, clearLoginAttempts } from "@/lib/login-guard";
import { saveFormEntry } from "@/lib/entry-service";
import { removeEntry, saveEntry } from "@/lib/store";

export async function loginAction(_previous: { error: string }, formData: FormData) {
  const password = formData.get("password");
  try {
    if (!(await claimLoginAttempt())) return { error: "For mange forsøk. Prøv igjen om 15 minutter." };
    if (typeof password !== "string" || !passwordMatches(password)) {
      return { error: "Feil passord. Prøv igjen." };
    }
    await clearLoginAttempts();
    await setSessionCookie();
  } catch {
    return { error: "Kunne ikke logge inn nå. Prøv igjen senere." };
  }
  redirect("/");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

export async function createEntryAction(formData: FormData): Promise<{ error?: string }> {
  if (!(await isAuthenticated())) return { error: "Økten er utløpt. Logg inn på nytt." };
  const result = await saveFormEntry(formData, saveEntry);
  if (!result.error) revalidatePath("/");
  return result;
}

export async function deleteEntryAction(id: string): Promise<{ error?: string }> {
  if (!(await isAuthenticated())) return { error: "Økten er utløpt. Logg inn på nytt." };
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return { error: "Ugyldig registrering." };
  }
  try {
    await removeEntry(id);
    revalidatePath("/");
    return {};
  } catch {
    return { error: "Kunne ikke slette registreringen. Prøv igjen." };
  }
}
