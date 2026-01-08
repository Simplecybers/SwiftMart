import { useUser } from "@/hooks/use-auth";
import { useOrders } from "@/hooks/use-orders";
import { useUpdateTracking } from "@/hooks/use-tracking";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Truck, Package } from "lucide-react";

export default function Admin() {
  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: orders, isLoading: isOrdersLoading } = useOrders();
  const { mutate: updateTracking, isPending: isUpdating } = useUpdateTracking();
  const { toast } = useToast();
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  if (isUserLoading || isOrdersLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  
  if (user?.role !== "admin") {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p>You need admin privileges to view this page.</p>
        <Button onClick={() => window.location.href = "/"}>Go Home</Button>
      </div>
    );
  }

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    // Check if we have shipment details on the order object.
    // In a real app we might fetch this specifically or ensure type safety better.
    // For now we assume orders list returns limited data and we might need to be careful.
    // But let's assume the mock or backend returns a shipment object on the order if it exists.
    
    // NOTE: In the API schema, GET /orders list response usually just returns order fields.
    // But for admin dashboard we probably want orders with shipment info. 
    // Assuming the backend returns shipment info for admins or we'd fetch it separately.
    // Since I can't change backend now, I'll rely on what's available or mock the interaction for the UI.
    
    // For this demo, let's assume we have a tracking number input manually or derived.
    const trackingNumber = formData.get("trackingNumber") as string;
    const status = formData.get("status") as any;
    const location = formData.get("location") as string;
    const note = formData.get("note") as string;

    updateTracking({
      trackingNumber,
      status,
      location,
      note
    }, {
      onSuccess: () => {
        toast({ title: "Tracking updated successfully" });
        setSelectedOrder(null);
      },
      onError: (err) => {
        toast({ title: "Failed to update", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen bg-secondary/30 pb-12">
      <Navbar />
      
      <div className="container px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders?.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono font-medium">#{order.id}</TableCell>
                      <TableCell>{new Date(order.createdAt!).toLocaleDateString()}</TableCell>
                      <TableCell>${Number(order.totalAmount).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>
                              <Truck className="h-4 w-4 mr-2" />
                              Update Tracking
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Update Shipment Status</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleUpdateStatus} className="space-y-4">
                              <div className="space-y-2">
                                <Label>Tracking Number</Label>
                                {/* In a real app, this would be pre-filled if shipment exists */}
                                <Input name="trackingNumber" placeholder="Enter tracking number" required />
                              </div>
                              <div className="space-y-2">
                                <Label>New Status</Label>
                                <Select name="status" required>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="processing">Processing</SelectItem>
                                    <SelectItem value="shipped">Shipped</SelectItem>
                                    <SelectItem value="in_transit">In Transit</SelectItem>
                                    <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                                    <SelectItem value="delivered">Delivered</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Current Location</Label>
                                <Input name="location" placeholder="City, State" required />
                              </div>
                              <div className="space-y-2">
                                <Label>Note (Optional)</Label>
                                <Input name="note" placeholder="e.g. Arrived at sort facility" />
                              </div>
                              <Button type="submit" className="w-full" disabled={isUpdating}>
                                {isUpdating ? "Updating..." : "Update Status"}
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
