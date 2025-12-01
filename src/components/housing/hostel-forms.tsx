"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { createHostelBlockAction, updateHostelBlockAction } from "@/actions/housing-actions";
import { Loader2, X } from "lucide-react";
import Image from "next/image";

interface CreateHostelFormProps {
  onSuccess?: () => void;
}

export function CreateHostelForm({ onSuccess }: CreateHostelFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError(null);

    try {
      await createHostelBlockAction(formData);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create hostel block");
      setIsSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="hostel-name">Name</Label>
        <Input id="hostel-name" name="name" required disabled={isSubmitting} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="hostel-location">Location</Label>
        <Input id="hostel-location" name="location" required disabled={isSubmitting} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="hostel-gender">Gender Restriction</Label>
        <select
          id="hostel-gender"
          name="genderRestriction"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          defaultValue="MIXED"
          disabled={isSubmitting}
        >
          <option value="MIXED">Mixed</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>
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
            "Create Block"
          )}
        </Button>
      </div>
    </form>
  );
}

interface EditHostelFormProps {
  blockId: string;
  blockName: string;
  location: string;
  genderRestriction: string | null;
  images: string[] | null;
  onSuccess?: () => void;
}

export function EditHostelForm({
  blockId,
  blockName,
  location,
  genderRestriction,
  images,
  onSuccess,
}: EditHostelFormProps) {
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

    // Add existing images data
    formData.set("existingImages", JSON.stringify(existingImages));
    formData.set("imagesToRemove", JSON.stringify(imagesToRemove));

    try {
      await updateHostelBlockAction(formData);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update hostel block");
      setIsSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="blockId" value={blockId} />
      <div className="space-y-2">
        <Label htmlFor={`hostel-name-${blockId}`}>Name</Label>
        <Input
          id={`hostel-name-${blockId}`}
          name="name"
          defaultValue={blockName}
          required
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`hostel-location-${blockId}`}>Location</Label>
        <Input
          id={`hostel-location-${blockId}`}
          name="location"
          defaultValue={location ?? ""}
          required
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`hostel-gender-${blockId}`}>Gender Restriction</Label>
        <select
          id={`hostel-gender-${blockId}`}
          name="genderRestriction"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          defaultValue={genderRestriction ?? "MIXED"}
          disabled={isSubmitting}
        >
          <option value="MIXED">Mixed</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>
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
                  alt={`${blockName} image ${index + 1}`}
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
