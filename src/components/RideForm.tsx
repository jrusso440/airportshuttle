import { prisma } from "@/lib/db";
import { Ride } from "@prisma/client";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";
import { ymd } from "@/lib/date";
import { driverConflicts, driverIsAvailable } from "@/lib/scheduling";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export async function RideForm({
  mode,
  ride,
  action,
  dateStr,
}: {
  mode: "create" | "edit";
  ride?: Ride | null;
  action: (formData: FormData) => Promise<void>;
  dateStr?: string;
}) {
  const drivers = await prisma.driver.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  const vehicles = await prisma.vehicle.findMany({
    where: { active: true },
    orderBy: { label: "asc" },
  });

  const defaultDate = dateStr ?? (ride ? ymd(new Date(ride.date)) : ymd(new Date()));
  const defaultPickup = ride ? new Date(ride.pickupTime) : new Date();

  const defaultPickupTime = ride
    ? `${pad2(defaultPickup.getHours())}:${pad2(defaultPickup.getMinutes())}`
    : "09:00";

  // Precompute warnings for the selected ride time (for edit mode)
  const warnForDrivers = new Map<string, string[]>();
  const warnForVehicles = new Map<string, string[]>();

  if (ride) {
    const date = new Date(ride.date);
    const pickupTime = new Date(ride.pickupTime);

    for (const d of drivers) {
      const msgs: string[] = [];
      const avail = await driverIsAvailable(d.id, date, pickupTime);
      if (!avail) msgs.push("Outside availability");

      const conflicts = await driverConflicts(d.id, date, pickupTime, 30, ride.id);
      if (conflicts.length > 0) msgs.push(`Conflict ±30m (${conflicts.length})`);

      if (msgs.length) warnForDrivers.set(d.id, msgs);
    }

    for (const v of vehicles) {
      const msgs: string[] = [];
      if ((ride.partySize ?? 1) > v.capacity) msgs.push(`Capacity ${v.capacity} < party ${ride.partySize}`);
      if (msgs.length) warnForVehicles.set(v.id, msgs);
    }
  }

  return (
    <Card
      title={mode === "create" ? "New Ride" : "Edit Ride"}
      right={
        <div className="text-xs text-gray-500">
          {ride?.recurringRideId ? "Recurring occurrence" : ""}
        </div>
      }
    >
      {ride && (warnForDrivers.get(ride.assignedDriverId ?? "")?.length || warnForVehicles.get(ride.assignedVehicleId ?? "")?.length) ? (
        <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <div className="font-medium">Warnings</div>
          <ul className="list-disc pl-5 text-xs mt-1">
            {(warnForDrivers.get(ride.assignedDriverId ?? "") ?? []).map((m, i) => <li key={"d"+i}>Driver: {m}</li>)}
            {(warnForVehicles.get(ride.assignedVehicleId ?? "") ?? []).map((m, i) => <li key={"v"+i}>Vehicle: {m}</li>)}
          </ul>
        </div>
      ) : null}

      <form action={action} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-gray-700">Date</label>
            <Input type="date" name="date" defaultValue={defaultDate} required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Pickup time</label>
            <Input type="time" name="pickupTime" defaultValue={defaultPickupTime} required />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-medium text-gray-700">Pickup location</label>
            <Input name="pickupLocation" defaultValue={ride?.pickupLocation ?? ""} required />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-gray-700">Dropoff location</label>
            <Input name="dropoffLocation" defaultValue={ride?.dropoffLocation ?? ""} required />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Airport (optional)</label>
            <Input name="airport" defaultValue={ride?.airport ?? ""} placeholder="BOS" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Flight # (optional)</label>
            <Input name="flightNumber" defaultValue={ride?.flightNumber ?? ""} placeholder="AA120" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Passenger name</label>
            <Input name="passengerName" defaultValue={ride?.passengerName ?? ""} required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Passenger phone</label>
            <Input name="passengerPhone" defaultValue={ride?.passengerPhone ?? ""} placeholder="555-123-4567" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Passenger email</label>
            <Input name="passengerEmail" defaultValue={ride?.passengerEmail ?? ""} placeholder="name@example.com" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Party size</label>
            <Input name="partySize" type="number" min={1} max={20} defaultValue={ride?.partySize ?? 1} required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Luggage count</label>
            <Input name="luggageCount" type="number" min={0} max={30} defaultValue={ride?.luggageCount ?? 0} required />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Ride type</label>
            <Select name="rideType" defaultValue={(ride?.rideType ?? "OTHER") as any}>
              <option value="TO_AIRPORT">To airport</option>
              <option value="FROM_AIRPORT">From airport</option>
              <option value="OTHER">Other</option>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Status</label>
            <Select name="status" defaultValue={(ride?.status ?? "REQUESTED") as any}>
              <option value="REQUESTED">Requested</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELED">Canceled</option>
              <option value="NOSHOW">No-show</option>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Assigned driver</label>
            <Select name="assignedDriverId" defaultValue={ride?.assignedDriverId ?? ""}>
              <option value="">Unassigned</option>
              {drivers.map((d) => {
                const warns = warnForDrivers.get(d.id);
                return (
                  <option key={d.id} value={d.id}>
                    {d.name}{warns?.length ? ` ⚠ ${warns.join("; ")}` : ""}
                  </option>
                );
              })}
            </Select>
            <div className="mt-1 text-[11px] text-gray-500">
              Warnings are advisory (availability + overlap buffer).
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Assigned vehicle</label>
            <Select name="assignedVehicleId" defaultValue={ride?.assignedVehicleId ?? ""}>
              <option value="">—</option>
              {vehicles.map((v) => {
                const warns = warnForVehicles.get(v.id);
                return (
                  <option key={v.id} value={v.id}>
                    {v.label} (cap {v.capacity}){warns?.length ? ` ⚠ ${warns.join("; ")}` : ""}
                  </option>
                );
              })}
            </Select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-medium text-gray-700">Special notes</label>
            <Textarea
              name="specialNotes"
              rows={3}
              defaultValue={ride?.specialNotes ?? ""}
              placeholder="Gate code, child seat, call on arrival..."
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit">{mode === "create" ? "Create ride" : "Save changes"}</Button>
          <a
            className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
            href={`/schedule?date=${defaultDate}`}
          >
            Cancel
          </a>
        </div>
      </form>
    </Card>
  );
}
