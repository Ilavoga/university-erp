"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { createHostelBlockAction, updateHostelBlockAction } from "@/actions/housing-actions";
import { Loader2 } from "lucide-react";

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

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError(null);

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
      <div className="space-y-2">
        <Label>Images</Label>
        <ImageUpload name="images" maxImages={6} />
        <p className="text-xs text-muted-foreground">
          Note: Uploading new images will replace existing ones
        </p>
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
