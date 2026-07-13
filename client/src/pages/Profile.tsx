import { useState } from "react";
import { useUser } from "@/hooks/use-auth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ImageUpload } from "@/components/ImageUpload";
import { Link } from "wouter";
import {
  User, Mail, Phone, Lock, Bell, ShoppingBag, Store,
  Shield, Check, Loader2, Package, Settings, Star, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  vendor: "bg-blue-100 text-blue-700",
  customer: "bg-green-100 text-green-700",
};

const roleIcons: Record<string, any> = {
  admin: Shield,
  vendor: Store,
  customer: User,
};

export default function Profile() {
  const { data: user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "", bio: "", avatarUrl: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [formLoaded, setFormLoaded] = useState(false);

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<any[]>({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

  if (user && !formLoaded) {
    setProfileForm({
      name: user.name || "",
      email: (user as any).email || "",
      phone: (user as any).phone || "",
      bio: (user as any).bio || "",
      avatarUrl: (user as any).avatarUrl || "",
    });
    setFormLoaded(true);
  }

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Profile updated", description: "Your profile has been saved successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/profile/change-password", data);
      return res.json();
    },
    onSuccess: () => {
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({ title: "Password changed", description: "Your password has been updated successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
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

  const handleProfileSave = () => {
    if (!profileForm.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    updateProfileMutation.mutate(profileForm);
  };

  const handlePasswordChange = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast({ title: "Password too short", description: "Must be at least 6 characters.", variant: "destructive" });
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container px-4 py-24 text-center">
          <User className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-40" />
          <h2 className="text-2xl font-bold mb-2">Sign in to view your profile</h2>
          <p className="text-muted-foreground mb-8">Manage your account, orders, and preferences.</p>
          <Link href="/auth">
            <Button size="lg">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  const RoleIcon = roleIcons[user.role] || User;
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;
  const recentOrders = orders.slice(0, 5);

  const totalSpent = orders
    .filter((o: any) => ["paid", "shipped", "completed"].includes(o.status))
    .reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    awaiting_confirmation: "bg-orange-100 text-orange-700",
    paid: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <Navbar />

      <div className="container px-4 py-8 max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-8 p-6 bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-2xl border border-orange-100">
          <div className="relative">
            {(user as any).avatarUrl ? (
              <img
                src={(user as any).avatarUrl}
                alt={user.name}
                className="h-20 w-20 rounded-2xl object-cover border-2 border-white shadow-md"
              />
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-[#fa5100] flex items-center justify-center shadow-md">
                <span className="text-3xl font-black text-white">{user.name.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <Badge className={cn("capitalize text-xs font-semibold", roleColors[user.role])}>
                <RoleIcon className="h-3 w-3 mr-1" />
                {user.role}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
            {(user as any).email && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Mail className="h-3 w-3" />
                {(user as any).email}
              </p>
            )}
          </div>
          {user.role === "customer" && (
            <div className="flex gap-4 shrink-0">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#fa5100]">{orders.length}</p>
                <p className="text-xs text-muted-foreground">Orders</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#fa5100]">${totalSpent.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Spent</p>
              </div>
            </div>
          )}
          {user.role === "vendor" && (
            <div className="flex gap-4 shrink-0">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#fa5100]">{orders.length}</p>
                <p className="text-xs text-muted-foreground">Orders</p>
              </div>
            </div>
          )}
          {user.role === "admin" && (
            <div className="text-center shrink-0">
              <p className="text-2xl font-bold text-[#fa5100]">{orders.length}</p>
              <p className="text-xs text-muted-foreground">Total Orders</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-gray-100 p-1 rounded-xl mb-6">
            <TabsTrigger value="profile" className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm" data-testid="tab-profile">
              <User className="h-3.5 w-3.5" /> Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm" data-testid="tab-security">
              <Lock className="h-3.5 w-3.5" /> Security
            </TabsTrigger>
            {user.role === "customer" && (
              <TabsTrigger value="orders" className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm" data-testid="tab-orders">
                <ShoppingBag className="h-3.5 w-3.5" /> My Orders
              </TabsTrigger>
            )}
            {user.role === "vendor" && (
              <TabsTrigger value="store" className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm" data-testid="tab-store">
                <Store className="h-3.5 w-3.5" /> Store
              </TabsTrigger>
            )}
            {user.role === "admin" && (
              <TabsTrigger value="overview" className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm" data-testid="tab-overview">
                <Settings className="h-3.5 w-3.5" /> Overview
              </TabsTrigger>
            )}
            <TabsTrigger value="notifications" className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm relative" data-testid="tab-notifications">
              <Bell className="h-3.5 w-3.5" /> Notifications
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#fa5100] text-white text-[9px] flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Personal Info Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-[#fa5100]" /> Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="name"
                      value={profileForm.name}
                      onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Your full name"
                      data-testid="input-profile-name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">
                      <Mail className="h-3.5 w-3.5 inline mr-1" /> Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="you@email.com"
                      data-testid="input-profile-email"
                    />
                    <p className="text-xs text-muted-foreground">Used for order confirmations and alerts.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">
                      <Phone className="h-3.5 w-3.5 inline mr-1" /> Phone Number
                    </Label>
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+1 234 567 8900"
                      data-testid="input-profile-phone"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Username</Label>
                    <Input value={user.username} disabled className="bg-gray-50 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Username cannot be changed.</p>
                  </div>
                </div>

                {(user.role === "vendor" || user.role === "admin") && (
                  <div className="space-y-1.5">
                    <Label htmlFor="bio">
                      {user.role === "vendor" ? "Store Description" : "Admin Bio"}
                    </Label>
                    <Textarea
                      id="bio"
                      value={profileForm.bio}
                      onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))}
                      placeholder={user.role === "vendor" ? "Describe your store, products, and specialties..." : "About you as an admin..."}
                      className="resize-none"
                      rows={3}
                      data-testid="textarea-profile-bio"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <ImageUpload
                    value={profileForm.avatarUrl}
                    onChange={url => setProfileForm(p => ({ ...p, avatarUrl: url }))}
                    label="Profile Avatar"
                  />
                </div>

                <Button
                  onClick={handleProfileSave}
                  disabled={updateProfileMutation.isPending}
                  className="w-full sm:w-auto"
                  data-testid="button-save-profile"
                >
                  {updateProfileMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    <><Check className="h-4 w-4 mr-2" /> Save Changes</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-[#fa5100]" /> Change Password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                    data-testid="input-current-password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                    placeholder="Min. 6 characters"
                    data-testid="input-new-password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="Repeat new password"
                    data-testid="input-confirm-password"
                  />
                  {passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                    <p className="text-xs text-destructive">Passwords don't match.</p>
                  )}
                </div>
                <Button
                  onClick={handlePasswordChange}
                  disabled={changePasswordMutation.isPending}
                  data-testid="button-change-password"
                >
                  {changePasswordMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating...</>
                  ) : (
                    <><Lock className="h-4 w-4 mr-2" /> Update Password</>
                  )}
                </Button>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-sm mb-2 text-gray-700">Account Info</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Role</span>
                      <Badge className={cn("capitalize text-xs", roleColors[user.role])}>{user.role}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Username</span>
                      <span className="font-mono text-gray-700">@{user.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>User ID</span>
                      <span className="font-mono text-gray-700">#{user.id}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customer: Orders Tab */}
          {user.role === "customer" && (
            <TabsContent value="orders">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-[#fa5100]" /> Order History
                  </CardTitle>
                  <Link href="/orders">
                    <Button variant="outline" size="sm" data-testid="button-view-all-orders">View All</Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : recentOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground opacity-40 mb-3" />
                      <p className="text-muted-foreground">No orders yet</p>
                      <Link href="/">
                        <Button size="sm" className="mt-4" data-testid="button-start-shopping">Start Shopping</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentOrders.map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between p-3 rounded-xl border hover:border-primary/30 transition-colors" data-testid={`order-row-${order.id}`}>
                          <div className="space-y-0.5">
                            <p className="font-semibold text-sm">Order #{order.id}</p>
                            <p className="text-xs text-muted-foreground">
                              {order.createdAt && format(new Date(order.createdAt), "MMM d, yyyy")} · {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={cn("text-xs capitalize", statusColors[order.status] || "")} data-testid={`badge-order-status-${order.id}`}>
                              {order.status.replace(/_/g, " ")}
                            </Badge>
                            <span className="font-bold text-sm text-primary">${Number(order.totalAmount).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Vendor: Store Tab */}
          {user.role === "vendor" && (
            <TabsContent value="store">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5 text-[#fa5100]" /> Store Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Store Name</Label>
                      <Input
                        value={profileForm.name}
                        onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="Your store name"
                        data-testid="input-store-name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Store Description</Label>
                      <Textarea
                        value={profileForm.bio}
                        onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))}
                        placeholder="What do you sell? Tell customers about your store..."
                        className="resize-none"
                        rows={4}
                        data-testid="textarea-store-bio"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Contact Email</Label>
                      <Input
                        type="email"
                        value={profileForm.email}
                        onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="store@email.com"
                        data-testid="input-store-email"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Contact Phone</Label>
                      <Input
                        value={profileForm.phone}
                        onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="+1 234 567 8900"
                        data-testid="input-store-phone"
                      />
                    </div>
                    <ImageUpload
                      value={profileForm.avatarUrl}
                      onChange={url => setProfileForm(p => ({ ...p, avatarUrl: url }))}
                      label="Store Logo / Avatar"
                    />
                    <Button onClick={handleProfileSave} disabled={updateProfileMutation.isPending} data-testid="button-save-store">
                      {updateProfileMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : <><Check className="h-4 w-4 mr-2" /> Save Store Settings</>}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-[#fa5100]" /> Sales Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ordersLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-orange-50 rounded-xl">
                          <p className="text-2xl font-bold text-[#fa5100]">{orders.length}</p>
                          <p className="text-xs text-muted-foreground mt-1">Total Orders</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-xl">
                          <p className="text-2xl font-bold text-green-600">
                            {orders.filter((o: any) => o.status === "completed").length}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Completed</p>
                        </div>
                        <div className="p-4 bg-yellow-50 rounded-xl">
                          <p className="text-2xl font-bold text-yellow-600">
                            {orders.filter((o: any) => o.status === "awaiting_confirmation").length}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Pending</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Admin: Overview Tab */}
          {user.role === "admin" && (
            <TabsContent value="overview">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-[#fa5100]" /> Platform Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ordersLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                        <div className="p-4 bg-orange-50 rounded-xl">
                          <p className="text-2xl font-bold text-[#fa5100]">{orders.length}</p>
                          <p className="text-xs text-muted-foreground mt-1">Total Orders</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-xl">
                          <p className="text-2xl font-bold text-blue-600">
                            ${orders.reduce((s: number, o: any) => s + Number(o.totalAmount), 0).toFixed(0)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Total Revenue</p>
                        </div>
                        <div className="p-4 bg-yellow-50 rounded-xl">
                          <p className="text-2xl font-bold text-yellow-600">
                            {orders.filter((o: any) => o.status === "awaiting_confirmation").length}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Pending Confirm</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-xl">
                          <p className="text-2xl font-bold text-green-600">
                            {orders.filter((o: any) => o.status === "completed").length}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Completed</p>
                        </div>
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                      <Link href="/dashboard">
                        <Button variant="outline" size="sm" data-testid="button-go-admin">Admin Dashboard</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-[#fa5100]" /> Admin Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Display Name</Label>
                        <Input
                          value={profileForm.name}
                          onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                          data-testid="input-admin-name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Admin Email</Label>
                        <Input
                          type="email"
                          value={profileForm.email}
                          onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                          placeholder="admin@temulite.com"
                          data-testid="input-admin-email"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Admin Bio</Label>
                      <Textarea
                        value={profileForm.bio}
                        onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))}
                        placeholder="About you as the platform admin..."
                        rows={3}
                        className="resize-none"
                        data-testid="textarea-admin-bio"
                      />
                    </div>
                    <ImageUpload
                      value={profileForm.avatarUrl}
                      onChange={url => setProfileForm(p => ({ ...p, avatarUrl: url }))}
                      label="Admin Avatar"
                    />
                    <Button onClick={handleProfileSave} disabled={updateProfileMutation.isPending} data-testid="button-save-admin-profile">
                      {updateProfileMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : <><Check className="h-4 w-4 mr-2" /> Save Profile</>}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-[#fa5100]" /> Notifications
                  {unreadCount > 0 && (
                    <Badge className="bg-[#fa5100] text-white text-xs">{unreadCount} unread</Badge>
                  )}
                </CardTitle>
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAllReadMutation.mutate()}
                    disabled={markAllReadMutation.isPending}
                    data-testid="button-mark-all-read"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" /> Mark all read
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-3" />
                    <p className="text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((n: any) => (
                      <div
                        key={n.id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors hover:border-primary/30",
                          !n.isRead ? "bg-orange-50/60 border-orange-100" : "bg-white border-gray-100"
                        )}
                        onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
                        data-testid={`notification-${n.id}`}
                      >
                        <div className={cn("h-2 w-2 rounded-full mt-2 shrink-0", !n.isRead ? "bg-[#fa5100]" : "bg-gray-200")} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn("text-sm font-semibold truncate", !n.isRead ? "text-gray-900" : "text-gray-600")}>{n.title}</p>
                            {n.createdAt && (
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {format(new Date(n.createdAt), "MMM d, h:mm a")}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                        </div>
                        {n.link && (
                          <Link href={n.link} onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs shrink-0">View</Button>
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
