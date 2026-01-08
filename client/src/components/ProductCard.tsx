import { Link } from "wouter";
import { ShoppingCart } from "lucide-react";
import { type Product } from "@shared/schema";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCart((state) => state.addItem);

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg border-border/50">
      <Link href={`/products/${product.id}`} className="block relative aspect-square overflow-hidden bg-secondary/50">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {Number(product.stock) < 5 && (
          <Badge variant="destructive" className="absolute top-2 left-2">
            Low Stock
          </Badge>
        )}
      </Link>
      <CardContent className="p-4">
        <div className="mb-2 text-xs text-muted-foreground uppercase tracking-wide font-semibold">
          {product.category}
        </div>
        <Link href={`/products/${product.id}`}>
          <h3 className="font-display text-lg font-bold leading-tight line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-primary">
            ${Number(product.price).toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground line-through">
            ${(Number(product.price) * 1.2).toFixed(2)}
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full font-semibold group-hover:bg-primary group-hover:text-white transition-all"
          onClick={() => addItem(product)}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
