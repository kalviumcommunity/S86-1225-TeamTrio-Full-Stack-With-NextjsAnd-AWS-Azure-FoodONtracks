'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, UtensilsCrossed, ShoppingCart, Package, FileText, ShoppingBag } from 'lucide-react';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    { href: '/dashboard/customer', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/restaurants', label: 'Browse Restaurants', icon: UtensilsCrossed },
    { href: '/cart', label: 'My Cart', icon: ShoppingCart },
    { href: '/dashboard/customer/batch-tracking', label: 'Track Batch', icon: Package },
    { href: '/orders', label: 'Order History', icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col border-r border-yellow-700/20">
        <div className="p-6 border-b border-yellow-600/20">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold">Customer</h1>
          </div>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const IconComponent = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-md'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-24">
        {children}
      </main>
    </div>
  );
}
