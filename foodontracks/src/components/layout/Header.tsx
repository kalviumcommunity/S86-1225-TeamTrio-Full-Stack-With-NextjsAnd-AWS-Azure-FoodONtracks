"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShoppingCart, User as UserIcon, LogOut, Train } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface User {
  userId: number;
  email: string;
  role: string;
  name?: string;
}

export default function Header() {
  const router = useRouter();
  const { getTotalItems } = useCart();
  const cartCount = getTotalItems();

  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const verifyAuth = async () => {
      try {
        const response = await fetch("/api/auth/verify", { credentials: "include" });
        if (!response.ok) return;

        const data = await response.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
        }
      } catch {
        // silently ignore, user considered unauthenticated
      }
    };

    verifyAuth();
  }, [mounted]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      toast.success("Logged out successfully");
      setUser(null);
      setIsAuthenticated(false);
      setShowUserMenu(false);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed");
    }
  };

  const getDashboardLink = () => {
    if (!user) return "/dashboard";
    const roleMap: Record<string, string> = {
      ADMIN: "/dashboard/admin",
      RESTAURANT_OWNER: "/dashboard/restaurant",
      CUSTOMER: "/dashboard/customer",
      DELIVERY_GUY: "/dashboard/delivery",
    };
    return roleMap[user.role] || "/dashboard";
  };

  const displayName = user?.name || user?.email?.split("@")[0] || "User";

  return (
    <header className="w-full bg-white dark:bg-gray-900 border-b border-yellow-200 dark:border-yellow-700 px-6 py-3 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-md group-hover:shadow-lg transition-shadow">
            <Train className="w-4 h-4" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-yellow-500 to-orange-600 bg-clip-text text-transparent">
            FoodONtracks
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link
            href="/"
            className="text-gray-700 hover:text-orange-600 dark:text-gray-200 dark:hover:text-orange-400 transition-colors"
          >
            Home
          </Link>
          <Link
            href="/restaurants"
            className="text-gray-700 hover:text-orange-600 dark:text-gray-200 dark:hover:text-orange-400 transition-colors"
          >
            Restaurants
          </Link>

          {/* Cart */}
          <Link href="/cart" className="relative">
            <button className="hover:text-orange-600 dark:hover:text-orange-400 transition flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  {cartCount}
                </span>
              )}
            </button>
          </Link>

          {/* Auth controls */}
          {mounted && (
            isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu((open) => !open)}
                  className="flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-800 dark:text-gray-100 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-xs font-semibold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate">{displayName}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg z-20">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {user?.role?.replace("_", " ").toLowerCase()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push(getDashboardLink());
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>Dashboard</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-orange-600 dark:text-gray-200 dark:hover:text-orange-400 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-1.5 text-sm font-semibold text-gray-900 shadow-sm hover:shadow-md transition-shadow"
                >
                  Sign Up
                </Link>
              </div>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
