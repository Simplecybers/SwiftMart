import { Link, useLocation } from "wouter";
import { ShoppingCart, Search, LogOut, User as UserIcon, ChevronDown, MapPin, Bell } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useUser, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [, setLocation] = useLocation();
  const cartItems = useCart((state) => state.items);
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const [search, setSearch] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#fa5100] shadow-md">
      {/* Main navbar row */}
      <div className="flex items-center gap-3 px-4 py-2.5 max-w-screen-xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0 flex items-center gap-1" data-testid="link-logo">
          <span className="text-white font-black text-2xl tracking-tight leading-none">temu</span>
          <span className="bg-white text-[#fa5100] text-[9px] font-bold px-1 rounded uppercase leading-tight ml-0.5 mt-0.5">Lite</span>
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 flex items-center bg-white rounded-full overflow-hidden shadow-inner border-2 border-white/80" data-testid="form-search">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Free shipping on millions of items"
            className="flex-1 pl-4 pr-2 py-2 text-sm text-gray-700 bg-transparent focus:outline-none placeholder:text-gray-400"
            data-testid="input-search"
          />
          <button type="submit" className="bg-[#fa5100] hover:bg-[#e04800] px-4 py-2 flex items-center justify-center rounded-r-full transition-colors" data-testid="button-search-submit">
            <Search className="h-4 w-4 text-white" />
          </button>
        </form>

        {/* Right icons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Cart */}
          <Link href="/cart" data-testid="link-cart">
            <button className="relative flex flex-col items-center px-2 py-1 text-white hover:bg-white/10 rounded-lg transition-colors" data-testid="button-cart">
              <div className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-gray-900" data-testid="cart-count">
                    {cartItems.length}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 font-medium">Cart</span>
            </button>
          </Link>

          {/* User */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex flex-col items-center px-2 py-1 text-white hover:bg-white/10 rounded-lg transition-colors" data-testid="button-user-menu">
                  <UserIcon className="h-5 w-5" />
                  <span className="text-[10px] mt-0.5 font-medium max-w-[60px] truncate">{user.name.split(" ")[0]}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-1">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-semibold">{user.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role} account</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer" data-testid="link-admin-dashboard">Admin Dashboard</Link>
                  </DropdownMenuItem>
                )}
                {user.role === 'vendor' && (
                  <DropdownMenuItem asChild>
                    <Link href="/vendor" className="cursor-pointer" data-testid="link-vendor-dashboard">Vendor Dashboard</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/orders" className="cursor-pointer" data-testid="link-orders">My Orders</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="text-destructive focus:text-destructive cursor-pointer"
                  data-testid="button-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth" data-testid="link-signin">
              <button className="flex flex-col items-center px-2 py-1 text-white hover:bg-white/10 rounded-lg transition-colors" data-testid="button-signin">
                <UserIcon className="h-5 w-5" />
                <span className="text-[10px] mt-0.5 font-medium">Sign In</span>
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Category bar */}
      <div className="bg-[#fa5100] border-t border-white/20">
        <div className="max-w-screen-xl mx-auto px-4 py-1.5 flex items-center gap-4 overflow-x-auto scrollbar-hide">
          {[
            { label: "New Arrivals", href: "/" },
            { label: "Best Sellers", href: "/" },
            { label: "Electronics", href: "/" },
            { label: "Fashion", href: "/" },
            { label: "Home & Kitchen", href: "/" },
            { label: "Beauty", href: "/" },
            { label: "Sports", href: "/" },
            { label: "Toys", href: "/" },
            { label: "Track Order", href: "/track" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-white/90 hover:text-white text-xs font-medium whitespace-nowrap transition-colors"
              data-testid={`link-cat-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
