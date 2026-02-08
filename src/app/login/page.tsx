import { Card } from "@/components/ui";
import { Input } from "@/components/ui";

export default function LoginPage({ searchParams }: { searchParams: { err?: string } }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-16">
        <div className="text-center">
          <div className="text-2xl font-semibold">Airport Shuttle Dispatch</div>
          <div className="text-sm text-gray-600">Sign in to manage schedules and assignments</div>
        </div>

        <Card title="Login">
          <form className="space-y-3" action="/auth/login" method="post">
            <div>
              <label className="text-xs font-medium text-gray-700">Email</label>
              <Input name="email" type="email" required placeholder="admin@example.com" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Password</label>
              <Input name="password" type="password" required placeholder="admin123" />
            </div>
            {searchParams?.err && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {searchParams.err}
              </div>
            )}
            <button className="w-full rounded-md bg-black px-3 py-2 text-sm font-medium text-white hover:opacity-90" type="submit">
              Sign in
            </button>
          </form>
        </Card>

        <div className="text-xs text-gray-600">
          Seeded demo accounts (after running <code className="px-1">npm run seed</code>):<br/>
          Admin: <code className="px-1">admin@example.com</code> / <code className="px-1">admin123</code><br/>
          Driver: <code className="px-1">alex@example.com</code> / <code className="px-1">driver123</code>
        </div>
      </div>
    </div>
  );
}
