'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  UtensilsCrossed,
  ShoppingBag,
  Package,
  BarChart3,
  Heart,
  Truck,
  FileText,
  Home,
  LogOut,
} from 'lucide-react';

interface User {
  userId: number;
  email: string;
  role: string;
  restaurantId?: string;
}

interface NavLink {
  href: string;
  label: string;
  icon: string;
  roles?: string[]; // If specified, only show for these roles
}

// Role-based navigation configuration
const getRoleLinks = (role: string): NavLink[] => {
  const baseLinks: NavLink[] = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  ];

  const roleSpecificLinks: Record<string, NavLink[]> = {
    ADMIN: [
      { href: '/dashboard/admin', label: 'Admin Panel', icon: '👑' },
      { href: '/users', label: 'Users', icon: '👥' },
      { href: '/dashboard/admin/restaurants', label: 'Restaurants', icon: '🏪' },
      { href: '/dashboard/admin/orders', label: 'All Orders', icon: '📦' },
      { href: '/dashboard/admin/analytics', label: 'Analytics', icon: '📈' },
    ],
    RESTAURANT_OWNER: [
      { href: '/dashboard/restaurant', label: 'Dashboard', icon: '🏪' },
      { href: '/dashboard/restaurant/orders', label: 'Orders', icon: '📦' },
      { href: '/dashboard/restaurant/menu', label: 'Menu', icon: '🍽️' },
      { href: '/dashboard/restaurant/batches', label: 'Batches', icon: '📋' },
      { href: '/dashboard/restaurant/reviews', label: 'Reviews', icon: '⭐' },
      { href: '/dashboard/restaurant/analytics', label: 'Analytics', icon: '📊' },
    ],
    CUSTOMER: [
      { href: '/dashboard/customer', label: 'My Orders', icon: '🛒' },
      { href: '/dashboard/customer/favorites', label: 'Favorites', icon: '❤️' },
      { href: '/dashboard/customer/reviews', label: 'My Reviews', icon: '⭐' },
      { href: '/restaurants', label: 'Restaurants', icon: '🏪' },
    ],
    DELIVERY_GUY: [
      { href: '/dashboard/delivery', label: 'Deliveries', icon: '🚚' },
      { href: '/dashboard/delivery/active', label: 'Active Orders', icon: '📦' },
      { href: '/dashboard/delivery/history', label: 'History', icon: '📜' },
    ],
  };

  return roleSpecificLinks[role] || baseLinks;
};

export default function Sidebar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Set mounted after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Verify authentication on mount only
  useEffect(() => {
    if (!mounted) return;

    const verifyAuth = async () => {
      try {
        const response = await fetch('/api/auth/verify');
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, [mounted]); // Only run after mounted

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed');
    }
  };

  // Don't render dynamic content until mounted (prevents hydration mismatch)
  if (!mounted || loading) {
    return (
      <aside className="w-64 bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 p-6 min-h-screen" aria-label="sidebar">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Navigation</h2>
        <div className="space-y-2">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </aside>
    );
  }

  const links = isAuthenticated && user ? getRoleLinks(user.role) : [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/login', label: 'Login', icon: '🔐' },
  ];

  return (
    <aside className="w-64 bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 p-6 min-h-screen flex flex-col" aria-label="sidebar">
      <div className="flex-1">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Navigation</h2>
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <span className="text-lg">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Logout button - only show when authenticated */}
        {isAuthenticated && (
          <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 w-full text-left text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <span className="text-lg">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="mt-auto pt-6 border-t border-gray-300 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">FoodONtracks v1.0</p>
        {isAuthenticated && user && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {user.email}
          </p>
        )}
      </div>
    </aside>
  );
}
