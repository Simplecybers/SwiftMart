import { Link, useLocation } from "wouter";
import { ShoppingCart, Package, Search, Menu, LogOut, User as UserIcon } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useUser, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [location] = useLocation();
  const cartItems = useCart((state) => state.items);
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="font-display text-2xl font-bold text-primary">ShopTemu</span>
        </Link>
        
        <div className="hidden md:flex flex-1 items-center space-x-4 max-w-sm ml-4">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search products..."
              className="w-full rounded-full bg-secondary pl-9 pr-4 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center space-x-4">
          <Link href="/track" className="hidden md:flex items-center text-sm font-medium hover:text-primary transition-colors">
            <Package className="mr-2 h-4 w-4" />
            Track Order
          </Link>

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {cartItems.length}
                </span>
              )}
            </Button>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <UserIcon className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.username}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  {user.role === 'admin' ? (
                    <Link href="/dashboard" className="cursor-pointer">Admin Dashboard</Link>
                  ) : user.role === 'vendor' ? (
                    <Link href="/vendor" className="cursor-pointer">Vendor Dashboard</Link>
                  ) : (
                    <Link href="/orders" className="cursor-pointer">My Orders</Link>
                  )}
                </DropdownMenuItem>
                {user.role !== 'customer' && (
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="cursor-pointer">Orders Management</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth">
              <Button size="sm" className="hidden sm:flex font-semibold">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
