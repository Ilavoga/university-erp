import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <p className="text-muted-foreground">Welcome back, {session.user.name}!</p>
      <div className="grid gap-4 mt-6">
        <div className="p-4 border rounded-lg shadow-sm">
          <h3 className="font-semibold">Quick Stats</h3>
          <p className="text-sm text-muted-foreground">Overview of your university life.</p>
        </div>
      </div>
    </div>
  );
}
