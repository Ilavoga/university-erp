import { auth } from "@/auth";
import { db } from "@/db";
import { hostelBlocks, hostelRooms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function HostelBlockPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const block = await db.query.hostelBlocks.findFirst({
    where: eq(hostelBlocks.id, id),
    with: {
      rooms: true,
    },
  });

  if (!block) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/housing/internal">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{block.name}</h1>
          <p className="text-muted-foreground">
            {block.location} • {block.genderRestriction} Only
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Rooms</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room Number</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Occupancy</TableHead>
                <TableHead>Price/Semester</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {block.rooms.map((room) => {
                const isFull = room.currentOccupancy >= room.capacity;
                return (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.roomNumber}</TableCell>
                    <TableCell>{room.capacity}</TableCell>
                    <TableCell>{room.currentOccupancy} / {room.capacity}</TableCell>
                    <TableCell>KES {room.pricePerSemester.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={isFull ? "destructive" : "default"}>
                        {isFull ? "Full" : "Available"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" disabled={isFull} asChild>
                        <Link href={`/housing/internal/book/${room.id}`}>
                          Book Now
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
