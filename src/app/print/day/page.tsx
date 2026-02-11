export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { parseYMD, ymd, formatTime } from "@/lib/date";
import { redirect } from "next/navigation";

export default async function PrintDay({ searchParams }: { searchParams: { date?: string } }) {
  const user = await requireUser(["ADMIN", "DISPATCHER"]);
  if (!user) redirect("/");

  const dateStr = searchParams.date ?? ymd(new Date());
  const date = parseYMD(dateStr);

  const rides = await prisma.ride.findMany({
    where: { date },
    include: { assignedDriver: true, assignedVehicle: true },
    orderBy: [{ pickupTime: "asc" }],
  });

  const generated = new Date().toLocaleString();

  return (
    <div className="bg-white text-black">
      <div className="no-print p-4 border-b flex items-center justify-between">
        <div className="font-semibold">Print: Day Schedule ({dateStr})</div>
        <button className="rounded-md border px-3 py-2 text-sm" onClick={() => window.print()}>Print</button>
      </div>

      <div className="p-6 space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-2xl font-semibold">Daily Schedule</div>
            <div className="text-sm text-gray-600">{dateStr}</div>
          </div>
          <div className="text-xs text-gray-500">Generated: {generated}</div>
        </div>

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Time</th>
              <th className="text-left py-2">Passenger</th>
              <th className="text-left py-2">Phone</th>
              <th className="text-left py-2">Pickup</th>
              <th className="text-left py-2">Dropoff</th>
              <th className="text-left py-2">Flight</th>
              <th className="text-left py-2">Party</th>
              <th className="text-left py-2">Driver</th>
              <th className="text-left py-2">Vehicle</th>
              <th className="text-left py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rides.map(r => (
              <tr key={r.id} className="border-b align-top">
                <td className="py-2 whitespace-nowrap">{formatTime(r.pickupTime)}</td>
                <td className="py-2">{r.passengerName}</td>
                <td className="py-2 whitespace-nowrap">{r.passengerPhone ?? "—"}</td>
                <td className="py-2">{r.pickupLocation}</td>
                <td className="py-2">{r.dropoffLocation}</td>
                <td className="py-2 whitespace-nowrap">{r.flightNumber ?? "—"}</td>
                <td className="py-2 whitespace-nowrap">{r.partySize}</td>
                <td className="py-2 whitespace-nowrap">{r.assignedDriver?.name ?? "Unassigned"}</td>
                <td className="py-2 whitespace-nowrap">{r.assignedVehicle?.label ?? "—"}</td>
                <td className="py-2">{r.specialNotes ?? ""}</td>
              </tr>
            ))}
            {rides.length === 0 && (
              <tr>
                <td className="py-4 text-gray-600" colSpan={10}>No rides scheduled.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
