import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isAuthenticated: vi.fn(),
  saveEntry: vi.fn(),
  removeEntry: vi.fn(),
  revalidatePath: vi.fn(),
  passwordMatches: vi.fn(),
  setSessionCookie: vi.fn(),
  loginIsBlocked: vi.fn(),
  recordFailedLogin: vi.fn(),
  clearFailedLogins: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  isAuthenticated: mocks.isAuthenticated,
  clearSessionCookie: vi.fn(),
  setSessionCookie: mocks.setSessionCookie,
  passwordMatches: mocks.passwordMatches,
}));
vi.mock("@/lib/login-guard", () => ({
  loginIsBlocked: mocks.loginIsBlocked,
  recordFailedLogin: mocks.recordFailedLogin,
  clearFailedLogins: mocks.clearFailedLogins,
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
  mocks.loginIsBlocked.mockResolvedValue(false);
  mocks.recordFailedLogin.mockResolvedValue(undefined);
  mocks.clearFailedLogins.mockResolvedValue(undefined);
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
    mocks.loginIsBlocked.mockResolvedValue(true);
    expect(await loginAction({ error: "" }, loginForm())).toEqual({ error: "For mange forsøk. Prøv igjen om 15 minutter." });
    expect(mocks.passwordMatches).not.toHaveBeenCalled();
  });

  it("records a failed passphrase and clears failures on success", async () => {
    expect(await loginAction({ error: "" }, loginForm())).toEqual({ error: "Feil passord. Prøv igjen." });
    expect(mocks.recordFailedLogin).toHaveBeenCalledOnce();
    mocks.passwordMatches.mockReturnValue(true);
    await loginAction({ error: "" }, loginForm());
    expect(mocks.clearFailedLogins).toHaveBeenCalledOnce();
    expect(mocks.setSessionCookie).toHaveBeenCalledOnce();
    expect(mocks.redirect).toHaveBeenCalledWith("/");
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
