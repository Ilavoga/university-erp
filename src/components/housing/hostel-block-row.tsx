"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateRoomDialog, EditRoomDialog, DeleteRoomDialog } from "./room-dialogs";

interface Room {
  id: string;
  roomNumber: string;
  capacity: number;
  currentOccupancy: number;
  pricePerSemester: number;
  images: string[] | null;
}

interface HostelBlockRowProps {
  blockId: string;
  blockName: string;
  location: string | null;
  genderRestriction: string | null;
  rooms: Room[];
}

export function HostelBlockRow({
  blockId,
  blockName,
  location,
  genderRestriction,
  rooms,
}: HostelBlockRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalCapacity = rooms.reduce((acc, room) => acc + room.capacity, 0);
  const totalOccupancy = rooms.reduce((acc, room) => acc + room.currentOccupancy, 0);

  return (
    <>
      <TableRow>
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </TableCell>
        <TableCell className="font-medium">{blockName}</TableCell>
        <TableCell>{location}</TableCell>
        <TableCell>{genderRestriction || "Mixed"}</TableCell>
        <TableCell>{rooms.length}</TableCell>
        <TableCell>
          {totalOccupancy} / {totalCapacity}
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow>
          <TableCell colSpan={6} className="bg-muted/50 p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Rooms in {blockName}</h4>
                <CreateRoomDialog blockId={blockId} />
              </div>

              {rooms.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No rooms yet. Click "Add Room" to create one.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room #</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Occupancy</TableHead>
                      <TableHead>Price/Semester</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell className="font-medium">{room.roomNumber}</TableCell>
                        <TableCell>{room.capacity} beds</TableCell>
                        <TableCell>
                          {room.currentOccupancy} / {room.capacity}
                        </TableCell>
                        <TableCell>KES {room.pricePerSemester.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <EditRoomDialog
                              roomId={room.id}
                              blockId={blockId}
                              roomNumber={room.roomNumber}
                              capacity={room.capacity}
                              pricePerSemester={room.pricePerSemester}
                              images={room.images}
                            />
                            <DeleteRoomDialog roomId={room.id} roomNumber={room.roomNumber} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
