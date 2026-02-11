export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui";
import { formatDollars } from "@/lib/pricing";
import Link from "next/link";
export const dynamic = "force-dynamic";
export default async function ThanksPage({ params }: { params: { rideId: string } }) {
  const ride = await prisma.ride.findUnique({ where: { id: params.rideId } });

  if (!ride) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-10">
          <Card title="Request not found">
            <div className="text-sm text-gray-700">
              We couldn’t find that request. If you believe this is an error, please contact dispatch.
            </div>
            <div className="mt-3">
              <Link className="underline text-sm" href="/book">Back to booking</Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const pickupLocal = new Date(ride.pickupTime);
  const dateStr = pickupLocal.toISOString().slice(0, 10);
  const timeStr = pickupLocal.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-10 space-y-4">
        <div>
          <div className="text-2xl font-semibold">Thanks — we got your request</div>
          <div className="text-sm text-gray-600">A dispatcher will confirm your ride shortly.</div>
        </div>

        <Card title="Request details">
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-600">Reference:</span> <span className="font-mono">{ride.id}</span></div>
            <div><span className="text-gray-600">Status:</span> <span className="font-medium">{ride.status}</span></div>
            <div><span className="text-gray-600">Date:</span> {dateStr}</div>
            <div><span className="text-gray-600">Pickup:</span> {timeStr} — {ride.pickupLocation}</div>
            <div><span className="text-gray-600">Dropoff:</span> {ride.dropoffLocation}</div>
            {ride.airport ? <div><span className="text-gray-600">Airport:</span> {ride.airport}</div> : null}
            {ride.flightNumber ? <div><span className="text-gray-600">Flight:</span> {ride.flightNumber}</div> : null}
            <div><span className="text-gray-600">Party size:</span> {ride.partySize}</div>
            <div><span className="text-gray-600">Estimated price:</span> <span className="font-semibold">${formatDollars(ride.estimatedPriceCents ?? 0)}</span></div>
            {ride.specialNotes ? <div><span className="text-gray-600">Notes:</span> {ride.specialNotes}</div> : null}
          </div>
          <div className="mt-4 text-xs text-gray-600">
            This is an estimate. Final price may vary if details change or additional stops are added.
          </div>
        </Card>

        <div className="text-sm">
          <Link className="underline" href="/book">Book another ride</Link>
          <span className="text-gray-400"> • </span>
          <Link className="underline" href="/login">Dispatcher login</Link>
        </div>
      </div>
    </div>
  );
}
