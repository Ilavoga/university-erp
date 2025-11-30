"use client";

import { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, Upload, Loader2 } from "lucide-react";
import { compressImage, formatFileSize } from "@/lib/image-utils";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface HostelImageManagerProps {
  blockId?: string;
  blockName: string;
  existingImages?: string[];
  maxImages?: number;
}

interface PreviewImage {
  file: File;
  preview: string;
  originalSize: number;
  compressedSize: number;
}

export function HostelImageManager({
  blockId,
  blockName,
  existingImages = [],
  maxImages = 6,
}: HostelImageManagerProps) {
  const [imagesToRemove, setImagesToRemove] = useState<Set<string>>(new Set());
  const [removeConfirmUrl, setRemoveConfirmUrl] = useState<string | null>(null);
  const [newImages, setNewImages] = useState<PreviewImage[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const keptImages = existingImages.filter((url) => !imagesToRemove.has(url));
  const remainingSlots = Math.max(0, maxImages - keptImages.length - newImages.length);

  const handleRemoveToggle = (url: string, checked: boolean) => {
    if (checked) {
      setRemoveConfirmUrl(url);
    } else {
      const updated = new Set(imagesToRemove);
      updated.delete(url);
      setImagesToRemove(updated);
    }
  };

  const confirmRemove = () => {
    if (removeConfirmUrl) {
      const updated = new Set(imagesToRemove);
      updated.add(removeConfirmUrl);
      setImagesToRemove(updated);
      setRemoveConfirmUrl(null);
    }
  };

  const cancelRemove = () => {
    setRemoveConfirmUrl(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Calculate available slots
    const availableSlots = remainingSlots;
    const filesToProcess = files.slice(0, availableSlots);

    if (files.length > availableSlots) {
      alert(
        `You can only add ${availableSlots} more image${availableSlots !== 1 ? "s" : ""}. Selected ${files.length}, processing first ${availableSlots}.`
      );
    }

    if (filesToProcess.length === 0) return;

    setIsCompressing(true);

    try {
      const compressed: PreviewImage[] = [];

      for (const file of filesToProcess) {
        if (!file.type.startsWith("image/")) continue;

        const originalSize = file.size;
        const compressedFile = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.8,
          mimeType: "image/jpeg",
        });

        const preview = URL.createObjectURL(compressedFile);

        compressed.push({
          file: compressedFile,
          preview,
          originalSize,
          compressedSize: compressedFile.size,
        });
      }

      setNewImages((prev) => [...prev, ...compressed]);
    } catch (error) {
      console.error("Error compressing images:", error);
      alert("Failed to process some images");
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  // Update hidden input with compressed files for form submission
  useEffect(() => {
    if (!hiddenInputRef.current) return;
    const dt = new DataTransfer();
    newImages.forEach((img) => dt.items.add(img.file));
    hiddenInputRef.current.files = dt.files;
  }, [newImages]);

  // Calculate compression stats
  const totalOriginal = newImages.reduce((acc, img) => acc + img.originalSize, 0);
  const totalCompressed = newImages.reduce((acc, img) => acc + img.compressedSize, 0);
  const savings = totalOriginal - totalCompressed;

  return (
    <>
      {existingImages.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor={blockId ? `hostel-existing-images-${blockId}` : "hostel-existing-images"}>
            Existing Images ({keptImages.length}/{maxImages})
          </Label>
          <div
            id={blockId ? `hostel-existing-images-${blockId}` : "hostel-existing-images"}
            className="grid grid-cols-2 md:grid-cols-3 gap-2"
            aria-label={`Existing images for ${blockName}`}
          >
            {existingImages.map((imgUrl, i) => {
              const isMarkedForRemoval = imagesToRemove.has(imgUrl);
              return (
                <div key={imgUrl} className="relative group">
                  <div className="aspect-video bg-muted rounded overflow-hidden border">
                    <Image
                      src={imgUrl}
                      alt={`Hostel ${blockName} image ${i + 1}`}
                      fill
                      className={`object-cover transition-opacity ${isMarkedForRemoval ? "opacity-40" : ""}`}
                      loading="lazy"
                    />
                  </div>
                  <label className="absolute top-1 left-1 bg-white/90 backdrop-blur px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 cursor-pointer hover:bg-white">
                    <input
                      type="checkbox"
                      name="removeImages[]"
                      value={imgUrl}
                      checked={isMarkedForRemoval}
                      onChange={(e) => handleRemoveToggle(imgUrl, e.target.checked)}
                      aria-label={`Remove image ${i + 1}`}
                      className="h-3 w-3 cursor-pointer"
                    />
                    <span>Remove</span>
                  </label>
                  {isMarkedForRemoval && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded">
                      <span className="text-white text-xs font-medium bg-red-600 px-2 py-1 rounded">
                        Will be removed
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <input type="hidden" name="existingImages" value={JSON.stringify(keptImages)} />
        </div>
      )}

      <div className="space-y-2">
        <Label>Add New Images</Label>
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isCompressing || remainingSlots === 0}
          >
            {isCompressing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Compressing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Add Images
              </>
            )}
          </Button>
          <span className="text-sm text-muted-foreground">
            {keptImages.length + newImages.length}/{maxImages} images
          </span>
        </div>

        {/* Hidden file input for selecting files */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Hidden input that will be submitted with the form */}
        <input ref={hiddenInputRef} type="file" name="images" multiple className="hidden" />

        {/* New image previews */}
        {newImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {newImages.map((img, index) => (
              <div key={index} className="relative group aspect-video rounded overflow-hidden border">
                <Image src={img.preview} alt={`New image ${index + 1}`} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewImage(index)}
                  className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center">
                  {formatFileSize(img.compressedSize)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Compression stats */}
        {newImages.length > 0 && savings > 0 && (
          <p className="text-xs text-muted-foreground">
            💾 Saved {formatFileSize(savings)} ({Math.round((savings / totalOriginal) * 100)}%
            smaller)
          </p>
        )}

        {remainingSlots === 0 && newImages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Maximum of {maxImages} images reached. Remove existing images to add new ones.
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Images are automatically compressed. Optimized for web.
        </p>
      </div>

      <AlertDialog open={!!removeConfirmUrl} onOpenChange={(open) => !open && cancelRemove()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this image?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the image for removal. The change will take effect when you save.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelRemove}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
