import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

function csvEscape(v: any): string {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  const user = await requireUser(["ADMIN", "DISPATCHER"]);
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!from || !to) {
    return new NextResponse("Missing from/to (YYYY-MM-DD)", { status: 400 });
  }

  const fromD = new Date(from + "T00:00:00");
  const toD = new Date(to + "T00:00:00");

  const rides = await prisma.ride.findMany({
    where: {
      pickupTime: { gte: fromD, lt: new Date(toD.getTime() + 24 * 60 * 60 * 1000) },
      assignedDriverId: { not: null },
      status: { notIn: ["CANCELED"] },
    },
    include: { assignedDriver: true },
    orderBy: { pickupTime: "asc" },
  });

  const byDriver = new Map<string, { driver: string; count: number }>();
  for (const r of rides) {
    const name = r.assignedDriver?.name ?? "Unknown";
    const key = r.assignedDriverId ?? "unknown";
    const cur = byDriver.get(key) ?? { driver: name, count: 0 };
    cur.count += 1;
    byDriver.set(key, cur);
  }

  const headers = ["driver", "ride_count", "range_from", "range_to"];
  const rows = Array.from(byDriver.values()).map((v) => [v.driver, v.count, from, to]);

  const csv = [headers.join(","), ...rows.map((row) => row.map(csvEscape).join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="payroll_${from}_to_${to}.csv"`,
    },
  });
}
