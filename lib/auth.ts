import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getEnv } from "./env";

const COOKIE = "admin_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7; // 7 days

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
}

/** Constant-time string comparison (compares fixed-length digests, so length never leaks). */
async function safeEqual(a: string, b: string): Promise<boolean> {
  const [da, db] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const x = new Uint8Array(da);
  const y = new Uint8Array(db);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

function adminPassword(): string | null {
  const pw = getEnv().ADMIN_PASSWORD;
  return typeof pw === "string" && pw.length >= 8 ? pw : null;
}

export function adminConfigured(): boolean {
  return adminPassword() !== null;
}

/** The admin user name, if one is set (the login then asks for it). Case and extra spaces do not matter. */
function adminUsername(): string | null {
  const u = getEnv().ADMIN_USERNAME;
  const clean = typeof u === "string" ? u.trim().replace(/\s+/g, " ").toLowerCase() : "";
  return clean || null;
}

export function usernameRequired(): boolean {
  return adminUsername() !== null;
}

/** Check the user name (when one is set) and the password. Both are always compared, so timing reveals nothing. */
export async function checkLogin(username: string, candidate: string): Promise<boolean> {
  const pw = adminPassword();
  if (!pw) return false;
  const expected = adminUsername();
  const passOk = await safeEqual(candidate, pw);
  const userOk = expected === null ? true : await safeEqual(username.trim().replace(/\s+/g, " ").toLowerCase(), expected);
  return passOk && userOk;
}

export async function startSession(): Promise<void> {
  const pw = adminPassword();
  if (!pw) return;
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const token = `${expires}.${await hmac(pw + (adminUsername() ?? ""), `session:${expires}`)}`;
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function isAdmin(): Promise<boolean> {
  const pw = adminPassword();
  if (!pw) return false;
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return false;
  const [expiresRaw, sig] = token.split(".");
  const expires = Number(expiresRaw);
  if (!sig || !Number.isFinite(expires) || expires < Date.now() / 1000) return false;
  return safeEqual(sig, await hmac(pw + (adminUsername() ?? ""), `session:${expires}`));
}

/** Call at the top of every admin page and every admin server action. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}
