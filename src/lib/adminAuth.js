import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || "dev-admin-session-secret";
}

function sign(value) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createAdminSessionCookieValue(username, ttlSeconds = 60 * 60 * 12) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${username}.${exp}`;
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function isValidAdminSessionCookieValue(cookieValue) {
  try {
    if (!cookieValue) return false;
    const parts = String(cookieValue).split(".");
    if (parts.length !== 3) return false;
    const [username, expStr, sig] = parts;
    const exp = Number(expStr);
    if (!username || !Number.isFinite(exp)) return false;
    if (exp < Math.floor(Date.now() / 1000)) return false;
    const payload = `${username}.${exp}`;
    const expectedSig = sign(payload);
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig));
  } catch (e) {
    return false;
  }
}

export function isAdminRequestAuthenticated(request) {
  // In route handlers, always use request.cookies (synchronous)
  const c = request?.cookies?.get?.(COOKIE_NAME)?.value;
  return isValidAdminSessionCookieValue(c);
}

export function setAdminSessionCookie(response, username) {
  const value = createAdminSessionCookieValue(username);
  response.cookies.set({
    name: COOKIE_NAME,
    value,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export function clearAdminSessionCookie(response) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
