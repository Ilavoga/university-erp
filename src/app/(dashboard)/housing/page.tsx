import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Building, Home, LayoutDashboard, Shield } from "lucide-react";
import { auth } from "@/auth";

export default async function HousingPage() {
  const session = await auth();
  const isLandlord = session?.user?.role === "LANDLORD";
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Housing Services</h1>
        <p className="text-muted-foreground">
          Manage your accommodation on and off campus.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-6 w-6" />
              On-Campus Hostels
            </CardTitle>
            <CardDescription>
              Apply for university hostels, view room availability, and manage your bookings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/housing/internal">Browse Hostels</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-6 w-6" />
              Off-Campus Listings
            </CardTitle>
            <CardDescription>
              Find verified private accommodation, apartments, and rooms near the campus.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/housing/external">Browse Listings</Link>
            </Button>
          </CardContent>
        </Card>

        {isLandlord && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutDashboard className="h-6 w-6" />
                Landlord Dashboard
              </CardTitle>
              <CardDescription>
                Manage your listings, view inquiries, and update availability.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/housing/landlord">Go to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {isAdmin && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6" />
                Admin Housing Control
              </CardTitle>
              <CardDescription>
                Manage hostels, verify landlords, and oversee all bookings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="destructive" className="w-full">
                <Link href="/housing/admin">Access Admin Panel</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
