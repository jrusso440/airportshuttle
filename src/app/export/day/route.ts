import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // Avoid build-time Prisma evaluation
  const { prisma } = await import("@/lib/db");
  const { requireUser } = await import("@/lib/session");

  const user = await requireUser(["ADMIN", "DISPATCHER"]); // protect export

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");

  if (!dateStr) {
    return new NextResponse("Missing date", { status: 400 });
  }

  // You might store date as a Date (00:00) — adjust if your schema differs
  const date = new Date(dateStr + "T00:00:00.000Z");

  const rides = await prisma.ride.findMany({
    where: { date },
    orderBy: [{ pickupTime: "asc" }],
    include: { driver: true },
  });

  // Simple CSV export (works for printing/opening in Excel)
  const header = [
    "id",
    "date",
    "pickupTime",
    "pickupLocation",
    "dropoffLocation",
    "passengerName",
    "passengerPhone",
    "passengerEmail",
    "partySize",
    "status",
    "driver",
  ];

  const rows = rides.map((r) => [
    r.id,
    dateStr,
    new Date(r.pickupTime).toISOString(),
    (r.pickupLocation ?? "").replaceAll('"', '""'),
    (r.dropoffLocation ?? "").replaceAll('"', '""'),
    (r.passengerName ?? "").replaceAll('"', '""'),
    (r.passengerPhone ?? "").replaceAll('"', '""'),
    (r.passengerEmail ?? "").replaceAll('"', '""'),
    String(r.partySize ?? ""),
    String(r.status ?? ""),
    (r.driver?.name ?? "").replaceAll('"', '""'),
  ]);

  const csv = [header.join(","), ...rows.map((row) => row.map((v) => `"${v}"`).join(","))].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="schedule-${dateStr}.csv"`,
    },
  });
}