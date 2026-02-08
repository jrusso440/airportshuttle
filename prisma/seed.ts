import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create drivers (fixed IDs to match existing seed logins)
  const [alex, jamie] = await Promise.all([
    prisma.driver.upsert({
      where: { id: "driver_alex" },
      update: {},
      create: { id: "driver_alex", name: "Alex Driver", phone: "555-111-2222" },
    }),
    prisma.driver.upsert({
      where: { id: "driver_jamie" },
      update: {},
      create: { id: "driver_jamie", name: "Jamie Driver", phone: "555-333-4444" },
    }),
  ]);

  // Weekly availability (Mon–Fri 6:00–18:00)
  const weekdayAvail = [
    { dayOfWeek: 1, startMin: 6 * 60, endMin: 18 * 60 },
    { dayOfWeek: 2, startMin: 6 * 60, endMin: 18 * 60 },
    { dayOfWeek: 3, startMin: 6 * 60, endMin: 18 * 60 },
    { dayOfWeek: 4, startMin: 6 * 60, endMin: 18 * 60 },
    { dayOfWeek: 5, startMin: 6 * 60, endMin: 18 * 60 },
  ];

  await prisma.driverAvailability.deleteMany({ where: { driverId: { in: [alex.id, jamie.id] } } });
  await prisma.driverAvailability.createMany({
    data: [
      ...weekdayAvail.map((a) => ({ ...a, driverId: alex.id })),
      ...weekdayAvail.map((a) => ({ ...a, driverId: jamie.id })),
    ],
  });

  // Vehicles
  const [van1, van2] = await Promise.all([
    prisma.vehicle.upsert({
      where: { id: "veh_van1" },
      update: {},
      create: { id: "veh_van1", label: "Van 1", plate: "ABC-123", capacity: 6 },
    }),
    prisma.vehicle.upsert({
      where: { id: "veh_van2" },
      update: {},
      create: { id: "veh_van2", label: "Van 2", plate: "XYZ-789", capacity: 8 },
    }),
  ]);

  // Users (admin + driver logins)
  const adminPass = await bcrypt.hash("admin123", 10);
  const driverPass = await bcrypt.hash("driver123", 10);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin",
      role: "ADMIN",
      passwordHash: adminPass,
    },
  });

  await prisma.user.upsert({
    where: { email: "alex@example.com" },
    update: {},
    create: {
      email: "alex@example.com",
      name: "Alex Driver",
      role: "DRIVER",
      passwordHash: driverPass,
      driverId: alex.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "jamie@example.com" },
    update: {},
    create: {
      email: "jamie@example.com",
      name: "Jamie Driver",
      role: "DRIVER",
      passwordHash: driverPass,
      driverId: jamie.id,
    },
  });

  // Sample rides for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mkPickup = (h: number, m: number) => {
    const d = new Date(today);
    d.setHours(h, m, 0, 0);
    return d;
  };

  await prisma.ride.deleteMany({ where: { date: today } });

  await prisma.ride.createMany({
    data: [
      {
        date: today,
        pickupTime: mkPickup(7, 30),
        pickupLocation: "123 Main St, Springfield",
        dropoffLocation: "BOS Terminal B",
        airport: "BOS",
        flightNumber: "AA120",
        passengerName: "Pat Smith",
        passengerPhone: "555-100-2000",
        partySize: 2,
        luggageCount: 2,
        rideType: "TO_AIRPORT",
        status: "ASSIGNED",
        assignedDriverId: alex.id,
        assignedVehicleId: van1.id,
        specialNotes: "Needs child seat (if available).",
      },
      {
        date: today,
        pickupTime: mkPickup(9, 15),
        pickupLocation: "BOS Terminal C",
        dropoffLocation: "456 Oak Ave, Springfield",
        airport: "BOS",
        flightNumber: "DL455",
        passengerName: "Chris Lee",
        passengerPhone: "555-222-3333",
        partySize: 1,
        luggageCount: 1,
        rideType: "FROM_AIRPORT",
        status: "SCHEDULED",
        assignedDriverId: jamie.id,
        assignedVehicleId: van2.id,
        specialNotes: "Call upon arrival.",
      },
      {
        date: today,
        pickupTime: mkPickup(11, 0),
        pickupLocation: "789 Pine Rd, Springfield",
        dropoffLocation: "BOS Terminal A",
        airport: "BOS",
        passengerName: "Jordan Chen",
        passengerPhone: "555-444-5555",
        partySize: 7,
        luggageCount: 4,
        rideType: "TO_AIRPORT",
        status: "REQUESTED",
      },
    ],
  });

  // Sample recurring ride (Mon/Wed/Fri 06:15)
  const start = new Date(today);
  start.setDate(start.getDate() - 14);
  start.setHours(0, 0, 0, 0);

  await prisma.recurringRide.deleteMany({});

  await prisma.recurringRide.create({
    data: {
      freq: "WEEKLY",
      daysOfWeekCsv: "1,3,5",
      pickupHour: 6,
      pickupMinute: 15,
      pickupLocation: "Hotel Downtown, Springfield",
      dropoffLocation: "BOS Terminal A",
      airport: "BOS",
      passengerName: "Weekly Client",
      passengerPhone: "555-777-8888",
      partySize: 1,
      luggageCount: 1,
      rideType: "TO_AIRPORT",
      startDate: start,
      endDate: null,
      defaultDriverId: alex.id,
      defaultVehicleId: van1.id,
      specialNotes: "Recurring: confirm night before.",
      active: true,
    },
  });

  console.log("Seed complete.");
  console.log("Login:");
  console.log("  Admin: admin@example.com / admin123");
  console.log("  Driver: alex@example.com / driver123");
  console.log("  Driver: jamie@example.com / driver123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
