import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { Navbar } from "@/components/Navbar";
import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { ChevronRight, Zap, Truck, Shield, RotateCcw, Tag, Flame, Star, Gift, Copy, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  { name: "Electronics", emoji: "📱", color: "bg-blue-50" },
  { name: "Fashion", emoji: "👗", color: "bg-pink-50" },
  { name: "Home", emoji: "🏠", color: "bg-yellow-50" },
  { name: "Beauty", emoji: "💄", color: "bg-rose-50" },
  { name: "Sports", emoji: "⚽", color: "bg-green-50" },
  { name: "Toys", emoji: "🧸", color: "bg-purple-50" },
  { name: "Auto", emoji: "🚗", color: "bg-gray-50" },
  { name: "Books", emoji: "📚", color: "bg-amber-50" },
];

const BANNERS = [
  { bg: "from-orange-500 to-red-500", tag: "🔥 Flash Sale", title: "Up to 90% OFF", sub: "Today only — limited stock!", cta: "Shop Now", href: "/?category=Electronics" },
  { bg: "from-purple-500 to-pink-500", tag: "🎁 New User Deal", title: "First Order FREE Ship", sub: "No minimum purchase", cta: "Claim Deal", href: "/auth" },
  { bg: "from-blue-500 to-cyan-500", tag: "⚡ Lightning Deal", title: "Electronics Blowout", sub: "Top brands, lowest prices", cta: "Browse", href: "/?category=Electronics" },
];

