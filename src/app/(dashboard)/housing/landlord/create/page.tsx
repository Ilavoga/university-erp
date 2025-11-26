import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createListingAction } from "@/actions/housing-actions";

export default async function CreateListingPage() {
  const session = await auth();
  if (!session || session.user.role !== "LANDLORD") redirect("/housing");

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
          <form action={createListingAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="e.g. Modern Studio Apartment" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" placeholder="e.g. Downtown, 5 min walk to campus" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Monthly Rent (KES)</Label>
              <Input id="price" name="price" type="number" min="0" placeholder="e.g. 15000" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder="Describe the property, amenities, rules, etc." 
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="images">Images</Label>
              <Input 
                id="images" 
                name="images" 
                type="file" 
                accept="image/*" 
                multiple 
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                You can select multiple images. Supported formats: JPG, PNG, WebP.
              </p>
            </div>

            <Button type="submit" className="w-full">
              Create Listing
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
