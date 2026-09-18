import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLoginLimiter } from "@/lib/login-limiter";

const mocks = vi.hoisted(() => ({
  isAuthenticated: vi.fn(),
  saveEntry: vi.fn(),
  removeEntry: vi.fn(),
  revalidatePath: vi.fn(),
  passwordMatches: vi.fn(),
  setSessionCookie: vi.fn(),
  claimLoginAttempt: vi.fn(),
  clearLoginAttempts: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  isAuthenticated: mocks.isAuthenticated,
  clearSessionCookie: vi.fn(),
  setSessionCookie: mocks.setSessionCookie,
  passwordMatches: mocks.passwordMatches,
}));
vi.mock("@/lib/login-guard", () => ({
  claimLoginAttempt: mocks.claimLoginAttempt,
  clearLoginAttempts: mocks.clearLoginAttempts,
}));
vi.mock("@/lib/store", () => ({ saveEntry: mocks.saveEntry, removeEntry: mocks.removeEntry }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { createEntryAction, deleteEntryAction, loginAction } from "./actions";

function symptomForm() {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    kind: "symptom",
    occurredAt: new Date(Date.now() - 60_000).toISOString(),
    pain: "mild",
    nausea: "none",
    headache: "none",
  })) form.set(key, value);
  return form;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isAuthenticated.mockResolvedValue(false);
  mocks.saveEntry.mockResolvedValue(undefined);
  mocks.removeEntry.mockResolvedValue(undefined);
  mocks.claimLoginAttempt.mockResolvedValue(true);
  mocks.clearLoginAttempts.mockResolvedValue(undefined);
  mocks.setSessionCookie.mockResolvedValue(undefined);
  mocks.passwordMatches.mockReturnValue(false);
});

describe("sign-in action", () => {
  function loginForm() {
    const form = new FormData();
    form.set("password", "example-passphrase");
    return form;
  }

  it("does not compare credentials while a client is blocked", async () => {
    mocks.claimLoginAttempt.mockResolvedValue(false);
    expect(await loginAction({ error: "" }, loginForm())).toEqual({ error: "For mange forsøk. Prøv igjen om 15 minutter." });
    expect(mocks.passwordMatches).not.toHaveBeenCalled();
  });

  it("reserves a check and clears reservations on success", async () => {
    expect(await loginAction({ error: "" }, loginForm())).toEqual({ error: "Feil passord. Prøv igjen." });
    expect(mocks.claimLoginAttempt).toHaveBeenCalledOnce();
    mocks.passwordMatches.mockReturnValue(true);
    await loginAction({ error: "" }, loginForm());
    expect(mocks.clearLoginAttempts).toHaveBeenCalledOnce();
    expect(mocks.setSessionCookie).toHaveBeenCalledOnce();
    expect(mocks.redirect).toHaveBeenCalledWith("/");
  });

  it("does not check more than five concurrent passwords from one client", async () => {
    const limiter = createLoginLimiter(() => 1_000_000);
    mocks.claimLoginAttempt.mockImplementation(async () => limiter.claim("one"));
    const results = await Promise.all(Array.from({ length: 20 }, () => loginAction({ error: "" }, loginForm())));
    expect(mocks.passwordMatches).toHaveBeenCalledTimes(5);
    expect(results.filter((result) => result.error?.includes("For mange"))).toHaveLength(15);
  });
});

describe("entry actions", () => {
  it("rejects an unsigned write before touching storage", async () => {
    expect(await createEntryAction(symptomForm())).toEqual({ error: "Økten er utløpt. Logg inn på nytt." });
    expect(mocks.saveEntry).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("saves and refreshes the journal for an authenticated request", async () => {
    mocks.isAuthenticated.mockResolvedValue(true);
    expect(await createEntryAction(symptomForm())).toEqual({});
    expect(mocks.saveEntry).toHaveBeenCalledOnce();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/");
  });

  it("does not expose storage errors or revalidate after failure", async () => {
    mocks.isAuthenticated.mockResolvedValue(true);
    mocks.saveEntry.mockRejectedValue(new Error("database private.internal.example password failed"));
    expect(await createEntryAction(symptomForm())).toEqual({ error: "Kunne ikke lagre registreringen. Prøv igjen." });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects unsigned and malformed delete requests", async () => {
    const id = "b3c114e3-f569-48e4-b43a-c73fce31c513";
    expect(await deleteEntryAction(id)).toEqual({ error: "Økten er utløpt. Logg inn på nytt." });
    mocks.isAuthenticated.mockResolvedValue(true);
    expect(await deleteEntryAction("not-a-uuid")).toEqual({ error: "Ugyldig registrering." });
    expect(mocks.removeEntry).not.toHaveBeenCalled();
  });
});
