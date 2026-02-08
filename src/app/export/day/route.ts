import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parseYMD, ymd } from "@/lib/date";

function csvEscape(v: any): string {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  const user = await requireUser(["ADMIN", "DISPATCHER"]);
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const url = new URL(req.url);
  const dateStr = url.searchParams.get("date") ?? ymd(new Date());
  const date = parseYMD(dateStr);

  const rides = await prisma.ride.findMany({
    where: { date },
    include: { assignedDriver: true, assignedVehicle: true },
    orderBy: { pickupTime: "asc" },
  });

  const headers = [
    "pickup_time",
    "passenger",
    "phone",
    "pickup",
    "dropoff",
    "airport",
    "flight",
    "party",
    "luggage",
    "status",
    "driver",
    "vehicle",
    "notes",
  ];

  const rows = rides.map((r) => [
    new Date(r.pickupTime).toISOString(),
    r.passengerName,
    r.passengerPhone ?? "",
    r.pickupLocation,
    r.dropoffLocation,
    r.airport ?? "",
    r.flightNumber ?? "",
    r.partySize,
    r.luggageCount,
    r.status,
    r.assignedDriver?.name ?? "",
    r.assignedVehicle?.label ?? "",
    r.specialNotes ?? "",
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="rides_${dateStr}.csv"`,
    },
  });
}
