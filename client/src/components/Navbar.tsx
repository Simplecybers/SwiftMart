import { Link, useLocation, useSearch } from "wouter";
import { ShoppingCart, Search, LogOut, User as UserIcon, Bell, Store, Shield, Settings } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useUser, useLogout } from "@/hooks/use-auth";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export function Navbar() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const cartItems = useCart((state) => state.items);
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const queryClient = useQueryClient();
  const initialSearch = new URLSearchParams(searchString).get("search") || "";
  const [search, setSearch] = useState(initialSearch);

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/notifications/${id}/read`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", "/api/notifications/read-all", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = search.trim();
    setLocation(trimmed ? `/?search=${encodeURIComponent(trimmed)}` : "/");
  };

  const unreadCount = unreadData?.count ?? 0;
  const recentNotifications = notifications.slice(0, 5);

  const roleColors: Record<string, string> = {
    admin: "text-red-600",
    vendor: "text-blue-600",
    customer: "text-green-600",
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

          {/* Notification Bell */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative flex flex-col items-center px-2 py-1 text-white hover:bg-white/10 rounded-lg transition-colors" data-testid="button-notifications">
                  <div className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-gray-900" data-testid="notification-count">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] mt-0.5 font-medium">Alerts</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-80 mt-1 bg-white border border-gray-200 shadow-xl text-gray-900 rounded-xl p-0 overflow-hidden"
                data-testid="notifications-dropdown"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <span className="text-sm font-bold text-gray-900">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllReadMutation.mutate()}
                      className="text-xs text-[#fa5100] font-semibold hover:underline"
                      data-testid="button-mark-all-read-nav"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                {recentNotifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-400">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No notifications yet
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                    {recentNotifications.map((n: any) => (
                      <div
                        key={n.id}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors",
                          !n.isRead && "bg-orange-50/70"
                        )}
                        onClick={() => {
                          if (!n.isRead) markReadMutation.mutate(n.id);
                          if (n.link) setLocation(n.link);
                        }}
                        data-testid={`nav-notification-${n.id}`}
                      >
                        <div className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", !n.isRead ? "bg-[#fa5100]" : "bg-gray-200")} />
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-xs font-semibold truncate", !n.isRead ? "text-gray-900" : "text-gray-600")}>{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                          {n.createdAt && (
                            <p className="text-[10px] text-gray-400 mt-1">{format(new Date(n.createdAt), "MMM d, h:mm a")}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="border-t border-gray-100 p-2 bg-gray-50">
                  <Link href="/profile?tab=notifications">
                    <button className="w-full text-xs text-center text-[#fa5100] font-semibold py-1 hover:underline" data-testid="link-all-notifications">
                      View all notifications
                    </button>
                  </Link>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex flex-col items-center px-2 py-1 text-white hover:bg-white/10 rounded-lg transition-colors" data-testid="button-user-menu">
                  {(user as any).avatarUrl ? (
                    <img src={(user as any).avatarUrl} alt={user.name} className="h-6 w-6 rounded-full object-cover border border-white/50" />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-[11px] font-black text-white">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <span className="text-[10px] mt-0.5 font-medium max-w-[60px] truncate">{user.name.split(" ")[0]}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 mt-1 bg-white border border-gray-200 shadow-xl text-gray-900 rounded-xl p-1"
                data-testid="user-dropdown"
              >
                <DropdownMenuLabel className="px-3 py-2">
                  <div className="flex items-center gap-2.5">
                    {(user as any).avatarUrl ? (
                      <img src={(user as any).avatarUrl} alt={user.name} className="h-8 w-8 rounded-lg object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded-lg bg-[#fa5100] flex items-center justify-center shrink-0">
                        <span className="text-sm font-black text-white">{user.name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                      <p className={cn("text-xs capitalize font-medium", roleColors[user.role] || "text-gray-500")}>{user.role} account</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-100" />

                {user.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-orange-50 hover:text-[#fa5100] rounded-lg cursor-pointer" data-testid="link-admin-dashboard">
                      <Shield className="h-4 w-4 text-red-500" />
                      Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                {user.role === "vendor" && (
                  <DropdownMenuItem asChild>
                    <Link href="/vendor" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-orange-50 hover:text-[#fa5100] rounded-lg cursor-pointer" data-testid="link-vendor-dashboard">
                      <Store className="h-4 w-4 text-blue-500" />
                      Vendor Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-orange-50 hover:text-[#fa5100] rounded-lg cursor-pointer" data-testid="link-profile">
                    <UserIcon className="h-4 w-4 text-gray-500" />
                    My Profile
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/orders" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-orange-50 hover:text-[#fa5100] rounded-lg cursor-pointer" data-testid="link-orders">
                    <ShoppingCart className="h-4 w-4 text-gray-500" />
                    My Orders
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/profile?tab=notifications" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-orange-50 hover:text-[#fa5100] rounded-lg cursor-pointer" data-testid="link-notifications">
                    <Bell className="h-4 w-4 text-gray-500" />
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-auto text-[10px] bg-[#fa5100] text-white rounded-full px-1.5 py-0.5 font-bold">{unreadCount}</span>
                    )}
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-gray-100" />
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg cursor-pointer"
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4" />
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
            { label: "Electronics", href: "/?category=Electronics" },
            { label: "Fashion", href: "/?category=Fashion" },
            { label: "Home & Kitchen", href: "/?category=Home" },
            { label: "Beauty", href: "/?category=Beauty" },
            { label: "Sports", href: "/?category=Sports" },
            { label: "Toys", href: "/?category=Toys" },
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
