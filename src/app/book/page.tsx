import { Card, Input, Select, Textarea, Button } from "@/components/ui";

export default function BookPage({ searchParams }: { searchParams: { err?: string } }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-10 space-y-4">
        <div>
          <div className="text-2xl font-semibold">Book an Airport Shuttle</div>
          <div className="text-sm text-gray-600">This creates a ride request for dispatch to confirm.</div>
        </div>

        {searchParams.err && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            Please fill out all required fields.
          </div>
        )}

        <Card title="Ride request">
          <form action="/book/submit" method="post" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700">Date</label>
                <Input type="date" name="date" required />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Pickup time</label>
                <Input type="time" name="pickupTime" required />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-medium text-gray-700">Pickup location</label>
                <Input name="pickupLocation" required />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-gray-700">Dropoff location</label>
                <Input name="dropoffLocation" required />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700">Ride type</label>
                <Select name="rideType" defaultValue="TO_AIRPORT">
                  <option value="TO_AIRPORT">To airport</option>
                  <option value="FROM_AIRPORT">From airport</option>
                  <option value="OTHER">Other</option>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Airport (optional)</label>
                <Input name="airport" placeholder="BOS" />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700">Flight # (optional)</label>
                <Input name="flightNumber" placeholder="AA120" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Party size</label>
                <Input name="partySize" type="number" min={1} max={20} defaultValue={1} />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700">Passenger name</label>
                <Input name="passengerName" required />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Phone</label>
                <Input name="passengerPhone" />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-medium text-gray-700">Email (for confirmation)</label>
                <Input name="passengerEmail" type="email" />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-medium text-gray-700">Notes</label>
                <Textarea name="specialNotes" rows={3} placeholder="Any special instructions…" />
              </div>
            </div>

            <Button type="submit">Submit request</Button>
          </form>
        </Card>

        <div className="text-xs text-gray-600">
          Dispatcher login is at <a className="underline" href="/login">/login</a>.
        </div>
      </div>
    </div>
  );
}
