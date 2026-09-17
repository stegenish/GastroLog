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

export async function loginIsBlocked() {
  const key = await clientKey();
  if (usesLocalStorage()) return localLimiter.isBlocked(key);
  const rows = await database()`SELECT locked_until > now() AS blocked FROM login_attempts WHERE ip_hash = ${key}`;
  return rows[0]?.blocked === true;
}

export async function recordFailedLogin() {
  const key = await clientKey();
  if (usesLocalStorage()) {
    localLimiter.recordFailure(key);
    return;
  }
  await database()`INSERT INTO login_attempts (ip_hash, failures, updated_at, locked_until)
    VALUES (${key}, 1, now(), NULL)
    ON CONFLICT (ip_hash) DO UPDATE SET
      failures = CASE WHEN login_attempts.updated_at < now() - interval '15 minutes' THEN 1 ELSE login_attempts.failures + 1 END,
      updated_at = now(),
      locked_until = CASE
        WHEN login_attempts.updated_at < now() - interval '15 minutes' THEN NULL
        WHEN login_attempts.failures + 1 >= 5 THEN now() + interval '15 minutes'
        ELSE NULL
      END`;
}

export async function clearFailedLogins() {
  const key = await clientKey();
  if (usesLocalStorage()) {
    localLimiter.clear(key);
    return;
  }
  await database()`DELETE FROM login_attempts WHERE ip_hash = ${key}`;
}
