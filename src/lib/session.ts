import { createHmac, createHash, randomBytes, timingSafeEqual } from "node:crypto";

const sessionSeconds = 60 * 60 * 24 * 7;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters.");
  return value;
}

export function passwordMatches(candidate: string) {
  const expected = process.env.APP_PASSWORD;
  if (!expected || expected.length < 12) throw new Error("APP_PASSWORD must be at least 12 characters.");
  const left = createHash("sha256").update(candidate).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

export function createSessionToken(now = Date.now()) {
  const payload = `${Math.floor(now / 1000) + sessionSeconds}.${randomBytes(16).toString("hex")}`;
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined, now = Date.now()) {
  if (!token) return false;
  const match = /^(\d{10})\.([0-9a-f]{32})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match || Number(match[1]) <= Math.floor(now / 1000)) return false;
  const payload = `${match[1]}.${match[2]}`;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  return timingSafeEqual(Buffer.from(match[3]), Buffer.from(expected));
}

export { sessionSeconds };
