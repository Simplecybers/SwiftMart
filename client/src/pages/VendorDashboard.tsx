import { useQuery, useMutation } from "@tanstack/react-query";
import { Product, InsertProduct, Order } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Loader2, Trash2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useUser } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function VendorDashboard() {
  const { data: user, isLoading: isUserLoading } = useUser();
  const { toast } = useToast();
  const { data: products, isLoading: isProductsLoading } = useQuery<Product[]>({
    queryKey: ["/api/vendor/products"]
  });

  const { data: orders, isLoading: isOrdersLoading } = useQuery<(Order & { items: any[] })[]>({
    queryKey: ["/api/orders"]
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/products", { ...data, vendorId: user?.id });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/products"] });
      toast({ title: "Product created successfully" });
    }
  });

  const form = useForm({
    resolver: zodResolver(insertProductSchema.omit({ vendorId: true })),
    defaultValues: {
      name: "",
      description: "",
      price: "0.00",
      stock: 10,
      imageUrl: "",
      category: ""
    }
  });

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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-display font-bold">Vendor Dashboard</h1>
          <div className="flex gap-4">
            <Card className="px-4 py-2">
              <div className="text-xs text-muted-foreground uppercase font-bold">Revenue</div>
              <div className="text-xl font-bold text-primary">${stats.revenue.toFixed(2)}</div>
            </Card>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
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
                          <FormControl><Input {...field} /></FormControl>
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
                          <FormControl><Textarea {...field} /></FormControl>
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
                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
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
                            <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl>
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
                          <FormControl><Input {...field} /></FormControl>
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
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={createProductMutation.isPending}>
                      {createProductMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                      Create Product
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products?.map((product) => (
            <Card key={product.id} className="overflow-hidden hover-elevate">
              <div className="h-48 overflow-hidden bg-muted">
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between gap-1">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <Badge variant="outline">${Number(product.price).toFixed(2)}</Badge>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                  <span>Stock: {product.stock}</span>
                  <Badge className="bg-primary/10 text-primary border-none">{product.category}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
