'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Zap, FileText, Star, Truck, LogOut } from 'lucide-react';

export default function DeliveryDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard/delivery', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/dashboard/delivery/active', label: 'Active Deliveries', icon: Zap },
    { href: '/dashboard/delivery/history', label: 'History', icon: FileText },
    { href: '/dashboard/delivery/reviews', label: 'My Reviews', icon: Star },
  ];

  const isActive = (href: string, exact: boolean = false) => {
    if (!pathname) return false;
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white shrink-0 border-r border-yellow-700/20">
        <div className="p-6 border-b border-yellow-600/20">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Deliveries</h1>
          </div>
        </div>
        
        <nav className="px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
                  isActive(item.href, item.exact)
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-md'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-gray-800">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-red-400 hover:bg-gray-800 hover:text-red-300 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto pb-24">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Delivery Dashboard
            </h1>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
