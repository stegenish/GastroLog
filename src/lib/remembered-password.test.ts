// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { clearRememberedPassword, loadRememberedPassword, saveRememberedPassword } from "./remembered-password";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("remembered password", () => {
  it("saves, loads, and clears the password on this device", () => {
    saveRememberedPassword("family-password");
    expect(loadRememberedPassword()).toBe("family-password");

    clearRememberedPassword();
    expect(loadRememberedPassword()).toBe("");
  });

  it("does not prevent login when browser storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => { throw new Error("blocked"); });

    expect(() => saveRememberedPassword("family-password")).not.toThrow();
    expect(loadRememberedPassword()).toBe("");
    expect(() => clearRememberedPassword()).not.toThrow();
  });
});
