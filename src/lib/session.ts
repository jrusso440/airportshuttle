import { cookies } from "next/headers";
import crypto from "crypto";
import { redirect } from "next/navigation";

const COOKIE_NAME = "as_session";

function secret(): string {
  const s = process.env.APP_SECRET;
  if (!s) {
    if (process.env.VERCEL === "1" || process.env.NEXT_PHASE) {
      return "BUILD_PLACEHOLDER_SECRET_SET_APP_SECRET";
    }
    throw new Error("APP_SECRET is not set");
  }
  return s;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "DISPATCHER" | "DRIVER";
  driverId?: string | null;
};

export async function setSession(u: SessionUser) {
  const payload = JSON.stringify({ ...u, iat: Date.now() });
  const sig = sign(payload);
  const value = Buffer.from(payload).toString("base64url") + "." + sig;

  cookies().set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export function clearSession() {
  cookies().set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

export function getSession(): SessionUser | null {
  const v = cookies().get(COOKIE_NAME)?.value;
  if (!v) return null;

  const [b64, sig] = v.split(".");
  if (!b64 || !sig) return null;

  const payload = Buffer.from(b64, "base64url").toString("utf8");
  if (sign(payload) !== sig) return null;

  try {
    const obj = JSON.parse(payload) as any;
    return {
      id: obj.id,
      email: obj.email,
      name: obj.name,
      role: obj.role,
      driverId: obj.driverId ?? null,
    };
  } catch {
    return null;
  }
}

export async function requireUser(roles?: Array<"ADMIN" | "DISPATCHER" | "DRIVER">) {
  const sess = getSession();
  if (!sess) redirect("/login");
  if (roles && !roles.includes(sess.role)) redirect("/login");
  return sess;
}

export async function requireDriverUser() {
  const sess = getSession();
  if (!sess) redirect("/login");
  if (sess.role !== "DRIVER") redirect("/login");
  return sess;
}