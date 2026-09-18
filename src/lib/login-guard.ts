import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { database } from "./database";
import { usesLocalStorage } from "./storage-mode";
import { createLoginLimiter } from "./login-limiter";

const localLimiter = createLoginLimiter();

async function clientKey() {
  const ip = usesLocalStorage() ? "local-test" : (await headers()).get("x-vercel-forwarded-for") ?? "unknown";
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters.");
  return createHmac("sha256", secret).update(ip).digest("hex");
}

export async function claimLoginAttempt() {
  const key = await clientKey();
  if (usesLocalStorage()) return localLimiter.claim(key);
  const rows = await database()`INSERT INTO login_attempts (ip_hash, attempts, updated_at)
    VALUES (${key}, 1, now())
    ON CONFLICT (ip_hash) DO UPDATE SET
      attempts = CASE
        WHEN login_attempts.updated_at <= now() - interval '15 minutes' THEN 1
        ELSE LEAST(login_attempts.attempts + 1, 6)
      END,
      updated_at = now()
    RETURNING attempts`;
  return rows[0]?.attempts !== undefined && Number(rows[0].attempts) <= 5;
}

export async function clearLoginAttempts() {
  const key = await clientKey();
  if (usesLocalStorage()) {
    localLimiter.clear(key);
    return;
  }
  await database()`DELETE FROM login_attempts WHERE ip_hash = ${key}`;
}
