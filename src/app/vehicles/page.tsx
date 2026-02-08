import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card, Input, Button } from "@/components/ui";

async function createVehicle(formData: FormData) {
  "use server";
  const label = String(formData.get("label") ?? "").trim();
  const plate = String(formData.get("plate") ?? "").trim();
  const capacity = Number(formData.get("capacity") ?? 6);
  if (!label) return;
  await prisma.vehicle.create({ data: { label, plate: plate || null, capacity: Number.isFinite(capacity) ? capacity : 6 } });
  redirect("/vehicles");
}

export default async function VehiclesPage() {
  const user = await requireUser(["ADMIN", "DISPATCHER"]);
  if (!user) redirect("/");

  const vehicles = await prisma.vehicle.findMany({ orderBy: { label: "asc" } });

  return (
    <div>
      <Nav user={user} />
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
        <div>
          <div className="text-xl font-semibold">Vehicles</div>
          <div className="text-sm text-gray-600">Manage fleet (simple v1)</div>
        </div>

        <Card title="Add vehicle">
          <form action={createVehicle} className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-gray-700">Label</label>
              <Input name="label" required placeholder="Van 3" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Plate</label>
              <Input name="plate" placeholder="ABC-123" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Capacity</label>
              <Input name="capacity" type="number" min={1} max={20} defaultValue={6} />
            </div>
            <div className="md:col-span-4">
              <Button type="submit">Add</Button>
            </div>
          </form>
        </Card>

        <Card title={`Fleet (${vehicles.length})`}>
          <div className="divide-y">
            {vehicles.map(v => (
              <div key={v.id} className="py-2 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{v.label}</div>
                  <div className="text-xs text-gray-600">{v.plate ?? "—"} • cap {v.capacity}</div>
                </div>
                <div className="text-xs text-gray-500">{v.active ? "Active" : "Inactive"}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
