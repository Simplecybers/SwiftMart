import { useQuery, useMutation } from "@tanstack/react-query";
import { Product, Order, Shipment } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ImageUpload";
import {
  Package, ShoppingCart, DollarSign, AlertTriangle, Plus, Pencil, Trash2,
  Truck, CheckCircle2, XCircle, Loader2, BarChart3, TrendingUp, Star, Store, RefreshCw
} from "lucide-react";
import { useState, useMemo } from "react";
import { useUser } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

type OrderWithItems = Order & { items: any[]; shipment?: Shipment };

const CATEGORIES = ["Electronics", "Fashion", "Home", "Beauty", "Sports", "Toys", "Auto", "Books", "Other"];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  awaiting_confirmation: "bg-orange-100 text-orange-700",
  paid: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  stock: "",
  category: "Electronics",
  imageUrl: "",
};

export default function VendorDashboard() {
  const { data: user, isLoading: userLoading } = useUser();
  const { toast } = useToast();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState(EMPTY_FORM);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [shipDialogOpen, setShipDialogOpen] = useState<number | null>(null);

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/vendor/products"],
    enabled: user?.role === "vendor" || user?.role === "admin",
  });

  const { data: orders, isLoading: ordersLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders"],
    enabled: user?.role === "vendor" || user?.role === "admin",
  });

  const analytics = useMemo(() => {
    if (!orders || !products) return { totalRevenue: 0, ordersCount: 0, avgOrder: 0, byDay: [] };
    const totalRevenue = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
    const byDay: Record<string, number> = {};
    orders.forEach(o => {
      if (o.createdAt) {
        const day = format(new Date(o.createdAt), "MMM d");
        byDay[day] = (byDay[day] || 0) + Number(o.totalAmount);
      }
    });
    return {
      totalRevenue,
      ordersCount: orders.length,
      avgOrder: orders.length ? totalRevenue / orders.length : 0,
      byDay: Object.entries(byDay).slice(-7).map(([date, revenue]) => ({ date, revenue: Math.round(revenue * 100) / 100 })),
    };
  }, [orders, products]);

  const lowStockProducts = useMemo(() => products?.filter(p => p.stock < 10) || [], [products]);
  const outOfStock = useMemo(() => products?.filter(p => p.stock === 0) || [], [products]);

  const openCreate = () => {
    setEditingProduct(null);
    setProductForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      category: product.category,
      imageUrl: product.imageUrl,
    });
    setDialogOpen(true);
  };

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/products", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product created!" });
      setDialogOpen(false);
      setProductForm(EMPTY_FORM);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/products/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product updated!" });
      setDialogOpen(false);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/products/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product deleted" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
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
    mutationFn: async ({ trackingNumber, ...data }: any) => {
      const res = await apiRequest("POST", `/api/tracking/${trackingNumber}/logs`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Tracking updated" });
      setShipDialogOpen(null);
    },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...productForm, price: productForm.price, stock: Number(productForm.stock) };
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: payload });
    } else {
      createProductMutation.mutate(payload);
    }
  };

  if (userLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  if (user?.role !== "vendor" && user?.role !== "admin") return <Redirect to="/" />;

  const isPending = createProductMutation.isPending || updateProductMutation.isPending;

  // Product dialog (shared for create + edit)
  const ProductDialog = (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label className="text-xs font-semibold">Product Name *</Label>
              <Input
                className="mt-1"
                value={productForm.name}
                onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Wireless Bluetooth Earbuds"
                required
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs font-semibold">Description *</Label>
              <Textarea
                className="mt-1"
                value={productForm.description}
                onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Describe your product in detail..."
                rows={3}
                required
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Price (USD) *</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <Input
                  className="pl-7"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={productForm.price}
                  onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold">Stock Quantity *</Label>
              <Input
                className="mt-1"
                type="number"
                min="0"
                value={productForm.stock}
                onChange={e => setProductForm(p => ({ ...p, stock: e.target.value }))}
                placeholder="0"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Category *</Label>
              <Select value={productForm.category} onValueChange={v => setProductForm(p => ({ ...p, category: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <ImageUpload
                value={productForm.imageUrl}
                onChange={url => setProductForm(p => ({ ...p, imageUrl: url }))}
                label="Product Image"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin h-4 w-4" /> : editingProduct ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Navbar />
      {ProductDialog}

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Store className="h-6 w-6 text-primary" /> Vendor Dashboard
            </h1>
            <p className="text-sm text-gray-500">Welcome back, {user?.name}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { queryClient.invalidateQueries(); toast({ title: "Refreshed" }); }}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
            <CardContent className="p-4">
              <DollarSign className="h-5 w-5 opacity-80 mb-2" />
              <div className="text-2xl font-black">${(analytics.totalRevenue ?? 0).toFixed(0)}</div>
              <div className="text-xs opacity-80 mt-1">Total Revenue</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4">
              <ShoppingCart className="h-5 w-5 opacity-80 mb-2" />
              <div className="text-2xl font-black">{analytics.ordersCount}</div>
              <div className="text-xs opacity-80 mt-1">Total Orders</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-4">
              <Package className="h-5 w-5 opacity-80 mb-2" />
              <div className="text-2xl font-black">{products?.length || 0}</div>
              <div className="text-xs opacity-80 mt-1">Products Listed</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-4">
              <TrendingUp className="h-5 w-5 opacity-80 mb-2" />
              <div className="text-2xl font-black">${(analytics.avgOrder ?? 0).toFixed(0)}</div>
              <div className="text-xs opacity-80 mt-1">Avg. Order Value</div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {outOfStock.length > 0 && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
            <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <span className="text-sm text-red-700">
              <span className="font-bold">Out of stock: </span>
              {outOfStock.map(p => p.name).join(", ")}
            </span>
          </div>
        )}
        {lowStockProducts.filter(p => p.stock > 0).length > 0 && (
          <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
            <span className="text-sm text-yellow-700">
              <span className="font-bold">Low stock: </span>
              {lowStockProducts.filter(p => p.stock > 0).map(p => `${p.name} (${p.stock})`).join(", ")}
            </span>
          </div>
        )}
        {orders?.filter(o => o.status === "awaiting_confirmation").length > 0 && (
          <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
            <span className="text-sm text-orange-700">
              <span className="font-bold">{orders.filter(o => o.status === "awaiting_confirmation").length} orders </span>
              awaiting payment confirmation from admin
            </span>
          </div>
        )}

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-white border border-gray-200 p-1 rounded-xl h-auto flex-wrap gap-1">
            <TabsTrigger value="overview" className="rounded-lg text-xs">📊 Overview</TabsTrigger>
            <TabsTrigger value="products" className="rounded-lg text-xs">📦 Products ({products?.length || 0})</TabsTrigger>
            <TabsTrigger value="orders" className="rounded-lg text-xs">🛒 Orders ({orders?.length || 0})</TabsTrigger>
            <TabsTrigger value="inventory" className="rounded-lg text-xs">
              ⚠️ Inventory {lowStockProducts.length > 0 ? `(${lowStockProducts.length} alerts)` : ""}
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" /> Revenue by Day
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.byDay.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={analytics.byDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
                        <Tooltip formatter={(v: any) => [`$${v}`, "Revenue"]} />
                        <Bar dataKey="revenue" fill="#fa5100" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No revenue data yet</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" /> Order Status Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  {[
                    { label: "Awaiting Confirmation", value: orders?.filter(o => o.status === "awaiting_confirmation").length || 0, color: "bg-orange-100 text-orange-700" },
                    { label: "Paid / Processing", value: orders?.filter(o => o.status === "paid").length || 0, color: "bg-blue-100 text-blue-700" },
                    { label: "Shipped", value: orders?.filter(o => o.status === "shipped").length || 0, color: "bg-purple-100 text-purple-700" },
                    { label: "Completed / Delivered", value: orders?.filter(o => o.status === "completed").length || 0, color: "bg-green-100 text-green-700" },
                    { label: "Cancelled", value: orders?.filter(o => o.status === "cancelled").length || 0, color: "bg-red-100 text-red-700" },
                  ].map(stat => (
                    <div key={stat.label} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">{stat.label}</span>
                      <span className={cn("px-2 py-0.5 rounded-full font-bold", stat.color)}>{stat.value}</span>
                    </div>
                  ))}
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700">Total Revenue</span>
                      <span className="font-black text-green-600 text-base">${(analytics.totalRevenue ?? 0).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" /> Your Products
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {products?.slice(0, 6).map((product, i) => (
                    <div key={product.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="text-sm font-black text-gray-300 w-5">#{i + 1}</span>
                      <img src={product.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover border" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{product.name}</p>
                        <p className="text-[10px] text-gray-400">{product.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-primary">${Number(product.price).toFixed(2)}</p>
                        <p className={cn("text-[10px]", product.stock < 10 ? "text-red-500 font-bold" : "text-gray-400")}>
                          {product.stock} in stock
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!products || products.length === 0) && (
                    <div className="py-8 text-center text-gray-400 text-sm">
                      No products yet.{" "}
                      <button onClick={openCreate} className="text-primary font-medium hover:underline">Add your first product</button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PRODUCTS */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={openCreate} className="gap-2">
                <Plus className="h-4 w-4" /> Add Product
              </Button>
            </div>

            {productsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : products?.length === 0 ? (
              <Card className="py-16 text-center border-dashed">
                <Package className="h-12 w-12 mx-auto text-gray-200 mb-4" />
                <p className="text-gray-500 font-medium">No products yet</p>
                <p className="text-xs text-gray-400 mt-1 mb-4">Add your first product to start selling</p>
                <Button onClick={openCreate} size="sm"><Plus className="h-4 w-4 mr-2" /> Add Product</Button>
              </Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {products?.map(product => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-video overflow-hidden bg-gray-50">
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-semibold text-sm leading-tight line-clamp-1">{product.name}</h3>
                          <p className="text-[10px] text-gray-400 mt-0.5">{product.category}</p>
                        </div>
                        <span className="text-primary font-black text-sm shrink-0">${Number(product.price).toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full",
                          product.stock === 0 ? "bg-red-100 text-red-700" :
                          product.stock < 10 ? "bg-yellow-100 text-yellow-700" :
                          "bg-green-100 text-green-700"
                        )}>
                          {product.stock === 0 ? "Out of Stock" : `${product.stock} in stock`}
                        </span>
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => openEdit(product)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => { if (confirm(`Delete "${product.name}"?`)) deleteProductMutation.mutate(product.id); }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ORDERS */}
          <TabsContent value="orders">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Order Management</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="p-3 text-left font-semibold">Order</th>
                        <th className="p-3 text-left font-semibold">Date</th>
                        <th className="p-3 text-left font-semibold">Status</th>
                        <th className="p-3 text-left font-semibold">Total</th>
                        <th className="p-3 text-left font-semibold">Payment</th>
                        <th className="p-3 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders?.map(order => (
                        <tr key={order.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-mono font-bold text-primary">#{order.id}</td>
                          <td className="p-3 text-gray-500">
                            {order.createdAt && format(new Date(order.createdAt), "MMM d, yyyy")}
                          </td>
                          <td className="p-3">
                            <span className={cn("px-2 py-0.5 rounded-full font-medium capitalize", STATUS_COLORS[order.status])}>
                              {order.status?.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="p-3 font-bold">${Number(order.totalAmount).toFixed(2)}</td>
                          <td className="p-3 capitalize">{order.paymentMethod?.replace(/_/g, " ")}</td>
                          <td className="p-3">
                            {order.status === "paid" && (
                              <Dialog open={shipDialogOpen === order.id} onOpenChange={open => setShipDialogOpen(open ? order.id : null)}>
                                <DialogTrigger asChild>
                                  <Button size="sm" className="h-7 text-xs">
                                    <Truck className="h-3 w-3 mr-1" /> Ship It
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader><DialogTitle>Mark Order #{order.id} as Shipped</DialogTitle></DialogHeader>
                                  <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const fd = new FormData(e.currentTarget);
                                    if (order.shipment?.trackingNumber) {
                                      addTrackingLogMutation.mutate({
                                        trackingNumber: order.shipment.trackingNumber,
                                        status: "shipped",
                                        location: String(fd.get("location")),
                                        note: String(fd.get("note") || "Package has been shipped."),
                                      });
                                    }
                                    updateOrderStatusMutation.mutate({ id: order.id, status: "shipped" });
                                  }} className="space-y-4 pt-4">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                      <Label className="text-xs font-bold">Tracking Number</Label>
                                      <p className="font-mono text-sm mt-1">{order.shipment?.trackingNumber || "Not assigned"}</p>
                                    </div>
                                    <div>
                                      <Label className="text-xs font-semibold">Origin Location</Label>
                                      <Input name="location" className="mt-1 text-xs" placeholder="e.g. Shenzhen Warehouse" required />
                                    </div>
                                    <div>
                                      <Label className="text-xs font-semibold">Note (optional)</Label>
                                      <Input name="note" className="mt-1 text-xs" placeholder="e.g. Package shipped via DHL" />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={addTrackingLogMutation.isPending}>
                                      {addTrackingLogMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Confirm Shipment"}
                                    </Button>
                                  </form>
                                </DialogContent>
                              </Dialog>
                            )}
                            {order.status === "shipped" && (
                              <Button size="sm" className="h-7 text-xs bg-green-500 hover:bg-green-600"
                                onClick={() => updateOrderStatusMutation.mutate({ id: order.id, status: "completed" })}>
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Delivered
                              </Button>
                            )}
                            {order.status === "awaiting_confirmation" && (
                              <span className="text-[10px] text-orange-600 font-medium">Awaiting admin confirmation</span>
                            )}
                            {order.status === "completed" && (
                              <span className="text-[10px] text-green-600 font-medium">✓ Completed</span>
                            )}
                            {order.status === "cancelled" && (
                              <span className="text-[10px] text-red-500 font-medium">✗ Cancelled</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {(!orders || orders.length === 0) && (
                        <tr><td colSpan={6} className="text-center py-8 text-gray-400">No orders yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* INVENTORY */}
          <TabsContent value="inventory">
            <div className="space-y-4">
              {outOfStock.length > 0 && (
                <Card className="border-red-200 bg-red-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-red-700 flex items-center gap-2">
                      <XCircle className="h-4 w-4" /> Out of Stock ({outOfStock.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {outOfStock.map(p => (
                      <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-t border-red-100">
                        <img src={p.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover border" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.category} · ${Number(p.price).toFixed(2)}</p>
                        </div>
                        <Button size="sm" className="h-7 text-xs" onClick={() => openEdit(p)}>
                          <Pencil className="h-3 w-3 mr-1" /> Restock
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {lowStockProducts.filter(p => p.stock > 0).length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-yellow-700 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" /> Low Stock — Under 10 Units ({lowStockProducts.filter(p => p.stock > 0).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {lowStockProducts.filter(p => p.stock > 0).map(p => (
                      <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-t border-yellow-100">
                        <img src={p.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover border" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.category} · ${Number(p.price).toFixed(2)}</p>
                        </div>
                        <div className="text-center mr-3">
                          <div className="text-lg font-black text-yellow-600">{p.stock}</div>
                          <div className="text-[10px] text-gray-400">left</div>
                        </div>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openEdit(p)}>
                          <Pencil className="h-3 w-3 mr-1" /> Update
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Full Inventory ({products?.length || 0} products)</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="p-3 text-left font-semibold">Product</th>
                        <th className="p-3 text-left font-semibold">Category</th>
                        <th className="p-3 text-left font-semibold">Price</th>
                        <th className="p-3 text-left font-semibold">Stock</th>
                        <th className="p-3 text-left font-semibold">Status</th>
                        <th className="p-3 text-left font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products?.map(p => (
                        <tr key={p.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <img src={p.imageUrl} alt="" className="w-8 h-8 rounded object-cover border" />
                              <span className="font-medium max-w-[150px] truncate">{p.name}</span>
                            </div>
                          </td>
                          <td className="p-3 text-gray-500">{p.category}</td>
                          <td className="p-3 font-bold text-primary">${Number(p.price).toFixed(2)}</td>
                          <td className="p-3 font-bold">{p.stock}</td>
                          <td className="p-3">
                            <span className={cn("px-2 py-0.5 rounded-full font-medium text-[10px]",
                              p.stock === 0 ? "bg-red-100 text-red-700" :
                              p.stock < 10 ? "bg-yellow-100 text-yellow-700" :
                              p.stock < 50 ? "bg-blue-100 text-blue-700" :
                              "bg-green-100 text-green-700"
                            )}>
                              {p.stock === 0 ? "Out of Stock" : p.stock < 10 ? "Low Stock" : p.stock < 50 ? "Moderate" : "Healthy"}
                            </span>
                          </td>
                          <td className="p-3">
                            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => openEdit(p)}>
                              Edit
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {(!products || products.length === 0) && (
                        <tr><td colSpan={6} className="text-center py-8 text-gray-400">No products</td></tr>
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
