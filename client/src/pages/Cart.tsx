import { useCart } from "@/hooks/use-cart";
import { useCreateOrder } from "@/hooks/use-orders";
import { useUser } from "@/hooks/use-auth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart } = useCart();
  const { mutate: createOrder, isPending } = useCreateOrder();
  const { data: user } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const handleCheckout = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to complete your purchase",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }

    createOrder(
      { items: items.map(i => ({ productId: i.id, quantity: i.quantity })) },
      {
        onSuccess: () => {
          clearCart();
          toast({
            title: "Order placed!",
            description: "Your order has been successfully created.",
          });
          setLocation("/orders");
        },
        onError: (err) => {
          toast({
            title: "Error",
            description: err.message,
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      
      <div className="container px-4 py-8">
        <h1 className="text-3xl font-display font-bold mb-8 flex items-center gap-3">
          <ShoppingBag className="h-8 w-8 text-primary" />
          Shopping Cart
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-24 bg-secondary/30 rounded-3xl border-2 border-dashed border-border">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8">Looks like you haven't added anything yet.</p>
            <Link href="/">
              <Button size="lg" className="font-semibold">Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="p-4 flex gap-4 items-center group hover:border-primary/50 transition-colors">
                  <div className="h-24 w-24 bg-secondary rounded-lg overflow-hidden shrink-0">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.id}`}>
                      <h3 className="font-bold truncate hover:text-primary transition-colors cursor-pointer">{item.name}</h3>
                    </Link>
                    <p className="text-sm text-muted-foreground mb-2">{item.category}</p>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-primary">${Number(item.price).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-4">
                    <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-md"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-md"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-24 shadow-lg shadow-black/5">
                <h3 className="font-display font-bold text-xl mb-6">Order Summary</h3>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">${total.toFixed(2)}</span>
                  </div>
                </div>
                <Button 
                  className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20" 
                  onClick={handleCheckout}
                  disabled={isPending}
                >
                  {isPending ? (
                    "Processing..."
                  ) : (
                    <>
                      Checkout <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
