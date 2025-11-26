import { auth } from "@/auth";
import { db } from "@/db";
import { externalListings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { ArrowLeft, MapPin, User, DollarSign } from "lucide-react";
import { sendInquiryAction } from "@/actions/housing-actions";

export default async function ListingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const listing = await db.query.externalListings.findFirst({
    where: eq(externalListings.id, id),
    with: {
      landlord: true,
    },
  });

  if (!listing) {
    notFound();
  }

  const displayImages = listing.images && listing.images.length > 0 
    ? listing.images 
    : ["/placeholder-house.jpg"];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/housing/external">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{listing.title}</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{listing.location}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayImages[0]}
              alt={listing.title}
              className="h-full w-full object-cover"
            />
          </div>
          {displayImages.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {displayImages.slice(1).map((img, i) => (
                <div key={i} className="aspect-square overflow-hidden rounded-md bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`Gallery ${i}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{listing.description}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Price</span>
                <span className="text-xl font-bold">KES {listing.price.toLocaleString()}/mo</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={listing.isAvailable ? "default" : "destructive"}>
                  {listing.isAvailable ? "Available" : "Rented"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Landlord</span>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{listing.landlord.name}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Landlord</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={sendInquiryAction} className="space-y-4">
                <input type="hidden" name="listingId" value={listing.id} />
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Hi, I'm interested in this property..."
                    required
                    rows={4}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={!listing.isAvailable}>
                  Send Inquiry
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
