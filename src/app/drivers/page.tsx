export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card, Input, Button } from "@/components/ui";

async function createDriver(formData: FormData) {
  "use server";
  const user = await requireUser(["ADMIN", "DISPATCHER"]);
  if (!user) redirect("/");

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!name) return;

  await prisma.driver.create({ data: { name, phone: phone || null } });
  redirect("/drivers");
}

export default async function DriversPage() {
  const user = await requireUser(["ADMIN", "DISPATCHER"]);
  if (!user) redirect("/");

  const drivers = await prisma.driver.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <Nav user={user} />
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
        <div>
          <div className="text-xl font-semibold">Drivers</div>
          <div className="text-sm text-gray-600">Manage driver roster (simple v1)</div>
        </div>

        <Card title="Add driver">
          <form action={createDriver} className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-gray-700">Name</label>
              <Input name="name" required />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Phone</label>
              <Input name="phone" placeholder="555-123-4567" />
            </div>
            <div className="md:col-span-3">
              <Button type="submit">Add</Button>
            </div>
          </form>
        </Card>

        <Card title={`Roster (${drivers.length})`}>
          <div className="divide-y">
            {drivers.map(d => (
              <div key={d.id} className="py-2 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{d.name}</div>
                  <div className="text-xs text-gray-600">{d.phone ?? "—"}</div>
                </div>
                <div className="text-xs text-gray-500">{d.active ? "Active" : "Inactive"}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
