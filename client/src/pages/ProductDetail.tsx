import { useProduct } from "@/hooks/use-products";
import { useCart } from "@/hooks/use-cart";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRoute } from "wouter";
import { Loader2, ShoppingCart, Truck, ShieldCheck, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function ProductDetail() {
  const [, params] = useRoute("/products/:id");
  const id = params ? parseInt(params.id) : 0;
  const { data: product, isLoading } = useProduct(id);
  const addItem = useCart((state) => state.addItem);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      
      <div className="container px-4 py-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-6 pl-0 hover:pl-2 transition-all">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shopping
          </Button>
        </Link>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
          {/* Image Gallery Side */}
          <div className="space-y-4">
            <div className="aspect-square bg-secondary rounded-2xl overflow-hidden border border-border/50 shadow-sm">
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Info Side */}
          <div className="flex flex-col space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="rounded-full">{product.category}</Badge>
                {Number(product.stock) < 10 && (
                  <Badge variant="destructive" className="rounded-full">Low Stock: {product.stock} left</Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                {product.name}
              </h1>
              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-bold text-primary">
                  ${Number(product.price).toFixed(2)}
                </span>
                <span className="text-xl text-muted-foreground line-through">
                  ${(Number(product.price) * 1.3).toFixed(2)}
                </span>
                <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-0">
                  -30% OFF
                </Badge>
              </div>
            </div>

            <div className="prose prose-sm text-muted-foreground">
              <p>{product.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/50">
              <div className="flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <Truck className="h-4 w-4" />
                </div>
                <span>Free Shipping</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span>Buyer Protection</span>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                size="lg" 
                className="flex-1 text-lg h-14 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                onClick={() => addItem(product)}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
