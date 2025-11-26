"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Upload, Loader2 } from "lucide-react";
import { compressImage, formatFileSize } from "@/lib/image-utils";
import Image from "next/image";

interface ImageUploadProps {
  name: string;
  maxImages?: number;
}

interface PreviewImage {
  file: File;
  preview: string;
  originalSize: number;
  compressedSize: number;
}

export function ImageUpload({ name, maxImages = 5 }: ImageUploadProps) {
  const [images, setImages] = useState<PreviewImage[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit number of images
    const remainingSlots = maxImages - images.length;
    const filesToProcess = files.slice(0, remainingSlots);

    if (filesToProcess.length === 0) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    setIsCompressing(true);

    try {
      const newImages: PreviewImage[] = [];

      for (const file of filesToProcess) {
        // Only process image files
        if (!file.type.startsWith("image/")) continue;

        const originalSize = file.size;

        // Compress the image
        const compressed = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.8,
          mimeType: "image/jpeg",
        });

        // Create preview URL
        const preview = URL.createObjectURL(compressed);

        newImages.push({
          file: compressed,
          preview,
          originalSize,
          compressedSize: compressed.size,
        });
      }

      setImages((prev) => [...prev, ...newImages]);
    } catch (error) {
      console.error("Error compressing images:", error);
      alert("Failed to process some images");
    } finally {
      setIsCompressing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      // Revoke the object URL to free memory
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  // Update hidden input with compressed files for form submission
  useEffect(() => {
    if (!hiddenInputRef.current) return;

    const dt = new DataTransfer();
    images.forEach((img) => dt.items.add(img.file));
    hiddenInputRef.current.files = dt.files;
  }, [images]);

  // Calculate total savings
  const totalOriginal = images.reduce((acc, img) => acc + img.originalSize, 0);
  const totalCompressed = images.reduce((acc, img) => acc + img.compressedSize, 0);
  const savings = totalOriginal - totalCompressed;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isCompressing || images.length >= maxImages}
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
          {images.length}/{maxImages} images
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
      <input
        ref={hiddenInputRef}
        type="file"
        name={name}
        multiple
        className="hidden"
      />

      {/* Image previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img, index) => (
            <div key={index} className="relative group aspect-video rounded-lg overflow-hidden border">
              <Image
                src={img.preview}
                alt={`Preview ${index + 1}`}
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
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
      {images.length > 0 && savings > 0 && (
        <p className="text-xs text-muted-foreground">
          💾 Saved {formatFileSize(savings)} ({Math.round((savings / totalOriginal) * 100)}% smaller)
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Images are automatically compressed. Max {maxImages} images, optimized for web.
      </p>
    </div>
  );
}
