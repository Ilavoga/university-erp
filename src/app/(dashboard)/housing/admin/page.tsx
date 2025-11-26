import { auth } from "@/auth";
import { db } from "@/db";
import { users, hostelBlocks, roomBookings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { updateBookingStatusAction } from "@/actions/housing-actions";
import { Button } from "@/components/ui/button";

export default async function AdminHousingPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/housing");

  // Fetch Landlords
  const landlords = await db.query.users.findMany({
    where: eq(users.role, "LANDLORD"),
    orderBy: [desc(users.createdAt)],
  });

  // Fetch Hostels
  const hostels = await db.query.hostelBlocks.findMany({
    with: {
      rooms: true,
    },
  });

  // Fetch Bookings
  const bookings = await db.query.roomBookings.findMany({
    with: {
      student: true,
      room: {
        with: {
          block: true,
        },
      },
    },
    orderBy: [desc(roomBookings.createdAt)],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Housing Control</h1>
        <p className="text-muted-foreground">
          Manage landlords, hostels, and student bookings.
        </p>
      </div>

      <Tabs defaultValue="landlords" className="space-y-4">
        <TabsList>
          <TabsTrigger value="landlords">Landlords</TabsTrigger>
          <TabsTrigger value="hostels">Hostels</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="landlords">
          <Card>
            <CardHeader>
              <CardTitle>Registered Landlords</CardTitle>
              <CardDescription>
                View and manage landlord accounts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {landlords.map((landlord) => (
                    <TableRow key={landlord.id}>
                      <TableCell className="font-medium">{landlord.name}</TableCell>
                      <TableCell>{landlord.email}</TableCell>
                      <TableCell>{landlord.createdAt?.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">Active</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {landlords.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No landlords found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hostels">
          <Card>
            <CardHeader>
              <CardTitle>Hostel Blocks</CardTitle>
              <CardDescription>
                Overview of on-campus housing blocks and occupancy.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Rooms</TableHead>
                    <TableHead>Occupancy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hostels.map((block) => {
                    const totalCapacity = block.rooms.reduce((acc, room) => acc + room.capacity, 0);
                    const totalOccupancy = block.rooms.reduce((acc, room) => acc + room.currentOccupancy, 0);
                    return (
                      <TableRow key={block.id}>
                        <TableCell className="font-medium">{block.name}</TableCell>
                        <TableCell>{block.location}</TableCell>
                        <TableCell>{block.genderRestriction || "Mixed"}</TableCell>
                        <TableCell>{block.rooms.length}</TableCell>
                        <TableCell>
                          {totalOccupancy} / {totalCapacity}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {hostels.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No hostel blocks found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>
                Track student room bookings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{booking.student.name}</span>
                          <span className="text-xs text-muted-foreground">{booking.student.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {booking.room.block.name} - {booking.room.roomNumber}
                      </TableCell>
                      <TableCell>{booking.semester}</TableCell>
                      <TableCell>
                        <Badge variant={
                          booking.status === "CONFIRMED" ? "default" :
                          booking.status === "PENDING" ? "secondary" : "destructive"
                        }>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{booking.createdAt?.toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        {booking.status === "PENDING" && (
                          <div className="flex justify-end gap-2">
                            <form action={updateBookingStatusAction}>
                              <input type="hidden" name="bookingId" value={booking.id} />
                              <input type="hidden" name="status" value="CONFIRMED" />
                              <Button size="sm" variant="default">Approve</Button>
                            </form>
                            <form action={updateBookingStatusAction}>
                              <input type="hidden" name="bookingId" value={booking.id} />
                              <input type="hidden" name="status" value="REJECTED" />
                              <Button size="sm" variant="destructive">Reject</Button>
                            </form>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {bookings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No bookings found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
