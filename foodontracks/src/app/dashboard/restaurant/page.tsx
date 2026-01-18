'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types/user';
import { Star, UtensilsCrossed } from 'lucide-react';

interface RestaurantStats {
  totalOrders: number;
  todayOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalBatches: number;
  activeBatches: number;
  totalReviews: number;
  averageRating: string;
}

interface Order {
  _id: string;
  orderNumber?: string;
  batchNumber: string;
  userId: { 
    _id: string;
    name?: string;
    email: string;
  };
  status: string;
  totalAmount: number;
  createdAt: string;
}

export default function RestaurantDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RestaurantStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    const verifyAndFetchData = async () => {
      try {
        // Verify authentication and role
        const verifyRes = await fetch('/api/auth/verify');
        if (!verifyRes.ok) {
          router.push('/?error=unauthorized');
          return;
        }

        const { user } = await verifyRes.json();
        if (user.role !== UserRole.RESTAURANT_OWNER) {
          // Redirect to correct dashboard
          const dashboardMap: Record<UserRole, string> = {
            [UserRole.ADMIN]: '/dashboard/admin',
            [UserRole.RESTAURANT_OWNER]: '/dashboard/restaurant',
            [UserRole.CUSTOMER]: '/dashboard/customer',
            [UserRole.DELIVERY_GUY]: '/dashboard/delivery',
          };
          router.push(dashboardMap[user.role as UserRole] || '/?error=forbidden');
          return;
        }

        // Fetch restaurant stats and orders
        const [statsRes, ordersRes] = await Promise.all([
          fetch('/api/restaurant/stats'),
          fetch('/api/restaurant/orders?limit=10'),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setRecentOrders(ordersData.orders || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    verifyAndFetchData();
  }, [router]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-orange-100 text-orange-800',
      picked_by_delivery: 'bg-indigo-100 text-indigo-800',
      out_for_delivery: 'bg-cyan-100 text-cyan-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Refresh orders list
        const ordersRes = await fetch('/api/restaurant/orders?limit=10');
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setRecentOrders(ordersData.orders || []);
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Restaurant Dashboard</h1>
          <p className="text-gray-600">Manage your restaurant operations</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-2">Today&apos;s Orders</div>
              <div className="text-3xl font-bold text-orange-600">{stats.todayOrders}</div>
              <div className="text-xs text-gray-500 mt-1">Total: {stats.totalOrders}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-2">Pending Orders</div>
              <div className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</div>
              <div className="text-xs text-gray-500 mt-1">Needs attention</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-2">Active Batches</div>
              <div className="text-3xl font-bold text-blue-600">{stats.activeBatches}</div>
              <div className="text-xs text-gray-500 mt-1">Total: {stats.totalBatches}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Rating</div>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.averageRating}</div>
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stats.totalReviews} reviews</div>
            </div>
          </div>
        )}

        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Recent Orders</h2>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 mb-3">
                <UtensilsCrossed className="w-8 h-8 text-white" />
              </div>
              <p>No orders yet. Orders will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentOrders.map((order) => (
                    <tr 
                      key={order._id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/dashboard/restaurant/orders/${order._id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div>{order.orderNumber || order.batchNumber}</div>
                        <div className="text-xs text-gray-500">Batch: {order.batchNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.userId?.name || order.userId?.email || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={order.status}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleStatusChange(order._id, e.target.value);
                          }}
                          className={`px-2 py-1 text-xs font-semibold rounded border-0 focus:ring-2 focus:ring-orange-500 cursor-pointer ${getStatusColor(order.status)}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready</option>
                          <option value="picked_by_delivery">Picked by Delivery</option>
                          <option value="out_for_delivery">Out for Delivery</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{order.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
