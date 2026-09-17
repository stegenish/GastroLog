import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createSessionToken, passwordMatches, verifySessionToken } from "./session";

const now = new Date("2026-09-16T12:00:00.000Z").getTime();
const oldPassword = process.env.APP_PASSWORD;
const oldSecret = process.env.SESSION_SECRET;

beforeEach(() => {
  process.env.APP_PASSWORD = "a-private-test-passphrase";
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
});

afterEach(() => {
  if (oldPassword === undefined) delete process.env.APP_PASSWORD;
  else process.env.APP_PASSWORD = oldPassword;
  if (oldSecret === undefined) delete process.env.SESSION_SECRET;
  else process.env.SESSION_SECRET = oldSecret;
});

describe("family access", () => {
  it("compares a passphrase exactly", () => {
    expect(passwordMatches("a-private-test-passphrase")).toBe(true);
    expect(passwordMatches("A-private-test-passphrase")).toBe(false);
  });

  it("accepts a signed session and rejects tampering and expiry", () => {
    const token = createSessionToken(now);
    expect(verifySessionToken(token, now + 1_000)).toBe(true);
    expect(verifySessionToken(`${token.slice(0, -1)}x`, now)).toBe(false);
    expect(verifySessionToken(token, now + 8 * 24 * 60 * 60_000)).toBe(false);
  });

  it("fails closed when secrets are not configured strongly enough", () => {
    process.env.SESSION_SECRET = "short";
    expect(() => createSessionToken(now)).toThrow("32 characters");
    process.env.APP_PASSWORD = "short";
    expect(() => passwordMatches("short")).toThrow("12 characters");
  });
});
