'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  restaurantId?: string;
}

export default function RestaurantDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/verify')
      .then(res => res.json())
      .then(data => {
        if (!data.authenticated) {
          router.push('/');
        } else if (data.user.role !== 'RESTAURANT_OWNER') {
          router.push(`/dashboard/${data.user.role.toLowerCase().replace('_', '')}`);
        } else {
          setUser(data.user);
        }
        setLoading(false);
      })
      .catch(() => {
        router.push('/');
        setLoading(false);
      });
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Restaurant Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome, {user.name}!</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Today's Orders</div>
            <div className="text-3xl font-bold text-orange-600">0</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Pending Orders</div>
            <div className="text-3xl font-bold text-yellow-600">0</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Menu Items</div>
            <div className="text-3xl font-bold text-blue-600">0</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Revenue Today</div>
            <div className="text-3xl font-bold text-green-600">₹0</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border-2 border-orange-500 rounded-lg hover:bg-orange-50 transition text-left">
              <div className="text-lg font-semibold text-orange-600">Manage Menu</div>
              <div className="text-sm text-gray-600">Add or edit menu items</div>
            </button>
            <button className="p-4 border-2 border-yellow-500 rounded-lg hover:bg-yellow-50 transition text-left">
              <div className="text-lg font-semibold text-yellow-600">View Orders</div>
              <div className="text-sm text-gray-600">Manage incoming orders</div>
            </button>
            <button className="p-4 border-2 border-green-500 rounded-lg hover:bg-green-50 transition text-left">
              <div className="text-lg font-semibold text-green-600">Analytics</div>
              <div className="text-sm text-gray-600">View sales reports</div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
          <div className="text-center py-8 text-gray-500">
            No orders yet.
          </div>
        </div>

        <div className="mt-8 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-sm">
            <strong>Email:</strong> {user.email} <br />
            <strong>Role:</strong> {user.role} <br />
            {user.restaurantId && <><strong>Restaurant ID:</strong> {user.restaurantId}</>}
          </div>
        </div>
      </main>
    </div>
  );
}
