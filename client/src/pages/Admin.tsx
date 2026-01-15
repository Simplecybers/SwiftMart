import { useQuery, useMutation } from "@tanstack/react-query";
import { Task, Order, Product } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Circle, Clock, Package, ShoppingCart, Users, ClipboardList, Truck, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useUser } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function Admin() {
  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({ 
    queryKey: ["/api/tasks"] 
  });
  
  const { data: orders } = useQuery<Order[]>({ 
    queryKey: ["/api/orders"] 
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
    }
  });

  if (isUserLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  
  if (user?.role !== "admin") {
    return <Redirect to="/" />;
  }

  const { data: usersData } = useQuery<User[]>({ 
    queryKey: ["/api/admin/users"] 
  });

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
              <div className="text-2xl font-bold">{orders?.length || 0}</div>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
              <CardTitle className="text-sm font-medium">Platform Users</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usersData?.length || 0}</div>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
              <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
              <ClipboardList className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks?.filter(t => t.status !== "completed").length || 0}</div>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${orders?.reduce((acc, o) => acc + Number(o.totalAmount), 0).toFixed(0)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList className="bg-secondary/50 p-1 rounded-xl">
            <TabsTrigger value="orders" className="rounded-lg">Recent Orders</TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg">User Management</TabsTrigger>
            <TabsTrigger value="tasks" className="rounded-lg">System Tasks</TabsTrigger>
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
                      <tr key={u.id} className="border-b">
                        <td className="p-4">
                          <div className="font-bold">{u.name}</div>
                          <div className="text-xs text-muted-foreground">{u.username}</div>
                        </td>
                        <td className="p-4"><Badge variant="secondary">{u.role}</Badge></td>
                        <td className="p-4">
                          <Button variant="ghost" size="sm">Manage</Button>
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
                        <tr key={order.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="p-4 font-mono font-bold text-primary">#{order.id}</td>
                          <td className="p-4">
                            <Badge variant={order.status === 'awaiting_confirmation' ? 'secondary' : 'outline'} className="capitalize">
                              {order.status?.replace('_', ' ')}
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
                                    <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary underline">View Details</Button>
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
                            <div className="flex gap-2">
                              {order.status === 'awaiting_confirmation' && (
                                <Button 
                                  size="sm" 
                                  variant="default"
                                  onClick={() => updateOrderStatusMutation.mutate({ id: order.id, status: 'paid' })}
                                >
                                  Confirm
                                </Button>
                              )}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline">Update Ship</Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Update Shipment</DialogTitle>
                                  </DialogHeader>
                                  <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    updateTaskMutation.mutate({ id: order.id, status: 'shipped' });
                                  }} className="space-y-4 pt-4">
                                    <Input name="trackingNumber" placeholder="Tracking Number" required />
                                    <Input name="location" placeholder="Current Location" required />
                                    <Button type="submit" className="w-full">Update Tracking</Button>
                                  </form>
                                </DialogContent>
                              </Dialog>
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
                <Card key={task.id} className="p-4 hover:border-primary/50 transition-colors">
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
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
