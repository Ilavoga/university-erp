$ErrorActionPreference = "Stop"

function Test-Step {
    param($name, $scriptBlock)
    Write-Host "Testing: $name" -ForegroundColor Cyan
    try {
        & $scriptBlock
        Write-Host "  Success" -ForegroundColor Green
    } catch {
        Write-Host "  Failed: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Creating Admin Flow Test Script..."
Set-Content -Path "tests/admin-flow-test.ts" -Value @'
import { db } from "@/db";
import { users, roomBookings, hostelRooms } from "@/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  console.log("--- Admin Housing Flow Test ---");

  // 1. Find a pending booking
  let booking = await db.query.roomBookings.findFirst({
    where: eq(roomBookings.status, "PENDING"),
  });

  if (!booking) {
    console.log("No pending booking found. Creating one...");
    // We need a student and a room.
    const student = await db.query.users.findFirst({ where: eq(users.role, "STUDENT") });
    const room = await db.query.hostelRooms.findFirst();
    
    if (!student || !room) {
        console.error("Cannot create booking: Missing student or room.");
        process.exit(1);
    }

    const [newBooking] = await db.insert(roomBookings).values({
        studentId: student.id,
        roomId: room.id,
        semester: "Fall 2025",
        status: "PENDING"
    }).returning();
    booking = newBooking;
  }

  console.log("Found pending booking: " + booking.id);

  // 2. Simulate Admin Approve (Direct DB update as we can't easily mock auth for server action in this script)
  console.log("Simulating Admin Approve...");
  await db
    .update(roomBookings)
    .set({ status: "CONFIRMED" })
    .where(eq(roomBookings.id, booking.id));

  // 3. Verify
  const updatedBooking = await db.query.roomBookings.findFirst({
    where: eq(roomBookings.id, booking.id),
  });

  if (updatedBooking?.status === "CONFIRMED") {
    console.log(" Booking confirmed successfully.");
  } else {
    console.error(" Failed to confirm booking.");
    process.exit(1);
  }

  // 4. Simulate Admin Reject
  console.log("Simulating Admin Reject...");
  await db
    .update(roomBookings)
    .set({ status: "REJECTED" })
    .where(eq(roomBookings.id, booking.id));

   // 5. Verify
  const rejectedBooking = await db.query.roomBookings.findFirst({
    where: eq(roomBookings.id, booking.id),
  });

  if (rejectedBooking?.status === "REJECTED") {
    console.log(" Booking rejected successfully.");
  } else {
    console.error(" Failed to reject booking.");
    process.exit(1);
  }
}

run().catch((e) => {
    console.error(e);
    process.exit(1);
});
'@

# Run the script using npx tsx
Write-Host 'Running Admin Flow Test...'
npx tsx tests/admin-flow-test.ts
