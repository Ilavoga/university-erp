import { auth } from "@/auth";
import { db } from "@/db";
import { hostelRooms, hostelBlocks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { bookRoomAction } from "@/actions/housing-actions";

export default async function BookRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { roomId } = await params;

  const room = await db.query.hostelRooms.findFirst({
    where: eq(hostelRooms.id, roomId),
    with: {
      block: true,
    },
  });

  if (!room) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/housing/internal/${room.blockId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Confirm Booking</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Hostel Block</Label>
              <div className="font-medium">{room.block.name}</div>
            </div>
            <div>
              <Label>Room Number</Label>
              <div className="font-medium">{room.roomNumber}</div>
            </div>
            <div>
              <Label>Price per Semester</Label>
              <div className="font-medium">KES {room.pricePerSemester.toLocaleString()}</div>
            </div>
            <div>
              <Label>Semester</Label>
              <div className="font-medium">Fall 2025</div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Label>Student Name</Label>
            <div className="font-medium">{session.user.name}</div>
            <div className="text-sm text-muted-foreground">{session.user.email}</div>
          </div>
        </CardContent>
        <CardFooter>
          <form action={bookRoomAction} className="w-full">
            <input type="hidden" name="roomId" value={room.id} />
            <input type="hidden" name="semester" value="Fall 2025" />
            <Button type="submit" className="w-full">
              Confirm Booking
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
