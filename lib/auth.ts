import crypto from "node:crypto";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";

const COOKIE = "descarte_certo_session";
const maxAge = 60 * 60 * 24 * 7;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET não configurado");
  return value;
}

function sign(value: string) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createSessionToken(user: { id: string; email: string; role: string }) {
  const payload = Buffer.from(JSON.stringify({ ...user, exp: Date.now() + maxAge * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(value?: string) {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const actual = Buffer.from(signature);
  const expected = Buffer.from(sign(payload));
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString());
    return parsed.exp > Date.now() ? parsed as { id: string; email: string; role: "user" | "admin"; exp: number } : null;
  } catch { return null; }
}

export async function currentUser() {
  const token = verifySessionToken((await cookies()).get(COOKIE)?.value);
  if (!token) return null;
  const result = await pool.query("SELECT id, name, email, role FROM users WHERE id = $1", [token.id]);
  return result.rows[0] ?? null;
}

export async function setSession(user: { id: string; email: string; role: string }) {
  (await cookies()).set(COOKIE, createSessionToken(user), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge, path: "/" });
}

export async function clearSession() {
  (await cookies()).set(COOKIE, "", { httpOnly: true, expires: new Date(0), path: "/" });
}
