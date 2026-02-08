import { prisma } from "@/lib/db";

export function minutesFromDate(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function weekday(d: Date): number {
  // 0=Sun..6=Sat
  return d.getDay();
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export async function driverIsAvailable(driverId: string, date: Date, pickupTime: Date): Promise<boolean> {
  const dow = weekday(date);
  const mins = minutesFromDate(pickupTime);
  const windows = await prisma.driverAvailability.findMany({ where: { driverId, dayOfWeek: dow } });
  if (windows.length === 0) return true; // if no windows set, don't block
  return windows.some(w => mins >= w.startMin && mins <= w.endMin);
}

export async function driverConflicts(driverId: string, date: Date, pickupTime: Date, bufferMin = 30, excludeRideId?: string) {
  const start = new Date(pickupTime);
  start.setMinutes(start.getMinutes() - bufferMin);
  const end = new Date(pickupTime);
  end.setMinutes(end.getMinutes() + bufferMin);

  const rides = await prisma.ride.findMany({
    where: {
      date,
      assignedDriverId: driverId,
      ...(excludeRideId ? { NOT: { id: excludeRideId } } : {}),
    },
    orderBy: { pickupTime: "asc" },
  });

  const hits = rides.filter(r => overlaps(start, end, r.pickupTime, r.pickupTime));
  return hits;
}

export async function generateOccurrencesForDate(date: Date) {
  // Ensure all recurring rides for this date have an occurrence (idempotent by unique key we simulate)
  const recurs = await prisma.recurringRide.findMany({ where: { active: true } });
  const dow = weekday(date);

  for (const rr of recurs) {
    const days = rr.daysOfWeekCsv.split(",").map(s => Number(s.trim())).filter(n => Number.isFinite(n));
    if (!days.includes(dow)) continue;

    // date range check
    if (date < rr.startDate) continue;
    if (rr.endDate && date > rr.endDate) continue;

    // Build pickup datetime
    const pickup = new Date(date);
    pickup.setHours(rr.pickupHour, rr.pickupMinute, 0, 0);

    // Check if an occurrence already exists (same recurringRideId + pickupTime)
    const existing = await prisma.ride.findFirst({
      where: { recurringRideId: rr.id, pickupTime: pickup },
      select: { id: true },
    });
    if (existing) continue;

    await prisma.ride.create({
      data: {
        date,
        pickupTime: pickup,
        pickupLocation: rr.pickupLocation,
        dropoffLocation: rr.dropoffLocation,
        airport: rr.airport,
        flightNumber: rr.flightNumber,
        passengerName: rr.passengerName,
        passengerPhone: rr.passengerPhone,
        passengerEmail: rr.passengerEmail,
        partySize: rr.partySize,
        luggageCount: rr.luggageCount,
        rideType: rr.rideType,
        specialNotes: rr.specialNotes,
        status: "SCHEDULED",
        assignedDriverId: rr.defaultDriverId,
        assignedVehicleId: rr.defaultVehicleId,
        recurringRideId: rr.id,
      },
    });
  }
}
