import { useQuery, useMutation } from "@tanstack/react-query";
import { Product, InsertProduct, Order, Shipment } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Loader2, Trash2, Pencil, ShoppingCart, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useUser } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { useState } from "react";

type OrderWithShipment = Order & { items: any[]; shipment?: Shipment };

const productFormSchema = insertProductSchema.omit({ vendorId: true });
type ProductFormValues = typeof productFormSchema._type;

export default function VendorDashboard() {
  const { data: user, isLoading: isUserLoading } = useUser();
  const { toast } = useToast();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { data: products, isLoading: isProductsLoading } = useQuery<Product[]>({
    queryKey: ["/api/vendor/products"],
    enabled: !!user,
  });

  const { data: orders, isLoading: isOrdersLoading } = useQuery<OrderWithShipment[]>({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const res = await apiRequest("POST", "/api/products", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product created successfully" });
      setAddDialogOpen(false);
      form.reset();
    },
    onError: (err: any) => toast({ title: "Failed to create product", description: err.message, variant: "destructive" }),
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ProductFormValues> }) => {
      const res = await apiRequest("PATCH", `/api/products/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product updated" });
      setEditingProduct(null);
    },
    onError: (err: any) => toast({ title: "Failed to update product", description: err.message, variant: "destructive" }),
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product deleted" });
    },
    onError: (err: any) => toast({ title: "Failed to delete product", description: err.message, variant: "destructive" }),
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

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "0.00",
      stock: 10,
      imageUrl: "",
      category: ""
    }
  });

  const editForm = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "0.00",
      stock: 0,
      imageUrl: "",
      category: ""
    }
  });

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    editForm.reset({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      imageUrl: product.imageUrl,
      category: product.category,
    });
  };

  if (isUserLoading || isProductsLoading || isOrdersLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (user?.role !== "vendor") return <Redirect to="/" />;

  const stats = {
    totalProducts: products?.length || 0,
    totalOrders: orders?.length || 0,
    revenue: orders?.reduce((acc, order) => acc + Number(order.totalAmount), 0) || 0
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      <div className="container px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-3xl font-display font-bold">Vendor Dashboard</h1>
          <div className="flex gap-4 flex-wrap">
            <Card className="px-4 py-2">
              <div className="text-xs text-muted-foreground uppercase font-bold">Revenue</div>
              <div className="text-xl font-bold text-primary" data-testid="text-revenue">${stats.revenue.toFixed(2)}</div>
            </Card>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-product">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => createProductMutation.mutate(data))} className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl><Input {...field} data-testid="input-product-name" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl><Textarea {...field} data-testid="input-product-description" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price</FormLabel>
                            <FormControl><Input type="number" step="0.01" {...field} data-testid="input-product-price" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="stock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock</FormLabel>
                            <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-product-stock" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <FormControl><Input {...field} data-testid="input-product-category" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL</FormLabel>
                          <FormControl><Input {...field} data-testid="input-product-image" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={createProductMutation.isPending} data-testid="button-submit-product">
                      {createProductMutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                      Create Product
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList className="bg-secondary/50 p-1 rounded-xl">
            <TabsTrigger value="products" className="rounded-lg" data-testid="tab-products">
              <Package className="h-4 w-4 mr-2" /> Products ({stats.totalProducts})
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-lg" data-testid="tab-orders">
              <ShoppingCart className="h-4 w-4 mr-2" /> Orders ({stats.totalOrders})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products?.map((product) => (
                <Card key={product.id} className="overflow-hidden hover-elevate" data-testid={`card-product-${product.id}`}>
                  <div className="h-48 overflow-hidden bg-muted">
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <CardHeader className="flex flex-row items-center justify-between gap-1">
                    <CardTitle className="text-lg" data-testid={`text-product-name-${product.id}`}>{product.name}</CardTitle>
                    <Badge variant="outline">${Number(product.price).toFixed(2)}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                      <span data-testid={`text-stock-${product.id}`}>Stock: {product.stock}</span>
                      <Badge className="bg-primary/10 text-primary border-none">{product.category}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(product)} data-testid={`button-edit-${product.id}`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" data-testid={`button-delete-${product.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete "{product.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove this product from your store. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-testid={`button-cancel-delete-${product.id}`}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => deleteProductMutation.mutate(product.id)}
                              data-testid={`button-confirm-delete-${product.id}`}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {products?.length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-12">You haven't listed any products yet.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-4 text-left font-medium">Order ID</th>
                        <th className="p-4 text-left font-medium">Items</th>
                        <th className="p-4 text-left font-medium">Status</th>
                        <th className="p-4 text-left font-medium">Total</th>
                        <th className="p-4 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders?.map((order) => (
                        <tr key={order.id} className="border-b hover:bg-muted/30 transition-colors" data-testid={`row-vendor-order-${order.id}`}>
                          <td className="p-4 font-mono font-bold text-primary">#{order.id}</td>
                          <td className="p-4">{order.items?.length || 0} item(s)</td>
                          <td className="p-4">
                            <Badge variant="outline" className="capitalize">{order.status?.replace(/_/g, ' ')}</Badge>
                          </td>
                          <td className="p-4 font-bold">${Number(order.totalAmount).toFixed(2)}</td>
                          <td className="p-4">
                            {order.status === 'paid' && (
                              <Button size="sm" onClick={() => updateOrderStatusMutation.mutate({ id: order.id, status: 'shipped' })} data-testid={`button-mark-shipped-${order.id}`}>
                                Mark Shipped
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {orders?.length === 0 && (
                        <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No orders yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit((data) => {
                  if (editingProduct) updateProductMutation.mutate({ id: editingProduct.id, data });
                })}
                className="space-y-4 pt-4"
              >
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl><Input {...field} data-testid="input-edit-name" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl><Textarea {...field} data-testid="input-edit-description" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl><Input type="number" step="0.01" {...field} data-testid="input-edit-price" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock</FormLabel>
                        <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-edit-stock" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl><Input {...field} data-testid="input-edit-category" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl><Input {...field} data-testid="input-edit-image" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={updateProductMutation.isPending} data-testid="button-submit-edit">
                  {updateProductMutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                  Save Changes
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
