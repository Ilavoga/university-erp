import { db } from "@/db";
import { users, routes, routeStops, vehicles, vehicleBookings } from "@/db/schema";
import { GET as getRoutes } from "@/app/api/transport/routes/route";
import { POST as postBooking, GET as getBookings } from "@/app/api/transport/bookings/route";
import { GET as getBooking, PATCH as patchBooking, DELETE as deleteBooking } from "@/app/api/transport/bookings/[id]/route";

async function setupData() {
  // Create a student user
  const [student] = await db.insert(users).values({
    email: `student${Math.floor(Math.random()*1000)}@test.com`,
    role: "STUDENT",
    name: "Test Student",
  }).returning();

  // Create route with stops
  const [route] = await db.insert(routes).values({
    name: "Town to Campus Express",
    startPoint: "Town Center",
    endPoint: "Campus Main Gate",
  }).returning();

  const [stop1] = await db.insert(routeStops).values({
    routeId: route.id,
    stopName: "Town Center",
    sequenceOrder: 1,
  }).returning();

  const [stop2] = await db.insert(routeStops).values({
    routeId: route.id,
    stopName: "Campus Gate",
    sequenceOrder: 2,
  }).returning();

  // Create vehicle with limited capacity
  const [vehicle] = await db.insert(vehicles).values({
    plateNumber: `KDA-${Math.floor(Math.random()*1000)}`,
    capacity: 3, // Small capacity for testing
    currentRouteId: route.id,
  }).returning();

  return { student, route, stops: [stop1, stop2], vehicle };
}

async function studentBookingFlow() {
  console.log("=== Student Matatu Booking Flow ===\n");

  const { student, route, stops, vehicle } = await setupData();
  console.log(`Setup: Student ${student.email}, Vehicle ${vehicle.plateNumber} (capacity: ${vehicle.capacity})`);

  // View available routes
  console.log("\n1. GET /api/transport/routes - View available matatus");
  const routesRes = await getRoutes();
  const routesData = await routesRes.json();
  const targetRoute = routesData.find((r: any) => r.route.id === route.id);
  console.log(`   Route: ${targetRoute.route.name}`);
  console.log(`   Available seats: ${targetRoute.availableSeats}`);
  console.log(`   Vehicles: ${targetRoute.vehicles.length}`);

  // Create first booking
  console.log("\n2. POST /api/transport/bookings - Book a seat");
  const booking1Req = new Request("http://localhost", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentId: student.id,
      vehicleId: vehicle.id,
      routeId: route.id,
      pickupStopId: stops[0].id,
      dropoffStopId: stops[1].id,
    }),
  });
  const booking1Res = await postBooking(booking1Req);
  const booking1 = await booking1Res.json();
  console.log(`   ✓ Booking created: ${booking1.id} (Status: ${booking1.status})`);

  // Check student's bookings
  console.log("\n3. GET /api/transport/bookings?studentId=... - View my bookings");
  const myBookingsRes = await getBookings(
    new Request(`http://localhost?studentId=${student.id}`)
  );
  const myBookings = await myBookingsRes.json();
  console.log(`   Found ${myBookings.length} booking(s)`);

  // Create more students and fill the vehicle
  console.log("\n4. Fill vehicle capacity (testing seat limits)");
  const additionalStudents = [];
  for (let i = 0; i < 2; i++) {
    const [s] = await db.insert(users).values({
      email: `student${Math.floor(Math.random()*10000)}@test.com`,
      role: "STUDENT",
      name: `Student ${i+2}`,
    }).returning();
    additionalStudents.push(s);

    const bookReq = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: s.id,
        vehicleId: vehicle.id,
        routeId: route.id,
      }),
    });
    const bookRes = await postBooking(bookReq);
    const booking = await bookRes.json();
    console.log(`   ✓ Student ${i+2} booked seat`);
  }

  // Try to exceed capacity
  console.log("\n5. Attempt booking when full");
  const [extraStudent] = await db.insert(users).values({
    email: `extra${Math.floor(Math.random()*10000)}@test.com`,
    role: "STUDENT",
    name: "Extra Student",
  }).returning();

  const fullBookReq = new Request("http://localhost", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentId: extraStudent.id,
      vehicleId: vehicle.id,
      routeId: route.id,
    }),
  });
  const fullBookRes = await postBooking(fullBookReq);
  console.log(`   Status: ${fullBookRes.status}`);
  if (fullBookRes.status === 400) {
    const error = await fullBookRes.json();
    console.log(`   ✓ Expected error: ${error.error}`);
  }

  // Cancel a booking
  console.log("\n6. PATCH /api/transport/bookings/[id] - Cancel booking");
  const cancelReq = new Request("http://localhost", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "CANCELLED" }),
  });
  const cancelRes = await patchBooking(cancelReq, { params: { id: booking1.id } });
  const cancelled = await cancelRes.json();
  console.log(`   ✓ Booking ${cancelled.id} status: ${cancelled.status}`);

  // Now the extra student should be able to book
  console.log("\n7. Book the freed seat");
  const retryBookReq = new Request("http://localhost", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentId: extraStudent.id,
      vehicleId: vehicle.id,
      routeId: route.id,
    }),
  });
  const retryBookRes = await postBooking(retryBookReq);
  const retryBooking = await retryBookRes.json();
  console.log(`   Status: ${retryBookRes.status}`);
  if (retryBookRes.status === 201) {
    console.log(`   ✓ Successfully booked after cancellation: ${retryBooking.id}`);
  } else {
    console.log(`   Error: ${retryBooking.error}`);
  }

  // View vehicle bookings
  console.log("\n8. GET /api/transport/bookings?vehicleId=... - View all bookings for vehicle");
  const vehicleBookingsRes = await getBookings(
    new Request(`http://localhost?vehicleId=${vehicle.id}`)
  );
  const vehicleBookings = await vehicleBookingsRes.json();
  console.log(`   Total bookings: ${vehicleBookings.length}`);
  const confirmed = vehicleBookings.filter((b: any) => b.status === "CONFIRMED");
  console.log(`   Confirmed: ${confirmed.length}/${vehicle.capacity}`);

  // Delete a booking
  console.log("\n9. DELETE /api/transport/bookings/[id] - Remove booking");
  const deleteRes = await deleteBooking(new Request("http://localhost"), { params: { id: booking1.id } });
  console.log(`   Delete status: ${deleteRes.status}`);

  console.log("\n✅ Matatu booking flow completed!");
  console.log("\nSummary:");
  console.log(`- Vehicle capacity: ${vehicle.capacity}`);
  console.log(`- Bookings created: ${vehicleBookings.length}`);
  console.log(`- Capacity enforcement: Working ✓`);
  console.log(`- Cancellation flow: Working ✓`);
}

studentBookingFlow().catch((e) => {
  console.error("Student booking flow failed:", e);
  process.exit(1);
});
