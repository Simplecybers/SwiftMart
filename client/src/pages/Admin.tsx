import { useQuery, useMutation } from "@tanstack/react-query";
import { Task, Order, Product, User, Shipment } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Circle, Clock, Package, ShoppingCart, Users, ClipboardList, Truck, Loader2, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useUser } from "@/hooks/use-auth";
import { Redirect } from "wouter";

type OrderWithShipment = Order & { shipment?: Shipment };

export default function Admin() {
  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    enabled: user?.role === "admin",
  });

  const { data: orders } = useQuery<OrderWithShipment[]>({
    queryKey: ["/api/orders"],
    enabled: user?.role === "admin",
  });

  const { data: usersData } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: user?.role === "admin",
  });

  const { toast } = useToast();

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task updated" });
    }
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/orders/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Order status updated" });
    },
    onError: (err: any) => toast({ title: "Failed to update order", description: err.message, variant: "destructive" }),
  });

  const addTrackingLogMutation = useMutation({
    mutationFn: async ({ trackingNumber, status, location, note }: { trackingNumber: string; status: string; location: string; note?: string }) => {
      const res = await apiRequest("POST", `/api/tracking/${trackingNumber}/logs`, { status, location, note });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Tracking updated" });
    },
    onError: (err: any) => toast({ title: "Failed to update tracking", description: err.message, variant: "destructive" }),
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: number; role: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}/role`, { role });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User role updated" });
    },
    onError: (err: any) => toast({ title: "Failed to update role", description: err.message, variant: "destructive" }),
  });

  if (isUserLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  if (user?.role !== "admin") {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      <div className="container px-4 py-8">
        <h1 className="text-3xl font-display font-bold mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-orders">{orders?.length || 0}</div>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
              <CardTitle className="text-sm font-medium">Platform Users</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-users">{usersData?.length || 0}</div>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
              <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
              <ClipboardList className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-active-tasks">{tasks?.filter(t => t.status !== "completed").length || 0}</div>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-volume">
                ${(orders?.reduce((acc, o) => acc + Number(o.totalAmount), 0) ?? 0).toFixed(0)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList className="bg-secondary/50 p-1 rounded-xl">
            <TabsTrigger value="orders" className="rounded-lg" data-testid="tab-orders">Recent Orders</TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg" data-testid="tab-users">User Management</TabsTrigger>
            <TabsTrigger value="tasks" className="rounded-lg" data-testid="tab-tasks">System Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-4 text-left font-medium">User</th>
                      <th className="p-4 text-left font-medium">Role</th>
                      <th className="p-4 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersData?.map(u => (
                      <tr key={u.id} className="border-b" data-testid={`row-user-${u.id}`}>
                        <td className="p-4">
                          <div className="font-bold" data-testid={`text-username-${u.id}`}>{u.name}</div>
                          <div className="text-xs text-muted-foreground">{u.username}</div>
                        </td>
                        <td className="p-4"><Badge variant="secondary" className="capitalize" data-testid={`badge-role-${u.id}`}>{u.role}</Badge></td>
                        <td className="p-4">
                          <Select
                            value={u.role}
                            onValueChange={(role) => updateUserRoleMutation.mutate({ id: u.id, role })}
                            disabled={u.id === user.id}
                          >
                            <SelectTrigger className="w-36" data-testid={`select-role-${u.id}`}>
                              <SelectValue placeholder="Manage" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="customer">Customer</SelectItem>
                              <SelectItem value="vendor">Vendor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-4 text-left font-medium">Order ID</th>
                        <th className="p-4 text-left font-medium">Status</th>
                        <th className="p-4 text-left font-medium">Payment</th>
                        <th className="p-4 text-left font-medium">Total</th>
                        <th className="p-4 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders?.map((order) => (
                        <tr key={order.id} className="border-b hover:bg-muted/30 transition-colors" data-testid={`row-order-${order.id}`}>
                          <td className="p-4 font-mono font-bold text-primary">#{order.id}</td>
                          <td className="p-4">
                            <Badge variant={order.status === 'awaiting_confirmation' ? 'secondary' : 'outline'} className="capitalize" data-testid={`badge-order-status-${order.id}`}>
                              {order.status?.replace(/_/g, ' ')}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              <Badge className="capitalize bg-primary/10 text-primary border-none w-fit">
                                {order.paymentMethod?.replace('_', ' ')}
                              </Badge>
                              {order.paymentDetails && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary underline" data-testid={`button-view-payment-${order.id}`}>View Details</Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-md">
                                    <DialogHeader>
                                      <DialogTitle>Payment Verification - #{order.id}</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                      {(() => {
                                        try {
                                          const details = JSON.parse(order.paymentDetails);
                                          return (
                                            <div className="grid gap-3 text-sm">
                                              {Object.entries(details).map(([key, value]) => {
                                                if (key.toLowerCase().includes('url')) return null;
                                                return (
                                                  <div key={key} className="flex flex-col gap-1 border-b pb-2">
                                                    <span className="font-bold uppercase text-[10px] text-muted-foreground">{key.replace(/([A-Z])/g, ' $1')}</span>
                                                    <span className="break-all">{String(value)}</span>
                                                  </div>
                                                );
                                              })}
                                              {details.proofUrl && (
                                                <div className="pt-2">
                                                  <p className="font-bold uppercase text-[10px] text-muted-foreground mb-2">Proof Attachment</p>
                                                  <a href={details.proofUrl} target="_blank" rel="noreferrer">
                                                    <img src={details.proofUrl} alt="Proof" className="w-full h-auto rounded-lg border hover:opacity-90 transition-opacity" />
                                                  </a>
                                                </div>
                                              )}
                                              {details.cardImageUrl && (
                                                <div className="pt-2">
                                                  <p className="font-bold uppercase text-[10px] text-muted-foreground mb-2">Card Image</p>
                                                  <a href={details.cardImageUrl} target="_blank" rel="noreferrer">
                                                    <img src={details.cardImageUrl} alt="Card" className="w-full h-auto rounded-lg border hover:opacity-90 transition-opacity" />
                                                  </a>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        } catch (e) {
                                          return <p className="text-xs break-all bg-muted p-2 rounded">{order.paymentDetails}</p>;
                                        }
                                      })()}
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          </td>
                          <td className="p-4 font-bold">${Number(order.totalAmount).toFixed(2)}</td>
                          <td className="p-4">
                            <div className="flex gap-2 flex-wrap">
                              {order.status === 'awaiting_confirmation' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    data-testid={`button-confirm-${order.id}`}
                                    onClick={() => updateOrderStatusMutation.mutate({ id: order.id, status: 'paid' })}
                                  >
                                    Confirm
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-destructive hover:bg-destructive/10"
                                    data-testid={`button-reject-${order.id}`}
                                    onClick={() => updateOrderStatusMutation.mutate({ id: order.id, status: 'cancelled' })}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              {(order.status === 'paid' || order.status === 'shipped') && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" data-testid={`button-update-ship-${order.id}`}>
                                      <Truck className="h-4 w-4 mr-1" />
                                      Update Ship
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Update Shipment - #{order.id}</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={(e) => {
                                      e.preventDefault();
                                      const formData = new FormData(e.currentTarget);
                                      const status = String(formData.get("status"));
                                      const location = String(formData.get("location"));
                                      const note = String(formData.get("note") || "");
                                      if (order.shipment?.trackingNumber) {
                                        addTrackingLogMutation.mutate({
                                          trackingNumber: order.shipment.trackingNumber,
                                          status,
                                          location,
                                          note,
                                        });
                                      }
                                      const newOrderStatus = status === 'delivered' ? 'completed' : status === 'shipped' || status === 'in_transit' || status === 'out_for_delivery' ? 'shipped' : order.status;
                                      if (newOrderStatus !== order.status) {
                                        updateOrderStatusMutation.mutate({ id: order.id, status: newOrderStatus! });
                                      }
                                    }} className="space-y-4 pt-4">
                                      <div className="space-y-2">
                                        <Label>Tracking Number</Label>
                                        <Input value={order.shipment?.trackingNumber || "N/A"} disabled className="font-mono" />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`status-${order.id}`}>Shipment Status</Label>
                                        <Select name="status" defaultValue="processing">
                                          <SelectTrigger id={`status-${order.id}`} data-testid={`select-ship-status-${order.id}`}>
                                            <SelectValue />
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
                                      <Input name="location" placeholder="Current Location" required data-testid={`input-location-${order.id}`} />
                                      <Input name="note" placeholder="Note (optional)" data-testid={`input-note-${order.id}`} />
                                      <Button type="submit" className="w-full" data-testid={`button-submit-ship-${order.id}`}>Update Tracking</Button>
                                    </form>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <div className="grid gap-4">
              {tasks?.map((task) => (
                <Card key={task.id} className="p-4 hover:border-primary/50 transition-colors" data-testid={`card-task-${task.id}`}>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {task.status === "completed" ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : task.status === "in_progress" ? (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold">{task.title}</h3>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={task.priority === "high" ? "destructive" : "secondary"}>
                        {task.priority}
                      </Badge>
                      {task.status !== "completed" && (
                        <Button
                          size="sm"
                          data-testid={`button-task-action-${task.id}`}
                          onClick={() => updateTaskMutation.mutate({
                            id: task.id,
                            status: task.status === "todo" ? "in_progress" : "completed"
                          })}
                        >
                          {task.status === "todo" ? "Start" : "Complete"}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
              {tasks?.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No tasks yet.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
