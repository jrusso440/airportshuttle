export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { RideForm } from "@/components/RideForm";
import { createRide } from "../actions";

export default async function NewRidePage({ searchParams }: { searchParams: { date?: string } }) {
  const user = await requireUser(["ADMIN", "DISPATCHER"]);
  if (!user) redirect("/");

  return (
    <div>
      <Nav user={user} />
      <div className="mx-auto max-w-3xl px-4 py-6">
        <RideForm mode="create" action={createRide} dateStr={searchParams.date} />
      </div>
    </div>
  );
}
