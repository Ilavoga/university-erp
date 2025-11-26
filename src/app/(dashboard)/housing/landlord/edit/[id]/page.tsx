"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";
import { updateListingAction } from "@/actions/housing-actions";
import Image from "next/image";
import { use } from "react";

interface Listing {
  id: string;
  title: string;
  description: string | null;
  location: string;
  price: number;
  images: string[] | null;
  isAvailable: boolean;
}

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);

  useEffect(() => {
    async function fetchListing() {
      try {
        const res = await fetch(`/api/housing/external/${id}`);
        if (!res.ok) throw new Error("Failed to fetch listing");
        const data = await res.json();
        setListing(data);
        setExistingImages(data.images || []);
      } catch {
        setError("Failed to load listing");
      } finally {
        setIsLoading(false);
      }
    }
    fetchListing();
  }, [id]);

  const removeExistingImage = (url: string) => {
    setExistingImages((prev) => prev.filter((img) => img !== url));
    setImagesToRemove((prev) => [...prev, url]);
  };

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError(null);

    // Add listing ID and images to remove
    formData.set("listingId", id);
    formData.set("existingImages", JSON.stringify(existingImages));
    formData.set("imagesToRemove", JSON.stringify(imagesToRemove));

    try {
      await updateListingAction(formData);
      router.push(`/housing/external/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update listing");
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Listing not found</p>
        <Button asChild className="mt-4">
          <Link href="/housing/landlord">Back to My Listings</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/housing/external/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Edit Listing</h1>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Listing Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                defaultValue={listing.title}
                placeholder="e.g. Modern Studio Apartment"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                defaultValue={listing.location}
                placeholder="e.g. Downtown, 5 min walk to campus"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Monthly Rent (KES)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                defaultValue={listing.price}
                placeholder="e.g. 15000"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={listing.description || ""}
                placeholder="Describe the property, amenities, rules, etc."
                rows={5}
                disabled={isSubmitting}
              />
            </div>

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="space-y-2">
                <Label>Current Images</Label>
                <div className="grid grid-cols-3 gap-2">
                  {existingImages.map((url, index) => (
                    <div key={url} className="relative group aspect-video rounded-lg overflow-hidden border bg-muted">
                      <Image
                        src={url}
                        alt={`Image ${index + 1}`}
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
              <ImageUpload 
                name="images" 
                maxImages={5 - existingImages.length} 
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Button type="button" variant="outline" asChild disabled={isSubmitting}>
                <Link href={`/housing/external/${id}`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
