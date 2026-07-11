import { useOrders } from "@/hooks/use-orders";
import { useUser } from "@/hooks/use-auth";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Package, Truck, ExternalLink } from "lucide-react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  awaiting_confirmation: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  paid: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  shipped: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  completed: "bg-green-500/10 text-green-600 dark:text-green-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const shipmentStatusColors: Record<string, string> = {
  order_placed: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  processing: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  shipped: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  in_transit: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  out_for_delivery: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  delivered: "bg-green-500/10 text-green-600 dark:text-green-400",
};

export default function Orders() {
  const { data: user } = useUser();
  const { data: orders, isLoading } = useOrders();
  const [, setLocation] = useLocation();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container px-4 py-8">
          <div className="text-center py-24">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">Sign in to view orders</h2>
            <p className="text-muted-foreground mb-8">You need to be signed in to see your order history.</p>
            <Link href="/auth">
              <Button size="lg" data-testid="button-sign-in">Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      
      <div className="container px-4 py-8">
        <h1 className="text-3xl font-display font-bold mb-8 flex items-center gap-3" data-testid="text-orders-title">
          <Package className="h-8 w-8 text-primary" />
          My Orders
        </h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-24 bg-secondary/30 rounded-3xl border-2 border-dashed border-border">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-8">Start shopping to see your orders here.</p>
            <Link href="/">
              <Button size="lg" data-testid="button-start-shopping">Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden" data-testid={`card-order-${order.id}`}>
                <CardHeader className="bg-secondary/30 pb-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {order.createdAt && format(new Date(order.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={cn("capitalize", statusColors[order.status] || "")} data-testid={`badge-order-status-${order.id}`}>
                        {order.status}
                      </Badge>
                      <span className="font-bold text-primary text-lg" data-testid={`text-order-total-${order.id}`}>
                        ${Number(order.totalAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </div>
                    
                    {order.shipment && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-secondary/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Truck className="h-5 w-5 text-primary shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Tracking Number</p>
                            <p className="font-mono text-sm" data-testid={`text-tracking-number-${order.id}`}>
                              {order.shipment.trackingNumber}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge 
                            className={cn("capitalize", shipmentStatusColors[order.shipment.status] || "")}
                            data-testid={`badge-shipment-status-${order.id}`}
                          >
                            {order.shipment.status.replace(/_/g, ' ')}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLocation(`/track/${order.shipment?.trackingNumber}`)}
                            data-testid={`button-track-order-${order.id}`}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Track
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