const FLASH_DEALS = [
  { name: "Wireless Earbuds", price: "$18.99", original: "$49.99", img: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200&q=80", search: "Wireless Bluetooth Earbuds" },
  { name: "Smart Watch", price: "$24.99", original: "$99.99", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80", search: "Smart Fitness Watch" },
  { name: "LED Strip Lights", price: "$9.99", original: "$19.99", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80", search: "LED Strip" },
  { name: "Portable Charger", price: "$15.49", original: "$34.99", img: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=200&q=80", search: "Portable Phone Charger" },
  { name: "Yoga Mat", price: "$11.99", original: "$29.99", img: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=200&q=80", search: "Yoga Mat" },
  { name: "Dumbbell Set", price: "$39.99", original: "$79.99", img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&q=80", search: "Adjustable Dumbbell" },
];

function useCountdown() {
  const getMsToMidnight = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return midnight.getTime() - now.getTime();
  };

  const [ms, setMs] = useState(getMsToMidnight);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getMsToMidnight();
      setMs(remaining);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Home() {
  const [activeBanner, setActiveBanner] = useState(0);
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const activeCategory = params.get("category") || "All";
  const activeSearch = params.get("search") || "";
  const { toast } = useToast();
  const countdown = useCountdown();

  const { data: products, isLoading } = useProducts({
    category: activeCategory !== "All" ? activeCategory : undefined,
    search: activeSearch || undefined,
  });
  const banner = BANNERS[activeBanner];

  // Auto-rotate banners
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBanner(prev => (prev + 1) % BANNERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const setCategory = (name: string) => {
    if (name === activeCategory) {
      setLocation("/");
    } else {
      setLocation(`/?category=${encodeURIComponent(name)}`);
    }
  };

  const handleShare = () => {
    const referralLink = `${window.location.origin}/auth`;
    if (navigator.share) {
      navigator.share({ title: "Join Temu Lite!", text: "Get amazing deals!", url: referralLink });
    } else {
      navigator.clipboard.writeText(referralLink);
      toast({ title: "Referral link copied!", description: "Share it with your friends to earn rewards." });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-body">
      <Navbar />

      {/* Trust bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-screen-xl mx-auto px-4 py-2 flex items-center justify-between overflow-x-auto gap-6">
          {[
            { icon: Truck, text: "Free Shipping" },
            { icon: Shield, text: "Buyer Protection" },
            { icon: RotateCcw, text: "Easy Returns" },
            { icon: Tag, text: "Best Prices" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-xs text-gray-600 whitespace-nowrap">
              <Icon className="h-3.5 w-3.5 text-[#fa5100]" />
              <span className="font-medium">{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-3 py-3 space-y-4">

        {/* Hero Banner */}
        <div
          className={`relative rounded-2xl bg-gradient-to-r ${banner.bg} p-6 overflow-hidden text-white cursor-pointer`}
          data-testid="section-hero-banner"
          onClick={() => setLocation(banner.href)}
        >
          <div className="relative z-10">
            <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full mb-3">{banner.tag}</span>
            <h1 className="text-3xl font-black leading-tight mb-1">{banner.title}</h1>
            <p className="text-white/80 text-sm mb-4">{banner.sub}</p>
            <button
              className="bg-white text-[#fa5100] font-bold text-sm px-5 py-2 rounded-full hover:bg-orange-50 transition-colors"
              data-testid="button-banner-cta"
              onClick={(e) => { e.stopPropagation(); setLocation(banner.href); }}
            >
              {banner.cta} →
            </button>
          </div>
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -right-4 top-12 w-24 h-24 bg-white/10 rounded-full" />

          {/* Banner dots */}
          <div className="absolute bottom-3 right-3 flex gap-1.5">
            {BANNERS.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setActiveBanner(i); }}
                className={`h-1.5 rounded-full transition-all ${i === activeBanner ? "bg-white w-5" : "bg-white/50 w-1.5"}`}
                data-testid={`button-banner-dot-${i}`}
              />
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-2xl p-4 shadow-sm" data-testid="section-categories">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm text-gray-800">Shop by Category</h2>
            <button
              onClick={() => setLocation("/")}
              className="text-[#fa5100] text-xs font-medium flex items-center gap-0.5 hover:underline"
              data-testid="button-see-all-categories"
            >
              See all <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setCategory(cat.name)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${activeCategory === cat.name ? "ring-2 ring-[#fa5100] bg-orange-50" : "hover:bg-gray-50"}`}
                data-testid={`button-category-${cat.name.toLowerCase()}`}
              >
                <div className={`w-10 h-10 ${cat.color} rounded-full flex items-center justify-center text-xl`}>
                  {cat.emoji}
                </div>
                <span className="text-[10px] font-medium text-gray-700 text-center leading-tight">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Flash Deal Strip */}
        <div className="bg-white rounded-2xl p-4 shadow-sm" data-testid="section-flash-deals">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-[#fa5100]" />
              <h2 className="font-bold text-sm text-gray-800">Flash Deals</h2>
              <span className="bg-[#fa5100] text-white text-[10px] font-bold px-2 py-0.5 rounded-full" data-testid="text-countdown">
                Ends in {countdown}
              </span>
            </div>
            <button
              onClick={() => setLocation("/")}
              className="text-[#fa5100] text-xs font-medium flex items-center gap-0.5 hover:underline"
              data-testid="button-more-deals"
            >
              More <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {FLASH_DEALS.map((deal, i) => (
              <button
                key={i}
                className="flex-shrink-0 w-28 bg-gray-50 rounded-xl overflow-hidden text-left hover:shadow-md transition-shadow"
                data-testid={`card-flash-deal-${i}`}
                onClick={() => setLocation(`/?search=${encodeURIComponent(deal.search)}`)}
              >
                <img src={deal.img} alt={deal.name} className="w-full h-24 object-cover" />
                <div className="p-1.5">
                  <p className="text-[10px] text-gray-600 leading-tight line-clamp-1">{deal.name}</p>
                  <p className="text-xs font-black text-[#fa5100]">{deal.price}</p>
                  <p className="text-[9px] text-gray-400 line-through">{deal.original}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="bg-white rounded-2xl p-4 shadow-sm" data-testid="section-products">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-[#fa5100] fill-[#fa5100]" />
              <h2 className="font-bold text-sm text-gray-800" data-testid="text-products-heading">
                {activeSearch ? `Results for "${activeSearch}"` : activeCategory !== "All" ? activeCategory : "Recommended For You"}
              </h2>
            </div>
            {(activeSearch || activeCategory !== "All") && (
              <button
                onClick={() => setLocation("/")}
                className="text-[#fa5100] text-xs font-medium hover:underline"
                data-testid="button-clear-filters"
              >
                Clear
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
                  <div className="h-3 w-3/4 rounded bg-gray-100 animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-gray-100 animate-pulse" />
                </div>
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 text-sm" data-testid="text-no-products">
              No products found. Try a different search or category.
            </div>
          )}
        </div>

        {/* Bottom promo */}
        <div className="grid grid-cols-2 gap-3">
          <button
            className="bg-gradient-to-br from-orange-500 to-yellow-400 rounded-2xl p-4 text-white text-left hover:opacity-95 transition-opacity"
            data-testid="promo-new-users"
            onClick={() => setLocation("/auth")}
          >
            <Gift className="h-6 w-6 mb-2" />
            <p className="font-black text-lg leading-tight">New User<br />Gifts</p>
            <p className="text-xs text-white/80 mt-1">Exclusive discounts</p>
            <span className="mt-3 inline-block bg-white text-orange-500 text-xs font-bold px-3 py-1.5 rounded-full">
              Grab Now
            </span>
          </button>
          <button
            className="bg-gradient-to-br from-purple-500 to-pink-400 rounded-2xl p-4 text-white text-left hover:opacity-95 transition-opacity"
            data-testid="promo-referral"
            onClick={handleShare}
          >
            <Share2 className="h-6 w-6 mb-2" />
            <p className="font-black text-lg leading-tight">Refer &<br />Earn</p>
            <p className="text-xs text-white/80 mt-1">Get $5 per friend</p>
            <span className="mt-3 inline-block bg-white text-purple-500 text-xs font-bold px-3 py-1.5 rounded-full">
              Share Now
            </span>
          </button>
        </div>

        {/* New Arrivals Strip */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <h2 className="font-bold text-sm text-gray-800">New Arrivals</h2>
            </div>
            <button onClick={() => setLocation("/")} className="text-[#fa5100] text-xs font-medium flex items-center gap-0.5 hover:underline">
              View all <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { name: "Face Serum", price: "$14.99", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200&q=80", search: "Hydrating Face Serum" },
              { name: "Building Blocks", price: "$23.99", img: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=200&q=80", search: "Building Blocks" },
              { name: "Race Car RC", price: "$26.99", img: "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=200&q=80", search: "Remote Control" },
              { name: "Denim Jacket", price: "$27.49", img: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=200&q=80", search: "Classic Denim" },
              { name: "Mug Set", price: "$16.99", img: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=200&q=80", search: "Coffee Mug" },
            ].map((item, i) => (
              <button
                key={i}
                className="flex-shrink-0 w-28 bg-gray-50 rounded-xl overflow-hidden text-left hover:shadow-md transition-shadow"
                onClick={() => setLocation(`/?search=${encodeURIComponent(item.search)}`)}
              >
                <img src={item.img} alt={item.name} className="w-full h-24 object-cover" />
                <div className="p-1.5">
                  <p className="text-[10px] text-gray-600 leading-tight line-clamp-1">{item.name}</p>
                  <p className="text-xs font-black text-[#fa5100]">{item.price}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="mt-6 bg-white border-t border-gray-100 py-8">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 text-xs text-gray-500">
            <div>
              <p className="font-bold text-gray-700 mb-2">Shop</p>
              <div className="space-y-1.5">
                {CATEGORIES.slice(0, 4).map(c => (
                  <button key={c.name} onClick={() => setLocation(`/?category=${encodeURIComponent(c.name)}`)} className="block hover:text-[#fa5100] transition-colors">{c.name}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="font-bold text-gray-700 mb-2">More</p>
              <div className="space-y-1.5">
                {CATEGORIES.slice(4).map(c => (
                  <button key={c.name} onClick={() => setLocation(`/?category=${encodeURIComponent(c.name)}`)} className="block hover:text-[#fa5100] transition-colors">{c.name}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="font-bold text-gray-700 mb-2">Account</p>
              <div className="space-y-1.5">
                <button onClick={() => setLocation("/auth")} className="block hover:text-[#fa5100] transition-colors">Sign In</button>
                <button onClick={() => setLocation("/auth")} className="block hover:text-[#fa5100] transition-colors">Register</button>
                <button onClick={() => setLocation("/orders")} className="block hover:text-[#fa5100] transition-colors">My Orders</button>
                <button onClick={() => setLocation("/cart")} className="block hover:text-[#fa5100] transition-colors">Cart</button>
              </div>
            </div>
            <div>
              <p className="font-bold text-gray-700 mb-2">Support</p>
              <div className="space-y-1.5">
                <button onClick={() => setLocation("/track")} className="block hover:text-[#fa5100] transition-colors">Track Order</button>
                <span className="block">Free Shipping</span>
                <span className="block">Buyer Protection</span>
                <span className="block">Easy Returns</span>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4 text-center text-xs text-gray-400">
            <p className="font-bold text-gray-600 mb-1">temu <span className="text-[#fa5100]">Lite</span></p>
            <p>Shop with confidence · Buyer Protection · Fast Shipping</p>
            <p className="mt-2">© 2026 Temu Lite. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
