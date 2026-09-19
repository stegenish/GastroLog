// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./login-form";
import { loadRememberedPassword, saveRememberedPassword } from "@/lib/remembered-password";

vi.mock("@/app/actions", () => ({
  loginAction: vi.fn(async () => ({ error: "" })),
}));

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("login form password memory", () => {
  it("prefills a remembered password and lets the user remove it", async () => {
    saveRememberedPassword("family-password");
    render(<LoginForm />);

    const password = screen.getByLabelText("Passord") as HTMLInputElement;
    await waitFor(() => expect(password.value).toBe("family-password"));

    const remember = screen.getByRole("checkbox", { name: "Husk passordet på denne enheten" });
    expect((remember as HTMLInputElement).checked).toBe(true);
    fireEvent.click(remember);
    expect(loadRememberedPassword()).toBe("");
  });
});
