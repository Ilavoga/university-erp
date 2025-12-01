import { auth } from "@/auth";
import { db } from "@/db";
import { externalListings } from "@/db/schema";
import { ListingCard } from "@/components/housing/listing-card";
import { ItemGroup } from "@/components/ui/item";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function ExternalHousingPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const listings = await db.query.externalListings.findMany({
    orderBy: [desc(externalListings.createdAt)],
    with: {
      landlord: true,
    },
  });

  const isLandlord = session.user.role === "LANDLORD";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Off-Campus Listings</h1>
          <p className="text-muted-foreground">
            Find apartments and rooms for rent near the university.
          </p>
        </div>
        {isLandlord && (
          <Button asChild>
            <Link href="/housing/landlord/create">
              <Plus className="mr-2 h-4 w-4" />
              Post Listing
            </Link>
          </Button>
        )}
      </div>

      <ItemGroup>
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            id={listing.id}
            title={listing.title}
            location={listing.location}
            price={listing.price}
            images={listing.images}
            isAvailable={listing.isAvailable}
            landlordName={listing.landlord.name || "Unknown Landlord"}
          />
        ))}
      </ItemGroup>

      {listings.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No listings found.</p>
        </div>
      )}
    </div>
  );
}
