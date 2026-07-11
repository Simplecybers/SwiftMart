import { useCart } from "@/hooks/use-cart";
import { useCreateOrder } from "@/hooks/use-orders";
import { useUser } from "@/hooks/use-auth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Bitcoin, Gift, Loader2, Info, AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CRYPTO_WALLETS: Record<string, { address: string; network: string }> = {
  btc: { address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", network: "Bitcoin (BTC)" },
  eth: { address: "0x742d35Cc6634C0532925a3b8D4C9E8B3b9E9Cc59", network: "Ethereum (ETH)" },
  usdt: { address: "TXn9aUe4fQ2VN8zmJwUk1234USDT", network: "Tether (USDT) – TRC20" },
};

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart } = useCart();
  const { mutate: createOrder, isPending } = useCreateOrder();
  const { data: user } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const [paymentMethod, setPaymentMethod] = useState<"crypto" | "gift_card">("crypto");
  const [paymentDetails, setPaymentDetails] = useState<any>({});
  const [cryptoCurrency, setCryptoCurrency] = useState("usdt");

  const selectedWallet = CRYPTO_WALLETS[cryptoCurrency] || CRYPTO_WALLETS.usdt;

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

    if (paymentMethod === "crypto" && !paymentDetails.txHash) {
      toast({ title: "Transaction hash required", description: "Please enter your transaction hash/ID.", variant: "destructive" });
      return;
    }
    if (paymentMethod === "gift_card" && !paymentDetails.code) {
      toast({ title: "Gift card code required", description: "Please enter your gift card code.", variant: "destructive" });
      return;
    }

    createOrder(
      {
        items: items.map(i => ({ productId: i.id, quantity: i.quantity })),
        paymentMethod,
        paymentDetails,
      },
      {
        onSuccess: () => {
          clearCart();
          toast({
            title: "Order placed!",
            description: "Your order is awaiting payment confirmation. We'll verify it shortly.",
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
                    <span className="text-muted-foreground">Tax (8%)</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">${total.toFixed(2)}</span>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Payment Method</h3>
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={(val: "crypto" | "gift_card") => setPaymentMethod(val)}
                      className="grid grid-cols-1 gap-3"
                    >
                      <div className={`flex items-center space-x-2 border p-3 rounded-xl cursor-pointer transition-colors ${paymentMethod === "crypto" ? "border-primary bg-primary/5" : "hover:bg-accent"}`}>
                        <RadioGroupItem value="crypto" id="crypto" />
                        <Label htmlFor="crypto" className="flex items-center gap-2 cursor-pointer w-full font-medium">
                          <Bitcoin className="h-4 w-4 text-orange-500" /> Cryptocurrency
                        </Label>
                      </div>
                      <div className={`flex items-center space-x-2 border p-3 rounded-xl cursor-pointer transition-colors ${paymentMethod === "gift_card" ? "border-primary bg-primary/5" : "hover:bg-accent"}`}>
                        <RadioGroupItem value="gift_card" id="gift_card" />
                        <Label htmlFor="gift_card" className="flex items-center gap-2 cursor-pointer w-full font-medium">
                          <Gift className="h-4 w-4 text-purple-500" /> Gift Card
                        </Label>
                      </div>
                    </RadioGroup>

                    {/* Crypto Payment Details */}
                    {paymentMethod === "crypto" && (
                      <div className="p-4 bg-secondary/50 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Label className="text-xs font-bold uppercase">Cryptocurrency Payment</Label>

                        <Select
                          value={cryptoCurrency}
                          onValueChange={(val) => {
                            setCryptoCurrency(val);
                            setPaymentDetails({ ...paymentDetails, currency: val });
                          }}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Choose crypto..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="btc">Bitcoin (BTC)</SelectItem>
                            <SelectItem value="eth">Ethereum (ETH)</SelectItem>
                            <SelectItem value="usdt">Tether (USDT) – TRC20</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Wallet address to send to */}
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg space-y-1">
                          <p className="text-xs font-bold text-orange-700 uppercase">Send Payment To:</p>
                          <p className="text-xs text-gray-500">{selectedWallet.network}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs bg-white border rounded px-2 py-1 break-all flex-1 select-all">
                              {selectedWallet.address}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 shrink-0"
                              onClick={() => {
                                navigator.clipboard.writeText(selectedWallet.address);
                                toast({ title: "Address copied!" });
                              }}
                            >
                              Copy
                            </Button>
                          </div>
                          <p className="text-xs text-orange-600 font-medium mt-1">
                            Amount: ${total.toFixed(2)} USD equivalent
                          </p>
                        </div>

                        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 p-2 rounded-lg">
                          <Info className="h-3 w-3 mt-0.5 shrink-0 text-blue-500" />
                          <span>After sending payment, paste your transaction hash below. Your order will be confirmed within 1–24 hours.</span>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold">Your Wallet Address (sender)</Label>
                          <Input
                            className="bg-background text-xs"
                            placeholder="Your wallet address..."
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, walletAddress: e.target.value, currency: cryptoCurrency })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold">Transaction Hash / ID <span className="text-destructive">*</span></Label>
                          <Input
                            className="bg-background text-xs"
                            placeholder="e.g. 0xa1b2c3d4e5f6..."
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, txHash: e.target.value, currency: cryptoCurrency })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold">Proof of Payment (Image URL, optional)</Label>
                          <Input
                            className="bg-background text-xs"
                            placeholder="URL to screenshot..."
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, proofUrl: e.target.value })}
                          />
                        </div>
                      </div>
                    )}

                    {/* Gift Card Payment Details */}
                    {paymentMethod === "gift_card" && (
                      <div className="p-4 bg-secondary/50 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Label className="text-xs font-bold uppercase">Gift Card Details</Label>
                        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-purple-50 p-2 rounded-lg">
                          <Info className="h-3 w-3 mt-0.5 shrink-0 text-purple-500" />
                          <span>We accept Amazon, iTunes, Google Play, Steam, and other major gift cards. Our team will verify and confirm your order.</span>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold">Card Brand</Label>
                          <Input
                            className="bg-background text-xs"
                            placeholder="e.g. Amazon, iTunes, Google Play..."
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, cardName: e.target.value })}
                          />
                        </div>
                        <Select onValueChange={(val) => setPaymentDetails({ ...paymentDetails, cardType: val })}>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Card type..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="physical">Physical Card (back photo)</SelectItem>
                            <SelectItem value="e-code">E-Code (digital)</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold">Card Code / PIN <span className="text-destructive">*</span></Label>
                          <Input
                            className="bg-background text-xs"
                            placeholder="Gift card code or PIN..."
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, code: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold">Card Value (USD)</Label>
                          <Input
                            className="bg-background text-xs"
                            type="number"
                            placeholder="e.g. 25"
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, cardValue: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold">Card Image URL (optional)</Label>
                          <Input
                            className="bg-background text-xs"
                            placeholder="URL to card photo..."
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, cardImageUrl: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notice */}
                  <div className="flex items-start gap-2 text-xs text-muted-foreground bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-yellow-600" />
                    <span>All orders require manual payment verification. You will receive confirmation within 1–24 hours after payment is verified.</span>
                  </div>
                </div>

                <Button
                  className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20"
                  onClick={handleCheckout}
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Place Order <ArrowRight className="ml-2 h-5 w-5" />
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
