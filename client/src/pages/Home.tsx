import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: products, isLoading } = useProducts({ search: searchTerm });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Re-fetch triggers automatically via state
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const trackingId = formData.get("trackingId");
    if (trackingId) {
      setLocation(`/track/${trackingId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-accent/30 border-b border-border/50 py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="flex flex-col justify-center space-y-6">
              <div className="space-y-2">
                <h1 className="text-4xl font-display font-extrabold tracking-tight sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary to-orange-600">
                  Shop Smarter, <br /> Track Better.
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl leading-relaxed">
                  Discover millions of products at unbeatable prices. Real-time tracking included with every order.
                </p>
              </div>

              {/* Quick Track Input */}
              <div className="w-full max-w-sm space-y-2">
                <form onSubmit={handleTrackSubmit} className="flex gap-2 p-2 bg-white rounded-xl shadow-lg shadow-primary/5 border border-border">
                  <Input 
                    name="trackingId"
                    placeholder="Enter Tracking ID..." 
                    className="border-0 shadow-none focus-visible:ring-0 bg-transparent"
                  />
                  <Button type="submit" className="font-semibold shadow-lg shadow-primary/20">Track</Button>
                </form>
                <p className="text-xs text-muted-foreground px-2">
                  Try example: <code className="bg-muted px-1 rounded">TRK123456</code>
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-center lg:justify-end">
              {/* Using a placeholder for hero image */}
              <div className="relative w-full max-w-[500px] aspect-square bg-gradient-to-tr from-orange-100 to-orange-50 rounded-full flex items-center justify-center animate-in fade-in zoom-in duration-700">
                 <img 
                   src="https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80&w=800" 
                   alt="Shopping Hero" 
                   className="rounded-3xl shadow-2xl shadow-orange-900/10 w-4/5 h-4/5 object-cover transform rotate-3 hover:rotate-0 transition-transform duration-500"
                 />
                 {/* Decorative elements */}
                 <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-border/50 animate-bounce delay-700">
                   <div className="flex items-center gap-3">
                     <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                       <Search className="h-5 w-5" />
                     </div>
                     <div>
                       <p className="text-sm font-bold">Track Anything</p>
                       <p className="text-xs text-muted-foreground">Real-time updates</p>
                     </div>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <h2 className="text-3xl font-display font-bold tracking-tight">Trending Now</h2>
            <div className="flex items-center gap-2">
              {['Electronics', 'Fashion', 'Home', 'Beauty'].map((cat) => (
                <Button key={cat} variant="outline" size="sm" className="rounded-full">
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="aspect-square rounded-xl bg-muted animate-pulse" />
                  <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
