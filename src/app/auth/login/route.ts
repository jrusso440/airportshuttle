import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";


function normalizeRole(role: string): "ADMIN" | "DISPATCHER" | "DRIVER" {
  if (role === "ADMIN" || role === "DISPATCHER" || role === "DRIVER") return role;
  return "DISPATCHER"; // safe default
}
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

function normalizeRole(role: string): "ADMIN" | "DISPATCHER" | "DRIVER" {
  if (role === "ADMIN" || role === "DISPATCHER" || role === "DRIVER") return role;
  return "DISPATCHER";
}

export async function POST(req: Request) {
  const { getUserByEmail, setSession } = await import("@/lib/auth"); // <-- key change

  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  if (!email || !password) {
    return NextResponse.redirect(new URL("/login?err=Missing%20credentials", req.url));
  }

  const user = await getUserByEmail(email);
  if (!user || !user.active) {
    return NextResponse.redirect(new URL("/login?err=Invalid%20login", req.url));
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.redirect(new URL("/login?err=Invalid%20login", req.url));
  }

  await setSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: normalizeRole(user.role),
    driverId: user.driverId,
  });

  return NextResponse.redirect(new URL("/", req.url));
}
export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  if (!email || !password) {
    return NextResponse.redirect(new URL("/login?err=Missing%20credentials", req.url));
  }

  const user = await getUserByEmail(email);
  if (!user || !user.active) {
    return NextResponse.redirect(new URL("/login?err=Invalid%20login", req.url));
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.redirect(new URL("/login?err=Invalid%20login", req.url));
  }

setSession({
  id: user.id,
  email: user.email,
  name: user.name,
  role: normalizeRole(user.role),
  driverId: user.driverId,
});
  return NextResponse.redirect(new URL("/", req.url));
}
