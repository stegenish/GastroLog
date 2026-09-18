import { describe, expect, it } from "vitest";
import { createLoginLimiter } from "./login-limiter";

describe("login limiter", () => {
  it("reserves at most five password checks per client in a window", async () => {
    let time = 1_000_000;
    const limiter = createLoginLimiter(() => time);
    const claims = await Promise.all(Array.from({ length: 20 }, async () => limiter.claim("one")));
    expect(claims.filter(Boolean)).toHaveLength(5);
    expect(limiter.claim("two")).toBe(true);
    time += 15 * 60_000;
    expect(limiter.claim("one")).toBe(true);
  });

  it("clears reservations after a successful login", () => {
    const limiter = createLoginLimiter(() => 1_000_000);
    for (let i = 0; i < 5; i++) expect(limiter.claim("one")).toBe(true);
    limiter.clear("one");
    expect(limiter.claim("one")).toBe(true);
  });
});
