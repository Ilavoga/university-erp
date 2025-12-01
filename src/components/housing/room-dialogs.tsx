"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CreateRoomForm, EditRoomForm } from "./room-forms";
import { deleteHostelRoomAction } from "@/actions/housing-actions";
import { Loader2, Trash2 } from "lucide-react";

interface CreateRoomDialogProps {
  blockId: string;
}

export function CreateRoomDialog({ blockId }: CreateRoomDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Add Room
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Room</DialogTitle>
          <DialogDescription>
            Add a new room to this hostel block with capacity and pricing details.
          </DialogDescription>
        </DialogHeader>
        <CreateRoomForm blockId={blockId} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

interface EditRoomDialogProps {
  roomId: string;
  blockId: string;
  roomNumber: string;
  capacity: number;
  pricePerSemester: number;
  images: string[] | null;
}

export function EditRoomDialog({
  roomId,
  blockId,
  roomNumber,
  capacity,
  pricePerSemester,
  images,
}: EditRoomDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Room {roomNumber}</DialogTitle>
          <DialogDescription>
            Update room details, capacity, pricing, or images.
          </DialogDescription>
        </DialogHeader>
        <EditRoomForm
          roomId={roomId}
          blockId={blockId}
          roomNumber={roomNumber}
          capacity={capacity}
          pricePerSemester={pricePerSemester}
          images={images}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

interface DeleteRoomDialogProps {
  roomId: string;
  roomNumber: string;
}

export function DeleteRoomDialog({ roomId, roomNumber }: DeleteRoomDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);

    try {
      await deleteHostelRoomAction(roomId);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete room");
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Room {roomNumber}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The room will be permanently deleted from the system.
            {error && (
              <span className="block mt-2 text-destructive font-medium">{error}</span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Room"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
