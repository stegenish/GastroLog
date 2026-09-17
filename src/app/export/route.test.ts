import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ isAuthenticated: vi.fn(), listEntries: vi.fn() }));
vi.mock("@/lib/auth", () => ({ isAuthenticated: mocks.isAuthenticated }));
vi.mock("@/lib/store", () => ({ listEntries: mocks.listEntries }));

import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isAuthenticated.mockResolvedValue(false);
  mocks.listEntries.mockResolvedValue([]);
});

describe("CSV export route", () => {
  it("does not read entries for an unsigned request", async () => {
    const response = await GET();
    expect(response.status).toBe(401);
    expect(await response.text()).toBe("Ingen tilgang");
    expect(mocks.listEntries).not.toHaveBeenCalled();
  });

  it("returns a private CSV for an authenticated request", async () => {
    mocks.isAuthenticated.mockResolvedValue(true);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("Content-Disposition")).toContain("magelogg-registreringer.csv");
    expect(await response.text()).toContain("Magesmerter");
  });
});
