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
import { CreateHostelForm, EditHostelForm } from "./hostel-forms";

export function CreateHostelDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Add Hostel Block</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Hostel Block</DialogTitle>
          <DialogDescription>
            Provide the basic information for the new hostel block. Upload one or more images.
          </DialogDescription>
        </DialogHeader>
        <CreateHostelForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

interface EditHostelDialogProps {
  blockId: string;
  blockName: string;
  location: string;
  genderRestriction: string | null;
  images: string[] | null;
}

export function EditHostelDialog({
  blockId,
  blockName,
  location,
  genderRestriction,
  images,
}: EditHostelDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {blockName}</DialogTitle>
          <DialogDescription>
            Update the block information and save to keep records current.
          </DialogDescription>
        </DialogHeader>
        <EditHostelForm
          blockId={blockId}
          blockName={blockName}
          location={location}
          genderRestriction={genderRestriction}
          images={images}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
