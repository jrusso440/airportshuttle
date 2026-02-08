import { z } from "zod";

export const RideSchema = z.object({
  date: z.string().min(1),
  pickupTime: z.string().min(1),
  pickupLocation: z.string().min(3),
  dropoffLocation: z.string().min(3),
  airport: z.string().optional(),
  flightNumber: z.string().optional(),
  passengerName: z.string().min(2),
  passengerPhone: z.string().optional(),
  passengerEmail: z.string().email().optional().or(z.literal("")),
  partySize: z.coerce.number().int().min(1).max(20),
  luggageCount: z.coerce.number().int().min(0).max(30),
  rideType: z.enum(["TO_AIRPORT", "FROM_AIRPORT", "OTHER"]),
  specialNotes: z.string().optional(),
  status: z.enum(["REQUESTED", "SCHEDULED", "ASSIGNED", "COMPLETED", "CANCELED", "NOSHOW"]),
  assignedDriverId: z.string().optional().or(z.literal("")),
  assignedVehicleId: z.string().optional().or(z.literal("")),
});
