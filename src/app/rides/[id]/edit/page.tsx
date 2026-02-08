import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { RideForm } from "@/components/RideForm";
import { updateRide, deleteRide } from "../../actions";

export default async function EditRidePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { date?: string; err?: string };
}) {
  // Ensure user is logged in (dispatch/admin can edit rides)
  const user = await requireUser(["ADMIN", "DISPATCHER"]);

  const dateStr = searchParams.date ?? undefined;

  const ride = await prisma.ride.findUnique({
    where: { id: params.id },
  });

  if (!ride) {
    redirect(dateStr ? `/schedule?date=${dateStr}` : "/schedule");
  }

  async function action(formData: FormData) {
    "use server";
    await updateRide(params.id, formData);
  }

  async function delAction() {
    "use server";

    // Re-fetch inside the action so TS knows it's non-null here
    const r = await prisma.ride.findUnique({ where: { id: params.id } });
    if (!r) {
      redirect(dateStr ? `/schedule?date=${dateStr}` : "/schedule");
    }

    const d = dateStr ?? new Date(r.date).toISOString().slice(0, 10);
    await deleteRide(params.id, d);
  }

  return (
    <div>
      <Nav user={user} />
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-3">
        {searchParams.err && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {searchParams.err}
          </div>
        )}

        <RideForm mode="edit" ride={ride} action={action} dateStr={dateStr} />

        <form action={delAction} className="no-print">
          <button
            className="rounded-md border border-red-300 bg-white px-3 py-2 text-sm text-red-700 hover:bg-red-50"
            type="submit"
          >
            Delete ride
          </button>
        </form>
      </div>
    </div>
  );
}