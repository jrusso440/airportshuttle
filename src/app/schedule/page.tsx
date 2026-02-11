export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { Nav } from "@/components/Nav";
import { Card, LinkButton, Select, Button } from "@/components/ui";
import { parseYMD, ymd, formatTime } from "@/lib/date";
import { redirect } from "next/navigation";
import { generateOccurrencesForDate } from "@/lib/scheduling";

async function generate(formData: FormData) {
  "use server";
  const dateStr = String(formData.get("date") ?? "");
  if (!dateStr) return;
  const date = parseYMD(dateStr);
  await generateOccurrencesForDate(date);
  redirect(`/schedule?date=${dateStr}`);
}

export default async function SchedulePage({ searchParams }: { searchParams: { date?: string; driver?: string } }) {
  const user = await requireUser(["ADMIN", "DISPATCHER"]);
  if (!user) redirect("/");

  const dateStr = searchParams.date ?? ymd(new Date());
  const date = parseYMD(dateStr);

  // Auto-generate recurring occurrences for the day (idempotent)
  await generateOccurrencesForDate(date);

  const drivers = await prisma.driver.findMany({ where: { active: true }, orderBy: { name: "asc" } });

  const rides = await prisma.ride.findMany({
    where: {
      date,
      ...(searchParams.driver ? { assignedDriverId: searchParams.driver } : {}),
    },
    include: { assignedDriver: true, assignedVehicle: true, recurringRide: true },
    orderBy: [{ pickupTime: "asc" }],
  });

  const unassigned = rides.filter((r) => !r.assignedDriverId);
  const assigned = rides.filter((r) => !!r.assignedDriverId);

  return (
    <div>
      <Nav user={user} />
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3 no-print">
          <div>
            <div className="text-xl font-semibold">Schedule</div>
            <div className="text-sm text-gray-600">Day view • Assign drivers • Print manifests</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <LinkButton href={`/print/day?date=${dateStr}`}>Print Day</LinkButton>
            <LinkButton href={`/export/day?date=${dateStr}`}>Export CSV</LinkButton>
            <LinkButton href="/rides/new">New Ride</LinkButton>
          </div>
        </div>

        <Card
          title="Filters"
          right={<div className="text-xs text-gray-500">{dateStr}</div>}
        >
          <form className="grid grid-cols-1 gap-3 md:grid-cols-3" action="/schedule" method="get">
            <div>
              <label className="text-xs font-medium text-gray-700">Date</label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                type="date"
                name="date"
                defaultValue={dateStr}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Driver</label>
              <Select name="driver" defaultValue={searchParams.driver ?? ""}>
                <option value="">All drivers</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" className="w-full md:w-auto">
                Apply
              </Button>
              <LinkButton href={`/schedule?date=${dateStr}`}>Reset</LinkButton>
            </div>
          </form>

          <div className="mt-3 no-print">
            <form action={generate} className="flex items-center gap-2">
              <input type="hidden" name="date" value={dateStr} />
              <Button type="submit" variant="ghost">Generate recurring rides</Button>
              <div className="text-xs text-gray-500">Creates occurrences for any active recurring patterns (safe to click multiple times).</div>
            </form>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card
            title={`Unassigned (${unassigned.length})`}
            right={<div className="text-xs text-gray-500">Needs a driver</div>}
          >
            <div className="space-y-2">
              {unassigned.length === 0 && (
                <div className="text-sm text-gray-600">No unassigned rides.</div>
              )}
              {unassigned.map((r) => (
                <div key={r.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">
                      {formatTime(r.pickupTime)} • {r.passengerName}
                      {r.recurringRideId ? <span className="ml-2 text-[11px] rounded-full border px-2 py-0.5">Recurring</span> : null}
                    </div>
                    <div className="text-xs rounded-full border px-2 py-0.5">
                      {r.status}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {r.pickupLocation} → {r.dropoffLocation}
                  </div>
                  <div className="mt-2 flex gap-2 no-print">
                    <LinkButton href={`/rides/${r.id}/edit?date=${dateStr}`}>
                      Edit / Assign
                    </LinkButton>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card
            title={`Assigned (${assigned.length})`}
            right={<div className="text-xs text-gray-500">Driver + vehicle</div>}
          >
            <div className="space-y-2">
              {assigned.length === 0 && (
                <div className="text-sm text-gray-600">No assigned rides.</div>
              )}
              {assigned.map((r) => (
                <div key={r.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">
                      {formatTime(r.pickupTime)} • {r.passengerName}
                      {r.recurringRideId ? <span className="ml-2 text-[11px] rounded-full border px-2 py-0.5">Recurring</span> : null}
                    </div>
                    <div className="text-xs rounded-full border px-2 py-0.5">
                      {r.status}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {r.pickupLocation} → {r.dropoffLocation}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Driver:{" "}
                    <span className="font-medium">
                      {r.assignedDriver?.name ?? "—"}
                    </span>
                    {r.assignedVehicle?.label ? (
                      <>
                        {" "}
                        • Vehicle:{" "}
                        <span className="font-medium">
                          {r.assignedVehicle.label}
                        </span>
                      </>
                    ) : null}
                  </div>
                  <div className="mt-2 flex gap-2 no-print">
                    <LinkButton href={`/rides/${r.id}/edit?date=${dateStr}`}>
                      Edit
                    </LinkButton>
                    {r.assignedDriverId && (
                      <LinkButton
                        href={`/print/driver/${r.assignedDriverId}?date=${dateStr}`}
                      >
                        Print Driver
                      </LinkButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card title="Payroll export (CSV)" right={<div className="text-xs text-gray-500">Counts by driver</div>}>
          <form className="grid grid-cols-1 md:grid-cols-4 gap-3 no-print" action="/export/payroll" method="get">
            <div>
              <label className="text-xs font-medium text-gray-700">From</label>
              <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" type="date" name="from" defaultValue={dateStr} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">To</label>
              <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" type="date" name="to" defaultValue={dateStr} />
            </div>
            <div className="md:col-span-2 flex items-end">
              <Button type="submit">Download payroll CSV</Button>
            </div>
          </form>
          <div className="text-xs text-gray-600 mt-2">
            Export includes assigned rides excluding CANCELED.
          </div>
        </Card>
      </div>
    </div>
  );
}
