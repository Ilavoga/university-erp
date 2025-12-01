"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { createHostelRoomAction, updateHostelRoomAction } from "@/actions/housing-actions";
import { Loader2, X } from "lucide-react";
import Image from "next/image";

interface CreateRoomFormProps {
  blockId: string;
  onSuccess?: () => void;
}

export function CreateRoomForm({ blockId, onSuccess }: CreateRoomFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError(null);

    try {
      await createHostelRoomAction(formData);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room");
      setIsSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="blockId" value={blockId} />
      
      <div className="space-y-2">
        <Label htmlFor="room-number">Room Number</Label>
        <Input 
          id="room-number" 
          name="roomNumber" 
          placeholder="e.g. A101" 
          required 
          disabled={isSubmitting} 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity</Label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min="1"
            max="10"
            placeholder="e.g. 2"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price/Semester (KES)</Label>
          <Input
            id="price"
            name="pricePerSemester"
            type="number"
            min="0"
            placeholder="e.g. 5000"
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Images</Label>
        <ImageUpload name="images" maxImages={6} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Room"
          )}
        </Button>
      </div>
    </form>
  );
}

interface EditRoomFormProps {
  roomId: string;
  blockId: string;
  roomNumber: string;
  capacity: number;
  pricePerSemester: number;
  images: string[] | null;
  onSuccess?: () => void;
}

export function EditRoomForm({
  roomId,
  blockId,
  roomNumber,
  capacity,
  pricePerSemester,
  images,
  onSuccess,
}: EditRoomFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>(images ?? []);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);

  const removeExistingImage = (url: string) => {
    setExistingImages((prev) => prev.filter((img) => img !== url));
    setImagesToRemove((prev) => [...prev, url]);
  };

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError(null);

    formData.set("existingImages", JSON.stringify(existingImages));
    formData.set("imagesToRemove", JSON.stringify(imagesToRemove));

    try {
      await updateHostelRoomAction(formData);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update room");
      setIsSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="roomId" value={roomId} />
      <input type="hidden" name="blockId" value={blockId} />

      <div className="space-y-2">
        <Label htmlFor={`room-number-${roomId}`}>Room Number</Label>
        <Input
          id={`room-number-${roomId}`}
          name="roomNumber"
          defaultValue={roomNumber}
          placeholder="e.g. A101"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`capacity-${roomId}`}>Capacity</Label>
          <Input
            id={`capacity-${roomId}`}
            name="capacity"
            type="number"
            min="1"
            max="10"
            defaultValue={capacity}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`price-${roomId}`}>Price/Semester (KES)</Label>
          <Input
            id={`price-${roomId}`}
            name="pricePerSemester"
            type="number"
            min="0"
            defaultValue={pricePerSemester}
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Existing Images */}
      {existingImages.length > 0 && (
        <div className="space-y-2">
          <Label>Current Images</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {existingImages.map((url, index) => (
              <div key={url} className="relative group aspect-video rounded-lg overflow-hidden border bg-muted">
                <Image
                  src={url}
                  alt={`Room ${roomNumber} image ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(url)}
                  className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Images */}
      <div className="space-y-2">
        <Label>Add New Images</Label>
        <ImageUpload name="images" maxImages={6 - existingImages.length} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
}
