export const dynamic = "force-dynamic";
import { requireDriverUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/Nav";
import { Card, Button } from "@/components/ui";
import { ymd, parseYMD, formatTime } from "@/lib/date";

async function setStatus(rideId: string, status: string) {
  "use server";
  const sess = await requireDriverUser();
  if (!sess) redirect("/login");
  await prisma.ride.update({ where: { id: rideId }, data: { status: status as any } });
  redirect("/driver");
}

export default async function DriverPage({ searchParams }: { searchParams: { date?: string } }) {
	
  const user = await requireDriverUser();

  if (!user) redirect("/");

  const dateStr = searchParams.date ?? ymd(new Date());
  const date = parseYMD(dateStr);

  const rides = await prisma.ride.findMany({
    where: { date, assignedDriverId: user.driverId ?? undefined },
    orderBy: [{ pickupTime: "asc" }],
  });

  return (
    <div>
      <Nav user={user} />
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
        <div className="no-print flex items-end justify-between gap-3">
          <div>
            <div className="text-xl font-semibold">My Rides</div>
            <div className="text-sm text-gray-600">Today • Update statuses</div>
          </div>
          <form action="/driver" method="get" className="flex items-end gap-2">
            <div>
              <label className="text-xs font-medium text-gray-700">Date</label>
              <input className="w-40 rounded-md border border-gray-300 px-3 py-2 text-sm" type="date" name="date" defaultValue={dateStr} />
            </div>
            <button className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white hover:opacity-90" type="submit">Go</button>
          </form>
        </div>

        <Card title={`Assigned rides (${rides.length})`} right={<a className="no-print text-sm underline" href={`/print/driver/${user.driverId}?date=${dateStr}`}>Print my manifest</a>}>
          <div className="space-y-2">
            {rides.length === 0 && <div className="text-sm text-gray-600">No rides assigned.</div>}
            {rides.map(r => (
              <div key={r.id} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{formatTime(r.pickupTime)} • {r.passengerName}</div>
                  <div className="text-xs rounded-full border px-2 py-0.5">{r.status}</div>
                </div>
                <div className="text-xs text-gray-600 mt-1">{r.pickupLocation} → {r.dropoffLocation}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {r.passengerPhone ? <>Phone: <a className="underline" href={`tel:${r.passengerPhone}`}>{r.passengerPhone}</a></> : "No phone on file"}
                  {" • "}Party: {r.partySize} • Bags: {r.luggageCount}
                </div>
                {r.specialNotes && <div className="text-xs text-gray-700 mt-1">Notes: {r.specialNotes}</div>}
                <div className="no-print mt-2 flex flex-wrap gap-2">
                  <form action={setStatus.bind(null, r.id, "ASSIGNED")}><Button type="submit" variant="ghost">Assigned</Button></form>
                  <form action={setStatus.bind(null, r.id, "COMPLETED")}><Button type="submit">Completed</Button></form>
                  <form action={setStatus.bind(null, r.id, "NOSHOW")}><Button type="submit" variant="ghost">No-show</Button></form>
                  <form action={setStatus.bind(null, r.id, "CANCELED")}><Button type="submit" variant="ghost">Canceled</Button></form>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
