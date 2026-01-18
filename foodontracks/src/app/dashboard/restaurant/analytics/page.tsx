'use client';

import { Package, Star, Wallet } from 'lucide-react';

export default function RestaurantAnalyticsPage() {
  const stats = [
    { label: 'Total Revenue', value: '$0', Icon: Wallet, color: 'text-emerald-500' },
    { label: 'Total Orders', value: '0', Icon: Package, color: 'text-blue-500' },
    { label: 'Avg Rating', value: '4.5', Icon: Star, color: 'text-yellow-400' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Restaurant Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
              </div>
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-900/40 shadow-sm ${stat.color}`}>
                <stat.Icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Performance Overview</h2>
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>Analytics charts will be displayed here</p>
        </div>
      </div>
    </div>
  );
}
