import { db } from "@/db";
import { routes, routeStops, vehicles, vehicleStatuses } from "@/db/schema";
import { GET as getRoutes, POST as postRoute } from "@/app/api/transport/routes/route";
import { GET as getRoute, PUT as putRoute, DELETE as deleteRoute } from "@/app/api/transport/routes/[id]/route";
import { POST as postVehicle } from "@/app/api/transport/vehicles/route";
import { GET as getVehicle, PUT as putVehicle, DELETE as deleteVehicle } from "@/app/api/transport/vehicles/[id]/route";
import { PATCH as patchVehicleStatus } from "@/app/api/transport/vehicle/[id]/route";

async function adminFlow() {
  console.log("=== CRUD TEST: Routes ===");
  
  // CREATE Route with stops
  console.log("POST /api/transport/routes");
  const createReq = new Request("http://localhost/api/transport/routes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Town to Campus",
      startPoint: "Town",
      endPoint: "Campus",
      stops: [
        { stopName: "Town Station", sequenceOrder: 1 },
        { stopName: "Main Gate", sequenceOrder: 2 },
      ],
    }),
  });
  const createRes = await postRoute(createReq);
  const { route, stops } = await createRes.json();
  console.log("Created route:", route.id, route.name);

  // READ single route
  console.log("\nGET /api/transport/routes/[id]");
  const getOneRes = await getRoute(new Request("http://localhost"), { params: { id: route.id } });
  const routeData = await getOneRes.json();
  console.log("Fetched route with", routeData.stops.length, "stops");

  // UPDATE route
  console.log("\nPUT /api/transport/routes/[id]");
  const updateReq = new Request("http://localhost", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Updated Route Name",
      startPoint: "Town",
      endPoint: "Campus",
      stops: [
        { stopName: "Town Station", sequenceOrder: 1 },
        { stopName: "Main Gate", sequenceOrder: 2 },
        { stopName: "Campus Center", sequenceOrder: 3 },
      ],
    }),
  });
  const updateRes = await putRoute(updateReq, { params: { id: route.id } });
  const updated = await updateRes.json();
  console.log("Updated route:", updated.route.name, "with", updated.stops.length, "stops");

  console.log("\n=== CRUD TEST: Vehicles ===");
  
  // CREATE Vehicle
  console.log("POST /api/transport/vehicles");
  const createVehicleReq = new Request("http://localhost", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      plateNumber: `KCB-${Math.floor(Math.random()*1000)}`,
      capacity: 33,
      currentRouteId: route.id,
    }),
  });
  const vehicleRes = await postVehicle(createVehicleReq);
  const vehicle = await vehicleRes.json();
  console.log("Created vehicle:", vehicle.plateNumber);

  // READ vehicle with status history
  console.log("\nGET /api/transport/vehicles/[id]");
  const getVehicleRes = await getVehicle(new Request("http://localhost"), { params: { id: vehicle.id } });
  const vehicleData = await getVehicleRes.json();
  console.log("Fetched vehicle with", vehicleData.statuses.length, "status records");

  // UPDATE vehicle
  console.log("\nPUT /api/transport/vehicles/[id]");
  const updateVehicleReq = new Request("http://localhost", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ capacity: 40 }),
  });
  const updatedVehicleRes = await putVehicle(updateVehicleReq, { params: { id: vehicle.id } });
  const updatedVehicle = await updatedVehicleRes.json();
  console.log("Updated vehicle capacity to:", updatedVehicle.capacity);

  console.log("\n=== Status Update Flow ===");

  // PATCH vehicle status to LOADING
  console.log("PATCH vehicle status to LOADING at stop1");
  const patchReq1 = new Request("http://localhost/api/transport/vehicle/" + vehicle.id, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "LOADING", currentStopId: updated.stops[0].id }),
  });
  const patchRes1 = await patchVehicleStatus(patchReq1, { params: { id: vehicle.id } });
  console.log("Status update 1:", patchRes1.status);

  // PATCH vehicle status to DEPARTED
  console.log("\nPATCH vehicle status to DEPARTED at stop2");
  const patchReq2 = new Request("http://localhost/api/transport/vehicle/" + vehicle.id, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "DEPARTED", currentStopId: updated.stops[1].id }),
  });
  const patchRes2 = await patchVehicleStatus(patchReq2, { params: { id: vehicle.id } });
  console.log("Status update 2:", patchRes2.status);

  console.log("\n=== Verify all data via GET /routes ===");
  const res2 = await getRoutes();
  const data2 = await res2.json() as Array<{
    route: { id: string; name: string };
    stops: Array<{ stopName: string }>;
    vehicles: Array<{ vehicle: { id: string; plateNumber: string }; status?: { status: string; currentStopId: string | null } }>;
  }>;
  const routeEntry = data2.find((r) => r.route.id === route.id);
  console.log("Vehicles on route:", routeEntry?.vehicles?.length ?? 0);
  const latest = routeEntry?.vehicles?.find((v) => v.vehicle.id === vehicle.id)?.status;
  console.log("Latest status:", latest?.status, "at stop", latest?.currentStopId);

  console.log("\n=== DELETE operations ===");
  
  // DELETE vehicle
  console.log("DELETE /api/transport/vehicles/[id]");
  const deleteVehicleRes = await deleteVehicle(new Request("http://localhost"), { params: { id: vehicle.id } });
  console.log("Delete vehicle status:", deleteVehicleRes.status);

  // DELETE route
  console.log("\nDELETE /api/transport/routes/[id]");
  const deleteRouteRes = await deleteRoute(new Request("http://localhost"), { params: { id: route.id } });
  console.log("Delete route status:", deleteRouteRes.status);

  console.log("\n✅ Full CRUD test completed!");
}

adminFlow().catch((e) => {
  console.error("Admin transport flow failed:", e);
  process.exit(1);
});
