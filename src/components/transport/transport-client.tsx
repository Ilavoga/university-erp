"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Bus, MapPin, Users, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RouteStop {
  id: string;
  stopName: string;
  sequenceOrder: number;
}

interface Vehicle {
  id: string;
  plateNumber: string;
  capacity: number;
}

interface VehicleStatus {
  status: "LOADING" | "DEPARTED" | "EN_ROUTE";
  currentStopId: string | null;
}

interface RouteData {
  route: {
    id: string;
    name: string;
    startPoint: string;
    endPoint: string;
  };
  stops: RouteStop[];
  vehicles: Array<{
    vehicle: Vehicle;
    status?: VehicleStatus;
  }>;
  availableSeats: number;
}

interface Booking {
  id: string;
  vehicleId: string;
  status: string;
}

export default function TransportClient({ userId }: { userId?: string }) {
  const { toast } = useToast();
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingDialog, setBookingDialog] = useState<{
    open: boolean;
    vehicle?: Vehicle;
    route?: RouteData["route"];
    stops?: RouteStop[];
  }>({ open: false });
  const [selectedPickup, setSelectedPickup] = useState("");
  const [selectedDropoff, setSelectedDropoff] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    fetchRoutes();
    if (userId) {
      fetchMyBookings();
    }
  }, [userId]);

  async function fetchRoutes() {
    try {
      const response = await fetch("/api/transport/routes");
      if (response.ok) {
        const data = await response.json();
        setRoutes(data);
      }
    } catch (error) {
      console.error("Failed to fetch routes", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchMyBookings() {
    try {
      const response = await fetch(`/api/transport/bookings?studentId=${userId}`);
      if (response.ok) {
        const data: Booking[] = await response.json();
        setMyBookings(data.filter((b) => b.status === "CONFIRMED"));
      }
    } catch (error) {
      console.error("Failed to fetch bookings", error);
    }
  }

  function openBookingDialog(
    vehicle: Vehicle,
    route: RouteData["route"],
    stops: RouteStop[]
  ) {
    setBookingDialog({ open: true, vehicle, route, stops });
    setSelectedPickup("");
    setSelectedDropoff("");
  }

  async function handleBooking() {
    if (!bookingDialog.vehicle || !bookingDialog.route || !userId) return;

    setIsBooking(true);
    try {
      const response = await fetch("/api/transport/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: userId,
          vehicleId: bookingDialog.vehicle.id,
          routeId: bookingDialog.route.id,
          pickupStopId: selectedPickup || undefined,
          dropoffStopId: selectedDropoff || undefined,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Seat booked successfully!",
        });
        setBookingDialog({ open: false });
        fetchRoutes();
        fetchMyBookings();
      } else {
        const error = await response.json();
        toast({
          title: "Booking Failed",
          description: error.error || "Unable to book seat",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to book seat",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  }

  async function cancelBooking(bookingId: string) {
    try {
      const response = await fetch(`/api/transport/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Booking cancelled",
        });
        fetchMyBookings();
        fetchRoutes();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel booking",
        variant: "destructive",
      });
    }
  }

  function getStatusBadge(status?: string) {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      LOADING: "secondary",
      DEPARTED: "default",
      EN_ROUTE: "outline",
    };
    return (
      <Badge variant={variants[status || ""] || "outline"}>
        {status || "IDLE"}
      </Badge>
    );
  }

  function getCurrentStopName(
    stopId: string | null | undefined,
    stops: RouteStop[]
  ) {
    if (!stopId) return "Not Set";
    const stop = stops.find((s) => s.id === stopId);
    return stop?.stopName || "Unknown";
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transport</h1>
        <p className="text-muted-foreground">
          Book matatu rides and track live vehicle locations
        </p>
      </div>

      {myBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5" />
              My Active Bookings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {myBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">Booking #{booking.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">
                    Vehicle ID: {booking.vehicleId}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => cancelBooking(booking.id)}
                >
                  Cancel
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {routes.map((routeData) => (
          <Card key={routeData.route.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bus className="h-5 w-5" />
                    {routeData.route.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {routeData.route.startPoint} → {routeData.route.endPoint}
                  </p>
                </div>
                <Badge variant="secondary">
                  <Users className="h-3 w-3 mr-1" />
                  {routeData.availableSeats} seats
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Stops ({routeData.stops.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {routeData.stops.map((stop) => (
                    <Badge key={stop.id} variant="outline">
                      {stop.sequenceOrder}. {stop.stopName}
                    </Badge>
                  ))}
                </div>
              </div>

              {routeData.vehicles.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">
                    Available Vehicles ({routeData.vehicles.length})
                  </p>
                  <div className="space-y-2">
                    {routeData.vehicles.map(({ vehicle, status }) => {
                      const confirmedBookings = myBookings.filter(
                        (b) => b.vehicleId === vehicle.id
                      );
                      const hasBooking = confirmedBookings.length > 0;

                      return (
                        <div
                          key={vehicle.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {vehicle.plateNumber}
                              </span>
                              {getStatusBadge(status?.status)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              At: {getCurrentStopName(status?.currentStopId, routeData.stops)} • Capacity: {vehicle.capacity}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            disabled={hasBooking}
                            onClick={() =>
                              openBookingDialog(
                                vehicle,
                                routeData.route,
                                routeData.stops
                              )
                            }
                          >
                            {hasBooking ? "Booked" : "Book Seat"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {routeData.vehicles.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No vehicles assigned to this route
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={bookingDialog.open}
        onOpenChange={(open) => setBookingDialog({ open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Your Seat</DialogTitle>
            <DialogDescription>
              Booking for {bookingDialog.vehicle?.plateNumber} on{" "}
              {bookingDialog.route?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Pickup Stop (Optional)</label>
              <select
                className="w-full mt-1 p-2 border rounded-md"
                value={selectedPickup}
                onChange={(e) => setSelectedPickup(e.target.value)}
              >
                <option value="">Select pickup stop</option>
                {bookingDialog.stops?.map((stop) => (
                  <option key={stop.id} value={stop.id}>
                    {stop.stopName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Dropoff Stop (Optional)</label>
              <select
                className="w-full mt-1 p-2 border rounded-md"
                value={selectedDropoff}
                onChange={(e) => setSelectedDropoff(e.target.value)}
              >
                <option value="">Select dropoff stop</option>
                {bookingDialog.stops?.map((stop) => (
                  <option key={stop.id} value={stop.id}>
                    {stop.stopName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBookingDialog({ open: false })}
            >
              Cancel
            </Button>
            <Button onClick={handleBooking} disabled={isBooking}>
              {isBooking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                "Confirm Booking"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
