import { Link } from "wouter";
import { ShoppingCart, Star } from "lucide-react";
import { type Product } from "@shared/schema";
import { useCart } from "@/hooks/use-cart";

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCart((state) => state.addItem);
  const discount = Math.round((1 - Number(product.price) / (Number(product.price) * 1.25)) * 100);
  const originalPrice = (Number(product.price) * 1.25).toFixed(2);
  const ratingCount = Math.floor(seededRandom(product.id) * 500 + 50);
  const filledStars = product.id % 5 === 0 ? 5 : 4;

  return (
    <div className="group bg-white rounded-xl overflow-hidden hover:shadow-md transition-shadow" data-testid={`card-product-${product.id}`}>
      <Link href={`/products/${product.id}`} className="block relative" data-testid={`link-product-${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {Number(product.stock) < 5 && (
            <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full" data-testid={`badge-low-stock-${product.id}`}>
              Almost Gone
            </span>
          )}
          <span className="absolute top-1.5 right-1.5 bg-[#fa5100] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full" data-testid={`badge-discount-${product.id}`}>
            -{discount}%
          </span>
        </div>
      </Link>

      <div className="p-2">
        <Link href={`/products/${product.id}`}>
          <p className="text-xs text-gray-600 leading-tight line-clamp-2 mb-1.5 hover:text-[#fa5100] transition-colors" data-testid={`text-product-name-${product.id}`}>
            {product.name}
          </p>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-1.5">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`h-2.5 w-2.5 ${s <= filledStars ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}`} />
            ))}
          </div>
          <span className="text-[9px] text-gray-400" data-testid={`text-rating-count-${product.id}`}>({ratingCount})</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-sm font-black text-[#fa5100]" data-testid={`text-price-${product.id}`}>
            ${Number(product.price).toFixed(2)}
          </span>
          <span className="text-[9px] text-gray-400 line-through">${originalPrice}</span>
        </div>

        {/* Add to cart */}
        <button
          onClick={(e) => { e.preventDefault(); addItem(product); }}
          className="w-full bg-[#fa5100] hover:bg-[#e04800] active:bg-[#c53d00] text-white text-xs font-bold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
          data-testid={`button-add-to-cart-${product.id}`}
        >
          <ShoppingCart className="h-3 w-3" />
          Add to Cart
        </button>
      </div>
    </div>
  );
}
