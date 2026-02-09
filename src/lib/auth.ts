import type { User } from "@prisma/client";

export async function getUserByEmail(email: string): Promise<User | null> {
  const { prisma } = await import("./db"); // dynamic import avoids build-time crash
  return prisma.user.findUnique({ where: { email } });
}