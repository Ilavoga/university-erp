import { GET as getRoutes } from "@/app/api/transport/routes/route";

async function studentFlow() {
  console.log("Student: GET /api/transport/routes");
  const res = await getRoutes();
  if (res.status !== 200) {
    const err = await res.json();
    throw new Error("Failed to fetch routes: " + JSON.stringify(err));
  }
  const data = await res.json();
  console.log("Available routes:", data.map((r: any) => r.route.name));

  for (const r of data) {
    console.log(`Route: ${r.route.name}`);
    console.log("Stops:", r.stops.map((s: any) => `${s.sequenceOrder}-${s.stopName}`).join(", "));
    console.log("Vehicles:", r.vehicles.map((v: any) => `${v.vehicle.plateNumber} (${v.status?.status ?? 'UNKNOWN'})`).join(", "));
  }
}

studentFlow().catch((e) => {
  console.error("Student transport flow failed:", e);
  process.exit(1);
});
