import { auth } from "@/auth";
import { db } from "@/db";
import { externalListings, listingInquiries } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { Plus, Eye, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { toggleListingAvailabilityAction } from "@/actions/housing-actions";

export default async function LandlordDashboardPage() {
  const session = await auth();
  if (!session || session.user.role !== "LANDLORD") redirect("/housing");

  const myListings = await db.query.externalListings.findMany({
    where: eq(externalListings.landlordId, session.user.id),
    orderBy: [desc(externalListings.createdAt)],
  });

  // Fetch inquiries for my listings
  // This is a bit complex with Drizzle query builder if not defined in relations deeply enough
  // But we have relations defined.
  
  // Let's just fetch all inquiries where listing.landlordId is me.
  // We can do this by fetching listings with inquiries.
  const listingsWithInquiries = await db.query.externalListings.findMany({
    where: eq(externalListings.landlordId, session.user.id),
    with: {
      inquiries: {
        with: {
          student: true,
        },
        orderBy: (inquiries, { desc }) => [desc(inquiries.createdAt)],
      },
    },
  });

  const allInquiries = listingsWithInquiries.flatMap(l => l.inquiries.map(i => ({ ...i, listingTitle: l.title })));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Landlord Dashboard</h1>
        <Button asChild>
          <Link href="/housing/landlord/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Listing
          </Link>
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myListings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell className="font-medium">{listing.title}</TableCell>
                    <TableCell>KES {listing.price.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={listing.isAvailable ? "default" : "secondary"}>
                        {listing.isAvailable ? "Active" : "Rented"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <form action={toggleListingAvailabilityAction}>
                        <input type="hidden" name="listingId" value={listing.id} />
                        <input type="hidden" name="isAvailable" value={String(listing.isAvailable)} />
                        <Button variant="outline" size="sm">
                          {listing.isAvailable ? "Deactivate" : "Activate"}
                        </Button>
                      </form>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/housing/external/${listing.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {myListings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No listings yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Inquiries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allInquiries.slice(0, 5).map((inquiry) => (
                <div key={inquiry.id} className="flex flex-col gap-1 p-3 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <span className="font-medium">{inquiry.student.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {inquiry.createdAt?.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Re: {inquiry.listingTitle}
                  </div>
                  <p className="text-sm">{inquiry.message}</p>
                </div>
              ))}
              {allInquiries.length === 0 && (
                <p className="text-center text-muted-foreground">No inquiries yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
