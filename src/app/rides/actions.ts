"use server";

import { prisma } from "@/lib/db";
import { RideSchema } from "@/lib/validation";
import { parseYMD } from "@/lib/date";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

function toLocalDateTime(dateStr: string, timeStr: string): Date {
  // dateStr: YYYY-MM-DD, timeStr: HH:MM
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  const dt = new Date();
  dt.setFullYear(y, (m ?? 1) - 1, d ?? 1);
  dt.setHours(hh ?? 0, mm ?? 0, 0, 0);
  return dt;
}

export async function createRide(formData: FormData) {
  const user = await requireUser(["ADMIN", "DISPATCHER"]);
  if (!user) redirect("/");

  const raw = Object.fromEntries(formData.entries());
  const parsed = RideSchema.safeParse(raw);
  if (!parsed.success) {
    redirect("/rides/new?err=Invalid%20form");
  }

  const v = parsed.data;
  const date = parseYMD(v.date);
  const pickupTime = toLocalDateTime(v.date, v.pickupTime);

  const assignedDriverId = v.assignedDriverId?.trim() || null;
  const assignedVehicleId = v.assignedVehicleId?.trim() || null;

  await prisma.ride.create({
    data: {
      date,
      pickupTime,
      pickupLocation: v.pickupLocation,
      dropoffLocation: v.dropoffLocation,
      airport: v.airport || null,
      flightNumber: v.flightNumber || null,
      passengerName: v.passengerName,
      passengerPhone: v.passengerPhone || null,
      passengerEmail: v.passengerEmail || null,
      partySize: v.partySize,
      luggageCount: v.luggageCount,
      rideType: v.rideType,
      specialNotes: v.specialNotes || null,
      status: v.status,
      assignedDriverId,
      assignedVehicleId,
    },
  });

  redirect(`/schedule?date=${v.date}`);
}

export async function updateRide(id: string, formData: FormData) {
  const user = await requireUser(["ADMIN", "DISPATCHER"]);
  if (!user) redirect("/");

  const raw = Object.fromEntries(formData.entries());
  const parsed = RideSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/rides/${id}/edit?err=Invalid%20form`);
  }

  const v = parsed.data;
  const date = parseYMD(v.date);
  const pickupTime = toLocalDateTime(v.date, v.pickupTime);

  const assignedDriverId = v.assignedDriverId?.trim() || null;
  const assignedVehicleId = v.assignedVehicleId?.trim() || null;

  await prisma.ride.update({
    where: { id },
    data: {
      date,
      pickupTime,
      pickupLocation: v.pickupLocation,
      dropoffLocation: v.dropoffLocation,
      airport: v.airport || null,
      flightNumber: v.flightNumber || null,
      passengerName: v.passengerName,
      passengerPhone: v.passengerPhone || null,
      passengerEmail: v.passengerEmail || null,
      partySize: v.partySize,
      luggageCount: v.luggageCount,
      rideType: v.rideType,
      specialNotes: v.specialNotes || null,
      status: v.status,
      assignedDriverId,
      assignedVehicleId,
    },
  });

  redirect(`/schedule?date=${v.date}`);
}

export async function deleteRide(id: string, dateStr: string) {
  const user = await requireUser(["ADMIN", "DISPATCHER"]);
  if (!user) redirect("/");

  await prisma.ride.delete({ where: { id } });
  redirect(`/schedule?date=${dateStr}`);
}
