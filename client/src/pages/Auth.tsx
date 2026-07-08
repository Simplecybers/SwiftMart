import { useState } from "react";
import { useLogin, useRegister, useUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ShoppingBag, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function Auth() {
  const [, setLocation] = useLocation();
  const { data: user } = useUser();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);

  if (user) {
    setLocation("/");
    return null;
  }

  const { mutate: login, isPending: isLoginPending } = useLogin();
  const { mutate: register, isPending: isRegisterPending } = useRegister();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData);
    login(data as any, {
      onError: (error) => {
        toast({ title: "Login failed", description: error.message, variant: "destructive" });
      },
    });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData);
    register({ ...data, role: "customer" } as any, {
      onError: (error) => {
        toast({ title: "Registration failed", description: error.message, variant: "destructive" });
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#fa5100] py-4 px-4 flex items-center gap-2">
        <button onClick={() => setLocation("/")} className="text-white/80 hover:text-white mr-2" data-testid="button-back-home">
          ←
        </button>
        <span className="text-white font-black text-xl tracking-tight">temu</span>
        <span className="bg-white text-[#fa5100] text-[9px] font-bold px-1 rounded uppercase">Lite</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setMode("login")}
                className={`flex-1 py-4 text-sm font-bold transition-colors ${mode === "login" ? "text-[#fa5100] border-b-2 border-[#fa5100]" : "text-gray-400 hover:text-gray-600"}`}
                data-testid="tab-login"
              >
                Sign In
              </button>
              <button
                onClick={() => setMode("register")}
                className={`flex-1 py-4 text-sm font-bold transition-colors ${mode === "register" ? "text-[#fa5100] border-b-2 border-[#fa5100]" : "text-gray-400 hover:text-gray-600"}`}
                data-testid="tab-register"
              >
                Register
              </button>
            </div>

            <div className="p-6">
              {mode === "login" ? (
                <>
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ShoppingBag className="h-6 w-6 text-[#fa5100]" />
                    </div>
                    <h2 className="text-lg font-black text-gray-800">Welcome Back!</h2>
                    <p className="text-xs text-gray-400 mt-1">Sign in to continue shopping</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4" data-testid="form-login">
                    <div>
                      <Label htmlFor="username" className="text-xs font-semibold text-gray-600 mb-1.5 block">Username</Label>
                      <Input
                        id="username"
                        name="username"
                        required
                        placeholder="Enter your username"
                        className="border-gray-200 rounded-xl focus:border-[#fa5100] focus:ring-[#fa5100]"
                        data-testid="input-username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password" className="text-xs font-semibold text-gray-600 mb-1.5 block">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder="Enter your password"
                          className="border-gray-200 rounded-xl focus:border-[#fa5100] focus:ring-[#fa5100] pr-10"
                          data-testid="input-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="bg-orange-50 rounded-xl p-3 text-xs text-gray-600">
                      <p className="font-semibold text-gray-700 mb-1">Demo accounts:</p>
                      <p>Admin: <code className="bg-white px-1 rounded text-[#fa5100]">demo</code> / <code className="bg-white px-1 rounded text-[#fa5100]">password</code></p>
                      <p>Vendor: <code className="bg-white px-1 rounded text-[#fa5100]">vendor</code> / <code className="bg-white px-1 rounded text-[#fa5100]">password</code></p>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoginPending}
                      className="w-full bg-[#fa5100] hover:bg-[#e04800] disabled:bg-gray-300 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                      data-testid="button-login-submit"
                    >
                      {isLoginPending ? "Signing in..." : <>Sign In <ArrowRight className="h-4 w-4" /></>}
                    </button>
                  </form>

                  <p className="text-center text-xs text-gray-400 mt-4">
                    New to Temu Lite?{" "}
                    <button onClick={() => setMode("register")} className="text-[#fa5100] font-semibold" data-testid="button-switch-to-register">
                      Create account
                    </button>
                  </p>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ShoppingBag className="h-6 w-6 text-[#fa5100]" />
                    </div>
                    <h2 className="text-lg font-black text-gray-800">Join Temu Lite</h2>
                    <p className="text-xs text-gray-400 mt-1">Create your free account today</p>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-4" data-testid="form-register">
                    <div>
                      <Label htmlFor="reg-name" className="text-xs font-semibold text-gray-600 mb-1.5 block">Full Name</Label>
                      <Input
                        id="reg-name"
                        name="name"
                        required
                        placeholder="Your full name"
                        className="border-gray-200 rounded-xl focus:border-[#fa5100] focus:ring-[#fa5100]"
                        data-testid="input-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="reg-username" className="text-xs font-semibold text-gray-600 mb-1.5 block">Username</Label>
                      <Input
                        id="reg-username"
                        name="username"
                        required
                        placeholder="Choose a username"
                        className="border-gray-200 rounded-xl focus:border-[#fa5100] focus:ring-[#fa5100]"
                        data-testid="input-reg-username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="reg-password" className="text-xs font-semibold text-gray-600 mb-1.5 block">Password</Label>
                      <div className="relative">
                        <Input
                          id="reg-password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder="Create a password"
                          className="border-gray-200 rounded-xl focus:border-[#fa5100] focus:ring-[#fa5100] pr-10"
                          data-testid="input-reg-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          data-testid="button-toggle-reg-password"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isRegisterPending}
                      className="w-full bg-[#fa5100] hover:bg-[#e04800] disabled:bg-gray-300 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                      data-testid="button-register-submit"
                    >
                      {isRegisterPending ? "Creating account..." : <>Create Account <ArrowRight className="h-4 w-4" /></>}
                    </button>
                  </form>

                  <p className="text-center text-xs text-gray-400 mt-4">
                    Already have an account?{" "}
                    <button onClick={() => setMode("login")} className="text-[#fa5100] font-semibold" data-testid="button-switch-to-login">
                      Sign in
                    </button>
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
            <span>🔒 Secure Login</span>
            <span>🛡️ Privacy Protected</span>
            <span>✅ Free to Join</span>
          </div>
        </div>
      </div>
    </div>
  );
}
