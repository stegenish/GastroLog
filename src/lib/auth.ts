import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, passwordMatches, sessionSeconds, verifySessionToken } from "./session";

export { passwordMatches };

const cookieName = "gastrolog_session";

export async function isAuthenticated() {
  const cookie = (await cookies()).get(cookieName)?.value;
  return verifySessionToken(cookie);
}

export async function requireAuth() {
  if (!(await isAuthenticated())) redirect("/login");
}

export async function setSessionCookie() {
  (await cookies()).set(cookieName, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionSeconds,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(cookieName);
}
