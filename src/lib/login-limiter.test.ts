import { describe, expect, it } from "vitest";
import { createLoginLimiter } from "./login-limiter";

describe("login limiter", () => {
  it("locks a client after five failures, then allows a new window", () => {
    let time = 1_000_000;
    const limiter = createLoginLimiter(() => time);
    for (let i = 0; i < 4; i++) {
      limiter.recordFailure("one");
      expect(limiter.isBlocked("one")).toBe(false);
    }
    limiter.recordFailure("one");
    expect(limiter.isBlocked("one")).toBe(true);
    expect(limiter.isBlocked("two")).toBe(false);
    time += 15 * 60_000;
    expect(limiter.isBlocked("one")).toBe(false);
    limiter.recordFailure("one");
    expect(limiter.isBlocked("one")).toBe(false);
  });

  it("clears failures after a successful login", () => {
    const limiter = createLoginLimiter(() => 1_000_000);
    for (let i = 0; i < 4; i++) limiter.recordFailure("one");
    limiter.clear("one");
    limiter.recordFailure("one");
    expect(limiter.isBlocked("one")).toBe(false);
  });
});
