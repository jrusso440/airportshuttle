export function estimatePriceCents(input: {
  rideType: "TO_AIRPORT" | "FROM_AIRPORT" | "OTHER";
  partySize: number;
  pickupTimeStr: string; // "HH:MM"
  airport?: string | null;
}) {
  let cents = 3500; // $35 base

  // Airport surcharge
  if (input.airport && input.airport.trim().length > 0) cents += 1000; // +$10

  // Extra passengers after 2
  if (input.partySize > 2) cents += (input.partySize - 2) * 500; // +$5 each

  // Late night fee (10pm–5am)
  const [hh] = input.pickupTimeStr.split(":").map(Number);
  if (hh >= 22 || hh < 5) cents += 1000; // +$10

  return cents;
}

export function formatDollars(cents: number) {
  return (cents / 100).toFixed(2);
}
