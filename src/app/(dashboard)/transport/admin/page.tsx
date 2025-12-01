"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bus, MapPin, Plus, Trash, Edit } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Badge } from "@/components/ui/badge";

const routeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startPoint: z.string().min(1, "Start point is required"),
  endPoint: z.string().min(1, "End point is required"),
  stops: z.array(z.object({
    stopName: z.string().min(1, "Stop name is required"),
    sequenceOrder: z.number(),
  })).min(1, "At least one stop is required"),
});

const vehicleSchema = z.object({
  plateNumber: z.string().min(1, "Plate number is required"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  currentRouteId: z.string().optional(),
});

const statusSchema = z.object({
  status: z.enum(["LOADING", "DEPARTED", "EN_ROUTE"]),
  currentStopId: z.string().optional(),
});

export default function AdminTransportPage() {
  const { toast } = useToast();
  const [routes, setRoutes] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isCreateRouteOpen, setIsCreateRouteOpen] = useState(false);
  const [isCreateVehicleOpen, setIsCreateVehicleOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  const routeForm = useForm<z.infer<typeof routeSchema>>({
    resolver: zodResolver(routeSchema),
    defaultValues: { 
      name: "", 
      startPoint: "", 
      endPoint: "",
      stops: [{ stopName: "", sequenceOrder: 1 }],
    },
  });

  const vehicleForm = useForm<z.infer<typeof vehicleSchema>>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: { plateNumber: "", capacity: 33, currentRouteId: "" },
  });

  const statusForm = useForm<z.infer<typeof statusSchema>>({
    resolver: zodResolver(statusSchema),
    defaultValues: { status: "LOADING" },
  });

  useEffect(() => {
    fetchRoutes();
    fetchVehicles();
  }, []);

  async function fetchRoutes() {
    try {
      const response = await fetch("/api/transport/routes");
      if (response.ok) {
        const data = await response.json();
        setRoutes(data);
      }
    } catch (error) {
      console.error("Failed to fetch routes", error);
    }
  }

  async function fetchVehicles() {
    try {
      const response = await fetch("/api/transport/vehicles");
      if (response.ok) {
        const data = await response.json();
        setVehicles(data);
      }
    } catch (error) {
      console.error("Failed to fetch vehicles", error);
    }
  }

  async function onCreateRoute(data: z.infer<typeof routeSchema>) {
    try {
      const response = await fetch("/api/transport/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({ title: "Success", description: "Route created" });
        setIsCreateRouteOpen(false);
        routeForm.reset();
        fetchRoutes();
      } else {
        throw new Error("Failed to create route");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create route",
        variant: "destructive",
      });
    }
  }

  async function onCreateVehicle(data: z.infer<typeof vehicleSchema>) {
    try {
      const response = await fetch("/api/transport/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({ title: "Success", description: "Vehicle created" });
        setIsCreateVehicleOpen(false);
        vehicleForm.reset();
        fetchVehicles();
      } else {
        throw new Error("Failed to create vehicle");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create vehicle",
        variant: "destructive",
      });
    }
  }

  async function deleteRoute(id: string) {
    try {
      const response = await fetch(`/api/transport/routes/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({ title: "Success", description: "Route deleted" });
        fetchRoutes();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete route",
        variant: "destructive",
      });
    }
  }

  async function deleteVehicle(id: string) {
    try {
      const response = await fetch(`/api/transport/vehicles/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({ title: "Success", description: "Vehicle deleted" });
        fetchVehicles();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete vehicle",
        variant: "destructive",
      });
    }
  }

  async function onUpdateStatus(data: z.infer<typeof statusSchema>) {
    if (!selectedVehicle) return;

    try {
      const response = await fetch(
        `/api/transport/vehicle/${selectedVehicle.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        toast({ title: "Success", description: "Status updated" });
        setStatusDialogOpen(false);
        fetchRoutes();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  }

  function openStatusDialog(vehicle: any) {
    setSelectedVehicle(vehicle);
    setStatusDialogOpen(true);
    statusForm.reset({ status: "LOADING" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Transport Management
          </h1>
          <p className="text-muted-foreground">
            Manage routes, vehicles, and live status
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Routes
              </CardTitle>
              <Dialog
                open={isCreateRouteOpen}
                onOpenChange={setIsCreateRouteOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Route
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Route</DialogTitle>
                    <DialogDescription>
                      Add a new transport route
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...routeForm}>
                    <form
                      onSubmit={routeForm.handleSubmit(onCreateRoute)}
                      className="space-y-4"
                    >
                      <FormField
                        control={routeForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Route Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Town to Campus"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={routeForm.control}
                        name="startPoint"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Point</FormLabel>
                            <FormControl>
                              <Input placeholder="Town Center" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={routeForm.control}
                        name="endPoint"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Point</FormLabel>
                            <FormControl>
                              <Input placeholder="Campus Gate" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <FormLabel>Stops</FormLabel>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const stops = routeForm.getValues("stops");
                              routeForm.setValue("stops", [
                                ...stops,
                                { stopName: "", sequenceOrder: stops.length + 1 },
                              ]);
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Stop
                          </Button>
                        </div>
                        
                        {routeForm.watch("stops").map((_, index) => (
                          <div key={index} className="flex gap-2 items-start">
                            <div className="flex-1">
                              <FormField
                                control={routeForm.control}
                                name={`stops.${index}.stopName`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input 
                                        placeholder={`Stop ${index + 1}`} 
                                        {...field} 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            {routeForm.watch("stops").length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const stops = routeForm.getValues("stops");
                                  routeForm.setValue(
                                    "stops",
                                    stops
                                      .filter((_, i) => i !== index)
                                      .map((stop, i) => ({
                                        ...stop,
                                        sequenceOrder: i + 1,
                                      }))
                                  );
                                }}
                              >
                                <Trash className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <DialogFooter>
                        <Button type="submit">Create Route</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {routes.map((routeData) => (
              <div
                key={routeData.route.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{routeData.route.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {routeData.route.startPoint} → {routeData.route.endPoint}
                  </p>
                  <div className="flex gap-1 mt-1">
                    {routeData.stops.map((stop: any) => (
                      <Badge key={stop.id} variant="outline" className="text-xs">
                        {stop.stopName}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteRoute(routeData.route.id)}
                >
                  <Trash className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ))}
            {routes.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No routes created yet
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bus className="h-5 w-5" />
                Vehicles
              </CardTitle>
              <Dialog
                open={isCreateVehicleOpen}
                onOpenChange={setIsCreateVehicleOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Vehicle
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Vehicle</DialogTitle>
                    <DialogDescription>
                      Register a new vehicle
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...vehicleForm}>
                    <form
                      onSubmit={vehicleForm.handleSubmit(onCreateVehicle)}
                      className="space-y-4"
                    >
                      <FormField
                        control={vehicleForm.control}
                        name="plateNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Plate Number</FormLabel>
                            <FormControl>
                              <Input placeholder="KCB 123K" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={vehicleForm.control}
                        name="capacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Capacity</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={vehicleForm.control}
                        name="currentRouteId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assign to Route (Optional)</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select route" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {routes.map((r) => (
                                  <SelectItem
                                    key={r.route.id}
                                    value={r.route.id}
                                  >
                                    {r.route.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="submit">Add Vehicle</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {vehicles.map((vehicle) => {
              const route = routes.find(
                (r) => r.route.id === vehicle.currentRouteId
              );
              return (
                <div
                  key={vehicle.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{vehicle.plateNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      Capacity: {vehicle.capacity} •{" "}
                      {route ? route.route.name : "No route assigned"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openStatusDialog(vehicle)}
                      disabled={!vehicle.currentRouteId}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Status
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteVehicle(vehicle.id)}
                    >
                      <Trash className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {vehicles.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No vehicles registered yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Vehicle Status</DialogTitle>
            <DialogDescription>
              Update the current location and status for{" "}
              {selectedVehicle?.plateNumber}
            </DialogDescription>
          </DialogHeader>
          <Form {...statusForm}>
            <form
              onSubmit={statusForm.handleSubmit(onUpdateStatus)}
              className="space-y-4"
            >
              <FormField
                control={statusForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="LOADING">Loading</SelectItem>
                        <SelectItem value="DEPARTED">Departed</SelectItem>
                        <SelectItem value="EN_ROUTE">En Route</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={statusForm.control}
                name="currentStopId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Stop (Optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select stop" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {routes
                          .find(
                            (r) => r.route.id === selectedVehicle?.currentRouteId
                          )
                          ?.stops.map((stop: any) => (
                            <SelectItem key={stop.id} value={stop.id}>
                              {stop.stopName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Update Status</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
