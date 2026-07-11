import { useQuery, useMutation } from "@tanstack/react-query";
import { Task, Order, Product, User, Shipment } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2, Circle, Clock, Package, ShoppingCart, Users, ClipboardList,
  Truck, Loader2, XCircle, TrendingUp, DollarSign, AlertTriangle, Plus,
  Pencil, Trash2, Search, BarChart3, Store, ChevronDown, RefreshCw
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState, useMemo } from "react";
import { useUser } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { cn } from "@/lib/utils";

type OrderWithItems = Order & { items: any[]; shipment?: Shipment };

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  awaiting_confirmation: "bg-orange-100 text-orange-700",
  paid: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const PIE_COLORS = ["#22c55e", "#3b82f6", "#f97316", "#a855f7", "#ef4444", "#eab308"];

export default function Admin() {
  const { data: user, isLoading: isUserLoading } = useUser();
  const { toast } = useToast();

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    enabled: user?.role === "admin",
  });
  const { data: orders, isLoading: ordersLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders"],
    enabled: user?.role === "admin",
  });
  const { data: usersData, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: user?.role === "admin",
  });
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: user?.role === "admin",
  });

  const [orderSearch, setOrderSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "medium" });

  // Analytics
  const analytics = useMemo(() => {
    if (!orders) return { totalRevenue: 0, byStatus: {}, recentRevenue: [] };
    const totalRevenue = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
    const byStatus: Record<string, number> = {};
    orders.forEach(o => { byStatus[o.status] = (byStatus[o.status] || 0) + 1; });

    // Group orders by date for chart
    const byDay: Record<string, number> = {};
    orders.forEach(o => {
      if (o.createdAt) {
        const day = format(new Date(o.createdAt), "MMM d");
        byDay[day] = (byDay[day] || 0) + Number(o.totalAmount);
      }
    });
    const recentRevenue = Object.entries(byDay).slice(-7).map(([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 }));
    return { totalRevenue, byStatus, recentRevenue };
  }, [orders]);

  const pieData = useMemo(() => {
    return Object.entries(analytics.byStatus).map(([status, count]) => ({
      name: status.replace(/_/g, " "),
      value: count,
    }));
  }, [analytics.byStatus]);

  const lowStockProducts = useMemo(() => products?.filter(p => p.stock < 10) || [], [products]);
  const vendors = useMemo(() => usersData?.filter(u => u.role === "vendor") || [], [usersData]);

  // Mutations
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${id}`, { status });
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/tasks"] }); toast({ title: "Task updated" }); }
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/tasks`, { ...data, userId: user?.id });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task created" });
      setTaskDialogOpen(false);
      setTaskForm({ title: "", description: "", priority: "medium" });
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/tasks/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/tasks"] }); toast({ title: "Task deleted" }); }
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/orders/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/orders"] }); toast({ title: "Order updated" }); },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const addTrackingLogMutation = useMutation({
    mutationFn: async ({ trackingNumber, status, location, note }: any) => {
      const res = await apiRequest("POST", `/api/tracking/${trackingNumber}/logs`, { status, location, note });
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/orders"] }); toast({ title: "Tracking updated" }); },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: number; role: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}/role`, { role });
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }); toast({ title: "Role updated" }); },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/admin/users/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }); toast({ title: "User removed" }); },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/products/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/products"] }); toast({ title: "Product deleted" }); },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  if (isUserLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (user?.role !== "admin") return <Redirect to="/" />;

  const filteredOrders = orders?.filter(o =>
    orderSearch === "" || String(o.id).includes(orderSearch) || o.status.includes(orderSearch.toLowerCase()) || o.paymentMethod?.includes(orderSearch.toLowerCase())
  ) || [];

  const filteredUsers = usersData?.filter(u =>
    userSearch === "" || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.username.toLowerCase().includes(userSearch.toLowerCase())
  ) || [];

  const filteredProducts = products?.filter(p =>
    productSearch === "" || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.category.toLowerCase().includes(productSearch.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Navbar />
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Manage your Temu Lite platform</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { queryClient.invalidateQueries(); toast({ title: "Refreshed" }); }}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <ShoppingCart className="h-5 w-5 opacity-80" />
                <span className="text-xs opacity-70">Total</span>
              </div>
              <div className="text-2xl font-black">{orders?.length || 0}</div>
              <div className="text-xs opacity-80 mt-1">Orders</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-5 w-5 opacity-80" />
                <span className="text-xs opacity-70">Total</span>
              </div>
              <div className="text-2xl font-black">${(analytics.totalRevenue ?? 0).toFixed(0)}</div>
              <div className="text-xs opacity-80 mt-1">Revenue</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 opacity-80" />
                <span className="text-xs opacity-70">Total</span>
              </div>
              <div className="text-2xl font-black">{usersData?.length || 0}</div>
              <div className="text-xs opacity-80 mt-1">Users</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Package className="h-5 w-5 opacity-80" />
                <span className="text-xs opacity-70">Listed</span>
              </div>
              <div className="text-2xl font-black">{products?.length || 0}</div>
              <div className="text-xs opacity-80 mt-1">Products</div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {lowStockProducts.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
            <span className="text-sm text-red-700 font-medium">
              {lowStockProducts.length} product{lowStockProducts.length > 1 ? "s" : ""} with low stock (under 10 units): {lowStockProducts.map(p => p.name).join(", ")}
            </span>
          </div>
        )}
        {orders?.filter(o => o.status === "awaiting_confirmation").length > 0 && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
            <span className="text-sm text-orange-700 font-medium">
              {orders.filter(o => o.status === "awaiting_confirmation").length} orders awaiting payment confirmation
            </span>
          </div>
        )}

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-white border border-gray-200 p-1 rounded-xl flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="rounded-lg text-xs">📊 Overview</TabsTrigger>
            <TabsTrigger value="orders" className="rounded-lg text-xs">🛒 Orders ({orders?.length || 0})</TabsTrigger>
            <TabsTrigger value="products" className="rounded-lg text-xs">📦 Products ({products?.length || 0})</TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg text-xs">👥 Users ({usersData?.length || 0})</TabsTrigger>
            <TabsTrigger value="vendors" className="rounded-lg text-xs">🏪 Vendors ({vendors.length})</TabsTrigger>
            <TabsTrigger value="tasks" className="rounded-lg text-xs">📋 Tasks</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Revenue chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" /> Revenue by Day
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.recentRevenue.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={analytics.recentRevenue}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                        <Tooltip formatter={(v: any) => [`$${v}`, "Revenue"]} />
                        <Bar dataKey="amount" fill="#fa5100" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No revenue data yet</div>
                  )}
                </CardContent>
              </Card>

              {/* Order status pie */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" /> Orders by Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={9}>
                          {pieData.map((_, index) => (
                            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No order data yet</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Pending Confirmation", value: orders?.filter(o => o.status === "awaiting_confirmation").length || 0, color: "text-orange-600" },
                { label: "Shipped Orders", value: orders?.filter(o => o.status === "shipped").length || 0, color: "text-purple-600" },
                { label: "Completed Orders", value: orders?.filter(o => o.status === "completed").length || 0, color: "text-green-600" },
                { label: "Cancelled Orders", value: orders?.filter(o => o.status === "cancelled").length || 0, color: "text-red-600" },
              ].map(stat => (
                <Card key={stat.label}>
                  <CardContent className="p-4 text-center">
                    <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent orders preview */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Recent Orders</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {orders?.slice(0, 5).map(order => (
                    <div key={order.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <span className="font-mono font-bold text-primary text-sm">#{order.id}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {order.createdAt && format(new Date(order.createdAt), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", STATUS_COLORS[order.status])}>
                          {order.status.replace(/_/g, " ")}
                        </span>
                        <span className="text-sm font-bold">${Number(order.totalAmount).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                  {(!orders || orders.length === 0) && (
                    <div className="py-8 text-center text-gray-400 text-sm">No orders yet</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ORDERS TAB */}
          <TabsContent value="orders">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-sm">Order Management</CardTitle>
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input className="pl-8 h-8 text-xs w-48" placeholder="Search orders..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="p-3 text-left font-semibold">Order</th>
                        <th className="p-3 text-left font-semibold">Date</th>
                        <th className="p-3 text-left font-semibold">Status</th>
                        <th className="p-3 text-left font-semibold">Payment</th>
                        <th className="p-3 text-left font-semibold">Total</th>
                        <th className="p-3 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="p-3 font-mono font-bold text-primary">#{order.id}</td>
                          <td className="p-3 text-gray-500">
                            {order.createdAt && format(new Date(order.createdAt), "MMM d, yyyy")}
                          </td>
                          <td className="p-3">
                            <span className={cn("px-2 py-0.5 rounded-full font-medium capitalize", STATUS_COLORS[order.status])}>
                              {order.status?.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1">
                              <span className="capitalize bg-gray-100 px-2 py-0.5 rounded-full w-fit">
                                {order.paymentMethod?.replace(/_/g, " ")}
                              </span>
                              {order.paymentDetails && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary">View proof</Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-md">
                                    <DialogHeader><DialogTitle>Payment Details — #{order.id}</DialogTitle></DialogHeader>
                                    <div className="space-y-3 py-2">
                                      {(() => {
                                        try {
                                          const d = JSON.parse(order.paymentDetails);
                                          return (
                                            <div className="grid gap-2 text-sm">
                                              {Object.entries(d).map(([k, v]) => {
                                                if (k.toLowerCase().includes("url") || k.toLowerCase().includes("image")) return null;
                                                return (
                                                  <div key={k} className="flex flex-col gap-0.5 border-b pb-2">
                                                    <span className="text-[10px] font-bold uppercase text-gray-400">{k.replace(/([A-Z])/g, " $1")}</span>
                                                    <span className="break-all font-mono text-xs">{String(v)}</span>
                                                  </div>
                                                );
                                              })}
                                              {(d.proofUrl || d.cardImageUrl) && (
                                                <div>
                                                  <p className="text-xs font-bold uppercase text-gray-400 mb-2">Proof Image</p>
                                                  <a href={d.proofUrl || d.cardImageUrl} target="_blank" rel="noreferrer">
                                                    <img src={d.proofUrl || d.cardImageUrl} alt="Proof" className="w-full rounded-lg border" />
                                                  </a>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        } catch { return <pre className="text-xs break-all bg-gray-50 p-2 rounded">{order.paymentDetails}</pre>; }
                                      })()}
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          </td>
                          <td className="p-3 font-bold">${Number(order.totalAmount).toFixed(2)}</td>
                          <td className="p-3">
                            <div className="flex gap-1.5 flex-wrap">
                              {order.status === "awaiting_confirmation" && (
                                <>
                                  <Button size="sm" className="h-7 text-xs bg-green-500 hover:bg-green-600"
                                    onClick={() => updateOrderStatusMutation.mutate({ id: order.id, status: "paid" })}>
                                    ✓ Confirm
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-7 text-xs text-destructive"
                                    onClick={() => updateOrderStatusMutation.mutate({ id: order.id, status: "cancelled" })}>
                                    ✗ Reject
                                  </Button>
                                </>
                              )}
                              {(order.status === "paid" || order.status === "shipped") && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="h-7 text-xs">
                                      <Truck className="h-3 w-3 mr-1" /> Shipment
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader><DialogTitle>Update Shipment — #{order.id}</DialogTitle></DialogHeader>
                                    <form onSubmit={(e) => {
                                      e.preventDefault();
                                      const fd = new FormData(e.currentTarget);
                                      const status = String(fd.get("status"));
                                      const location = String(fd.get("location"));
                                      const note = String(fd.get("note") || "");
                                      if (order.shipment?.trackingNumber) {
                                        addTrackingLogMutation.mutate({ trackingNumber: order.shipment.trackingNumber, status, location, note });
                                      }
                                      const newStatus = status === "delivered" ? "completed" : ["shipped", "in_transit", "out_for_delivery"].includes(status) ? "shipped" : order.status;
                                      if (newStatus !== order.status) updateOrderStatusMutation.mutate({ id: order.id, status: newStatus });
                                    }} className="space-y-4 pt-4">
                                      <div>
                                        <Label className="text-xs">Tracking #</Label>
                                        <Input value={order.shipment?.trackingNumber || "N/A"} disabled className="font-mono text-xs mt-1" />
                                      </div>
                                      <div>
                                        <Label className="text-xs">Shipment Status</Label>
                                        <Select name="status" defaultValue="processing">
                                          <SelectTrigger className="mt-1">
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
                                      <Input name="location" placeholder="Current Location (e.g. NY Distribution Center)" required className="text-xs" />
                                      <Input name="note" placeholder="Note (optional)" className="text-xs" />
                                      <Button type="submit" className="w-full">Update Shipment</Button>
                                    </form>
                                  </DialogContent>
                                </Dialog>
                              )}
                              {order.status === "completed" && (
                                <span className="text-xs text-green-600 font-medium">✓ Delivered</span>
                              )}
                              {order.status === "cancelled" && (
                                <span className="text-xs text-red-500 font-medium">✗ Cancelled</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredOrders.length === 0 && (
                        <tr><td colSpan={6} className="text-center py-8 text-gray-400">No orders found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PRODUCTS TAB */}
          <TabsContent value="products">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-sm">All Products ({products?.length || 0})</CardTitle>
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input className="pl-8 h-8 text-xs w-48" placeholder="Search products..." value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="p-3 text-left font-semibold">Product</th>
                        <th className="p-3 text-left font-semibold">Category</th>
                        <th className="p-3 text-left font-semibold">Price</th>
                        <th className="p-3 text-left font-semibold">Stock</th>
                        <th className="p-3 text-left font-semibold">Vendor ID</th>
                        <th className="p-3 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <img src={product.imageUrl} alt="" className="w-8 h-8 rounded object-cover border" />
                              <span className="font-medium max-w-[180px] truncate">{product.name}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="bg-gray-100 px-2 py-0.5 rounded-full">{product.category}</span>
                          </td>
                          <td className="p-3 font-bold text-primary">${Number(product.price).toFixed(2)}</td>
                          <td className="p-3">
                            <span className={cn("font-medium", product.stock < 10 ? "text-red-600" : "text-green-700")}>
                              {product.stock} {product.stock < 10 && "⚠️"}
                            </span>
                          </td>
                          <td className="p-3 text-gray-500">#{product.vendorId}</td>
                          <td className="p-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-destructive"
                              onClick={() => {
                                if (confirm(`Delete "${product.name}"?`)) deleteProductMutation.mutate(product.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {filteredProducts.length === 0 && (
                        <tr><td colSpan={6} className="text-center py-8 text-gray-400">No products found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* USERS TAB */}
          <TabsContent value="users">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-sm">User Management ({usersData?.length || 0})</CardTitle>
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input className="pl-8 h-8 text-xs w-48" placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="p-3 text-left font-semibold">ID</th>
                      <th className="p-3 text-left font-semibold">User</th>
                      <th className="p-3 text-left font-semibold">Role</th>
                      <th className="p-3 text-left font-semibold">Change Role</th>
                      <th className="p-3 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-gray-400 font-mono">#{u.id}</td>
                        <td className="p-3">
                          <div className="font-semibold">{u.name}</div>
                          <div className="text-gray-400">@{u.username}</div>
                        </td>
                        <td className="p-3">
                          <span className={cn("px-2 py-0.5 rounded-full font-medium capitalize text-xs",
                            u.role === "admin" ? "bg-red-100 text-red-700" :
                            u.role === "vendor" ? "bg-purple-100 text-purple-700" :
                            "bg-green-100 text-green-700"
                          )}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3">
                          <Select
                            value={u.role}
                            onValueChange={(role) => updateUserRoleMutation.mutate({ id: u.id, role })}
                            disabled={u.id === user?.id}
                          >
                            <SelectTrigger className="w-28 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="customer">Customer</SelectItem>
                              <SelectItem value="vendor">Vendor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-3">
                          {u.id !== user?.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-destructive"
                              onClick={() => { if (confirm(`Remove user "${u.name}"?`)) deleteUserMutation.mutate(u.id); }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr><td colSpan={5} className="text-center py-8 text-gray-400">No users found</td></tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* VENDORS TAB */}
          <TabsContent value="vendors">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Vendor Management ({vendors.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {vendors.map(vendor => {
                    const vendorProducts = products?.filter(p => p.vendorId === vendor.id) || [];
                    const vendorOrders = orders?.filter(o => o.items?.some((item: any) => vendorProducts.map(p => p.id).includes(item.productId))) || [];
                    const vendorRevenue = vendorOrders.reduce((s, o) => s + Number(o.totalAmount), 0);
                    return (
                      <div key={vendor.id} className="px-4 py-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {vendor.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{vendor.name}</p>
                              <p className="text-xs text-gray-400">@{vendor.username}</p>
                            </div>
                          </div>
                          <div className="flex gap-6 text-xs text-center">
                            <div>
                              <div className="font-black text-primary text-lg">{vendorProducts.length}</div>
                              <div className="text-gray-400">Products</div>
                            </div>
                            <div>
                              <div className="font-black text-purple-600 text-lg">{vendorOrders.length}</div>
                              <div className="text-gray-400">Orders</div>
                            </div>
                            <div>
                              <div className="font-black text-green-600 text-lg">${vendorRevenue.toFixed(0)}</div>
                              <div className="text-gray-400">Revenue</div>
                            </div>
                          </div>
                        </div>
                        {vendorProducts.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {vendorProducts.slice(0, 5).map(p => (
                              <span key={p.id} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-[120px]">{p.name}</span>
                            ))}
                            {vendorProducts.length > 5 && (
                              <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">+{vendorProducts.length - 5} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {vendors.length === 0 && (
                    <div className="py-8 text-center text-gray-400 text-sm">No vendors yet</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TASKS TAB */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">{tasks?.filter(t => t.status !== "completed").length || 0} active tasks</p>
              <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-2" /> New Task</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label className="text-xs font-semibold">Title</Label>
                      <Input className="mt-1" value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} placeholder="Task title..." />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Description</Label>
                      <Textarea className="mt-1" value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} placeholder="Task description..." />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Priority</Label>
                      <Select value={taskForm.priority} onValueChange={v => setTaskForm(p => ({ ...p, priority: v }))}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      className="w-full"
                      disabled={!taskForm.title || createTaskMutation.isPending}
                      onClick={() => createTaskMutation.mutate(taskForm)}
                    >
                      {createTaskMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Create Task"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid gap-3">
              {tasks?.map((task) => (
                <Card key={task.id} className={cn("p-4", task.status === "completed" && "opacity-60")}>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {task.status === "completed" ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : task.status === "in_progress" ? (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h3 className={cn("font-semibold text-sm", task.status === "completed" && "line-through text-gray-400")}>{task.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "secondary" : "outline"} className="text-xs">
                        {task.priority}
                      </Badge>
                      {task.status !== "completed" && (
                        <Button size="sm" className="h-7 text-xs"
                          onClick={() => updateTaskMutation.mutate({ id: task.id, status: task.status === "todo" ? "in_progress" : "completed" })}>
                          {task.status === "todo" ? "Start" : "Complete"}
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-destructive"
                        onClick={() => deleteTaskMutation.mutate(task.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              {(!tasks || tasks.length === 0) && (
                <div className="text-center text-gray-400 py-8 text-sm">No tasks yet. Create one to get started.</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
