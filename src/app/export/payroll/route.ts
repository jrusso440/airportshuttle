import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // Dynamic imports prevent build-time crashes
  const { prisma } = await import("@/lib/db");
  const { requireUser } = await import("@/lib/session");

  await requireUser(["ADMIN", "DISPATCHER"]);

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start"); // YYYY-MM-DD
  const end = searchParams.get("end");     // YYYY-MM-DD

  if (!start || !end) {
    return new NextResponse("Missing start or end (YYYY-MM-DD)", { status: 400 });
  }

  // Use UTC midnight bounds
  const startDate = new Date(start + "T00:00:00.000Z");
  const endDateExclusive = new Date(end + "T00:00:00.000Z");
  endDateExclusive.setUTCDate(endDateExclusive.getUTCDate() + 1);

  const rides = await prisma.ride.findMany({
    where: {
      pickupTime: { gte: startDate, lt: endDateExclusive },
      // If you track completion, you can uncomment:
      // status: "COMPLETED",
    },
    orderBy: [{ pickupTime: "asc" }],
    select: {
      id: true,
      pickupTime: true,
      passengerName: true,
      pickupLocation: true,
      dropoffLocation: true,
      // safest: driverId exists even if there's no relation field
      driverId: true,
      // if you have payout fields:
      // estimatedPriceCents: true,
    },
  });

  // Payroll summary by driverId (fallback)
  const byDriver = new Map<string, { rides: number }>();

  for (const r of rides) {
    const key = r.driverId ?? "UNASSIGNED";
    const cur = byDriver.get(key) ?? { rides: 0 };
    cur.rides += 1;
    byDriver.set(key, cur);
  }

  const header = ["driverId", "rides", "periodStart", "periodEnd"];
  const rows = Array.from(byDriver.entries()).map(([driverId, v]) => [
    driverId,
    String(v.rides),
    start,
    end,
  ]);

  const csv =
    [header.join(","), ...rows.map((row) => row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="payroll-${start}-to-${end}.csv"`,
    },
  });
}