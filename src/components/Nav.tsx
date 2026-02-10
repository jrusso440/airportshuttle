import Link from "next/link";
import { SessionUser } from "@/lib/session";

export function Nav({ user }: { user: SessionUser }) {
  return (
    <div className="no-print border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-semibold">Airport Shuttle Dispatch</Link>
          {user.role !== "DRIVER" && (
            <>
              <Link href="/schedule" className="text-sm text-gray-700 hover:underline">Schedule</Link>
              <Link href="/rides/new" className="text-sm text-gray-700 hover:underline">New Ride</Link>
              <Link href="/drivers" className="text-sm text-gray-700 hover:underline">Drivers</Link>
              <Link href="/vehicles" className="text-sm text-gray-700 hover:underline">Vehicles</Link>
            </>
          )}
          {user.role === "DRIVER" && (
            <Link href="/driver" className="text-sm text-gray-700 hover:underline">My Rides</Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-600">{user.name} • {user.role}</div>
          <form action="/auth/logout" method="post">
            <button className="text-sm rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50" type="submit">Logout</button>
          </form>
        </div>
      </div>
    </div>
  );
}
