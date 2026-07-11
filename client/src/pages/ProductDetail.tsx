import { useProduct, useProducts } from "@/hooks/use-products";
import { useCart } from "@/hooks/use-cart";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRoute, useLocation } from "wouter";
import { Loader2, ShoppingCart, Truck, ShieldCheck, ArrowLeft, Star, RotateCcw, Package, Heart, Share2, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const MOCK_REVIEWS = [
  { id: 1, name: "Sarah M.", rating: 5, date: "Jun 2026", text: "Absolutely love this! Quality exceeded my expectations and shipping was fast." },
  { id: 2, name: "John D.", rating: 4, date: "May 2026", text: "Great value for money. Looks exactly like the photos. Would definitely order again." },
  { id: 3, name: "Emma K.", rating: 5, date: "May 2026", text: "Perfect! Exactly what I was looking for. Very happy with this purchase." },
  { id: 4, name: "Mike R.", rating: 4, date: "Apr 2026", text: "Good product, arrived well-packaged. Minor issues with sizing but otherwise excellent." },
];

export default function ProductDetail() {
  const [, params] = useRoute("/products/:id");
  const [, setLocation] = useLocation();
  const id = params ? parseInt(params.id) : 0;
  const { data: product, isLoading } = useProduct(id);
  const { data: allProducts } = useProducts({});
  const addItem = useCart((state) => state.addItem);
  const { toast } = useToast();
  const [qty, setQty] = useState(1);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [wishlist, setWishlist] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const related = allProducts?.filter(p => p.id !== id && p.category === product?.category).slice(0, 6) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Package className="h-16 w-16 text-gray-300" />
          <h1 className="text-2xl font-bold text-gray-600">Product not found</h1>
          <Link href="/"><Button>Back to Home</Button></Link>
        </div>
      </div>
    );
  }

  const originalPrice = (Number(product.price) * 1.35).toFixed(2);
  const discount = Math.round((1 - Number(product.price) / Number(originalPrice)) * 100);
  const rating = 4 + seededRandom(product.id) * 0.8;
  const ratingCount = Math.floor(seededRandom(product.id + 1) * 1500 + 200);
  const sold = Math.floor(seededRandom(product.id + 2) * 5000 + 500);

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) addItem(product);
    setAddedToCart(true);
    toast({ title: "Added to cart!", description: `${product.name} × ${qty}` });
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: product.name, url });
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "Link copied!" });
    }
  };

  const displayedReviews = showAllReviews ? MOCK_REVIEWS : MOCK_REVIEWS.slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-screen-xl mx-auto px-4 py-2 flex items-center gap-2 text-xs text-gray-400">
          <button onClick={() => setLocation("/")} className="hover:text-primary transition-colors">Home</button>
          <span>/</span>
          <button onClick={() => setLocation(`/?category=${product.category}`)} className="hover:text-primary transition-colors">{product.category}</button>
          <span>/</span>
          <span className="text-gray-600 truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-4 space-y-4">
        {/* Main product section */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image side */}
            <div className="relative bg-gray-50">
              <div className="aspect-square overflow-hidden">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute top-3 left-3 flex flex-col gap-1">
                {Number(product.stock) < 10 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                    Only {product.stock} left!
                  </span>
                )}
                <span className="bg-[#fa5100] text-white text-[10px] font-bold px-2 py-1 rounded-full">
                  -{discount}% OFF
                </span>
              </div>
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <button
                  onClick={() => { setWishlist(!wishlist); toast({ title: wishlist ? "Removed from wishlist" : "Added to wishlist" }); }}
                  className={cn("w-9 h-9 rounded-full shadow flex items-center justify-center transition-colors", wishlist ? "bg-red-500 text-white" : "bg-white text-gray-400 hover:text-red-400")}
                >
                  <Heart className={cn("h-4 w-4", wishlist && "fill-current")} />
                </button>
                <button
                  onClick={handleShare}
                  className="w-9 h-9 bg-white rounded-full shadow flex items-center justify-center text-gray-400 hover:text-primary transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Info side */}
            <div className="p-6 flex flex-col gap-4">
              {/* Category & title */}
              <div>
                <Badge variant="outline" className="text-xs mb-2 capitalize">{product.category}</Badge>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">{product.name}</h1>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={cn("h-3.5 w-3.5", s <= Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200")} />
                  ))}
                  <span className="text-sm font-bold text-gray-700 ml-1">{rating.toFixed(1)}</span>
                </div>
                <span className="text-xs text-gray-400">{ratingCount.toLocaleString()} reviews</span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-400">{sold.toLocaleString()} sold</span>
              </div>

              {/* Price */}
              <div className="bg-orange-50 rounded-xl p-3">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-[#fa5100]">${Number(product.price).toFixed(2)}</span>
                  <span className="text-base text-gray-400 line-through">${originalPrice}</span>
                  <Badge className="bg-red-100 text-red-600 border-0 text-xs font-bold">Save ${(Number(originalPrice) - Number(product.price)).toFixed(2)}</Badge>
                </div>
                <p className="text-xs text-orange-600 mt-1 font-medium">🔥 Limited time offer — {product.stock} items left in stock</p>
              </div>

              {/* Description */}
              <div>
                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
              </div>

              {/* Qty selector */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-600">Quantity:</span>
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-7 h-7 rounded-md bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-primary font-bold"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-bold text-sm">{qty}</span>
                  <button
                    onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                    className="w-7 h-7 rounded-md bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-primary font-bold"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-gray-400">{product.stock} available</span>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-2 text-xs text-center">
                {[
                  { icon: Truck, label: "Free Shipping", sub: "On all orders" },
                  { icon: ShieldCheck, label: "Buyer Protection", sub: "Money-back guarantee" },
                  { icon: RotateCcw, label: "Easy Returns", sub: "30-day policy" },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-2">
                    <Icon className="h-4 w-4 text-primary mx-auto mb-1" />
                    <p className="font-semibold text-gray-700 text-[10px]">{label}</p>
                    <p className="text-gray-400 text-[9px]">{sub}</p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="flex-1 bg-[#fa5100] hover:bg-[#e04800] text-white font-bold h-12 shadow-lg shadow-orange-200"
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                >
                  {addedToCart ? (
                    <>✓ Added to Cart</>
                  ) : (
                    <><ShoppingCart className="mr-2 h-5 w-5" />{product.stock === 0 ? "Out of Stock" : "Add to Cart"}</>
                  )}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-4 border-[#fa5100] text-[#fa5100] hover:bg-orange-50 font-bold"
                  onClick={() => { handleAddToCart(); setLocation("/cart"); }}
                  disabled={product.stock === 0}
                >
                  Buy Now
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4">Product Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {[
              { label: "Category", value: product.category },
              { label: "Stock", value: `${product.stock} units` },
              { label: "Condition", value: "Brand New" },
              { label: "Shipping", value: "Free Worldwide" },
              { label: "Estimated Delivery", value: "7–15 business days" },
              { label: "Return Policy", value: "30 days hassle-free" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">{label}</p>
                <p className="text-gray-700 font-medium text-xs">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">Customer Reviews</h2>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={cn("h-4 w-4", s <= Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200")} />
                ))}
              </div>
              <span className="font-bold text-gray-700">{rating.toFixed(1)}</span>
              <span className="text-xs text-gray-400">({ratingCount.toLocaleString()})</span>
            </div>
          </div>

          {/* Rating breakdown */}
          <div className="space-y-1.5 mb-6">
            {[5, 4, 3, 2, 1].map(star => {
              const pct = star === 5 ? 68 : star === 4 ? 22 : star === 3 ? 7 : star === 2 ? 2 : 1;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-6 text-right text-gray-500">{star}★</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-gray-400">{pct}%</span>
                </div>
              );
            })}
          </div>

          <div className="space-y-4">
            {displayedReviews.map(review => (
              <div key={review.id} className="border-b border-gray-50 pb-4 last:border-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{review.name}</p>
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={cn("h-2.5 w-2.5", s <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200")} />
                      ))}
                      <span className="text-[10px] text-gray-400 ml-1">{review.date}</span>
                    </div>
                  </div>
                  <span className="ml-auto text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">✓ Verified</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{review.text}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowAllReviews(!showAllReviews)}
            className="mt-4 w-full py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1 transition-colors"
          >
            {showAllReviews ? <><ChevronUp className="h-3 w-3" /> Show Less</> : <><ChevronDown className="h-3 w-3" /> View All {ratingCount.toLocaleString()} Reviews</>}
          </button>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-gray-800 mb-4">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex gap-3 z-40 shadow-lg">
        <button
          onClick={() => setLocation("/")}
          className="flex flex-col items-center px-3 text-gray-400 hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Back</span>
        </button>
        <button
          onClick={() => { setWishlist(!wishlist); toast({ title: wishlist ? "Removed from wishlist" : "Saved to wishlist" }); }}
          className={cn("flex flex-col items-center px-3 transition-colors", wishlist ? "text-red-500" : "text-gray-400 hover:text-red-400")}
        >
          <Heart className={cn("h-5 w-5", wishlist && "fill-current")} />
          <span className="text-[10px] mt-0.5">Wishlist</span>
        </button>
        <Button
          className="flex-1 bg-[#fa5100] hover:bg-[#e04800] text-white font-bold h-11"
          onClick={handleAddToCart}
          disabled={product.stock === 0}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {product.stock === 0 ? "Out of Stock" : `Add to Cart — $${(Number(product.price) * qty).toFixed(2)}`}
        </Button>
        <Button
          variant="outline"
          className="h-11 px-4 border-[#fa5100] text-[#fa5100] font-bold hover:bg-orange-50"
          onClick={() => { handleAddToCart(); setLocation("/cart"); }}
          disabled={product.stock === 0}
        >
          Buy Now
        </Button>
      </div>
    </div>
  );
}
