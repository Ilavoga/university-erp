"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";
import { createListingAction } from "@/actions/housing-actions";
import { useRouter } from "next/navigation";

export function CreateListingForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError(null);

    try {
      await createListingAction(formData);
      router.push("/housing/landlord");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create listing");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/housing/landlord">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create New Listing</h1>
      </div>

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
                placeholder="Describe the property, amenities, rules, etc." 
                rows={5}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label>Images</Label>
              <ImageUpload name="images" maxImages={5} />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Listing"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
