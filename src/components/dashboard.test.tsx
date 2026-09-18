// @vitest-environment jsdom

import { useState } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dateKey, shiftDate } from "@/lib/dates";
import type { Entry } from "@/lib/entries";
import { Dashboard } from "./dashboard";
import { EntryForm } from "./entry-form";

const mocks = vi.hoisted(() => ({
  createEntryAction: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/app/actions", () => ({
  createEntryAction: mocks.createEntryAction,
  deleteEntryAction: vi.fn(),
  logoutAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createEntryAction.mockResolvedValue({});
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 0));
  vi.stubGlobal("cancelAnimationFrame", (id: number) => window.clearTimeout(id));
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("entry form navigation", () => {
  it("counts a food-only day as a registration", async () => {
    const entries: Entry[] = [{
      id: "food",
      kind: "food",
      occurredAt: new Date().toISOString(),
      payload: { categories: ["fruit"], note: "" },
    }];
    render(<Dashboard entries={entries} />);
    await waitFor(() => expect(screen.getByRole("region", { name: "De siste sju dagene" }).textContent).toMatch(/1\s+registreringer/));
    expect(screen.getByText("Registrert")).toBeTruthy();
  });

  it("uses today after leaving a past-day shortcut", async () => {
    render(<Dashboard entries={[]} />);
    const today = dateKey(new Date());
    const previousDay = shiftDate(today, -1);
    const dateInput = () => screen.getByLabelText("Når?") as HTMLInputElement;
    await waitFor(() => expect(dateInput().value.slice(0, 10)).toBe(today));

    fireEvent.click(screen.getByRole("button", { name: "Forrige dag" }));
    fireEvent.click(screen.getByRole("button", { name: /Registrer symptomer/ }));
    await waitFor(() => expect(dateInput().value.slice(0, 10)).toBe(previousDay));

    fireEvent.click(screen.getByRole("button", { name: "Neste dag" }));
    fireEvent.click(screen.getByRole("tab", { name: "Mat siste døgn" }));
    await waitFor(() => expect(dateInput().value.slice(0, 10)).toBe(today));
  });

  it("keeps the form locked until an in-flight save completes", async () => {
    let finishSave: (value: { error?: string }) => void = () => undefined;
    mocks.createEntryAction.mockImplementation(() => new Promise((resolve) => { finishSave = resolve; }));
    function Harness() {
      const [tab, setTab] = useState<Entry["kind"]>("symptom");
      return <EntryForm tab={tab} onTabChange={setTab} onSaved={vi.fn()} />;
    }
    render(<Harness />);
    await waitFor(() => expect((screen.getByLabelText("Når?") as HTMLInputElement).value).not.toBe(""));
    fireEvent.click(screen.getByRole("button", { name: "Lagre symptomer" }));
    await waitFor(() => expect(mocks.createEntryAction).toHaveBeenCalledOnce());

    const foodTab = screen.getByRole("tab", { name: "Mat siste døgn" }) as HTMLButtonElement;
    expect(foodTab.disabled).toBe(true);
    expect((screen.getByLabelText("Når?") as HTMLInputElement).closest("fieldset")?.disabled).toBe(true);
    fireEvent.click(foodTab);
    expect(screen.getByRole("tab", { name: "Symptomer" }).getAttribute("aria-selected")).toBe("true");

    await act(async () => finishSave({}));
    expect(foodTab.disabled).toBe(false);
    fireEvent.click(foodTab);
    expect(screen.getByRole("group", { name: "Matvaregrupper" })).toBeTruthy();
  });
});
