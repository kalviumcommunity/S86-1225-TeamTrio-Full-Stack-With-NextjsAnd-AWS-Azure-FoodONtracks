'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types/user';
import { Package, Star, Layers } from 'lucide-react';

interface AdminSummary {
  summary: {
    totalUsers: number;
    totalRestaurants: number;
    totalOrders: number;
    totalBatches: number;
    totalReviews: number;
    activeDeliveryAgents: number;
    pendingBatches: number;
    flaggedReviews: number;
  };
  recentActivity: {
    recentOrders: number;
    recentBatches: number;
    recentReviews: number;
  };
  usersByRole: Record<string, number>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AdminSummary | null>(null);

  useEffect(() => {
    const verifyAndFetchData = async () => {
      try {
        // Verify authentication and role
        const verifyRes = await fetch('/api/auth/verify');
        if (!verifyRes.ok) {
          router.push('/login?error=unauthorized&redirect=/dashboard/admin');
          return;
        }

        const { user } = await verifyRes.json();
        if (user.role !== UserRole.ADMIN) {
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

        // Fetch admin summary
        const summaryRes = await fetch('/api/admin/summary');
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          setSummary(summaryData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    verifyAndFetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-yellow-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">System Overview & Management</p>
        </div>

        {/* Stats Grid */}
        {summary && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Users</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-transparent bg-clip-text">{summary.summary.totalUsers}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Admins: {summary.usersByRole.ADMIN || 0} | Restaurants: {summary.usersByRole.RESTAURANT_OWNER || 0}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Restaurants</div>
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{summary.summary.totalRestaurants}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Active vendors</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Orders</div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{summary.summary.totalOrders}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Last 24h: {summary.recentActivity.recentOrders}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Pending Batches</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-transparent bg-clip-text">{summary.summary.pendingBatches}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">In progress deliveries</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Batches</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-transparent bg-clip-text">{summary.summary.totalBatches}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Last 24h: {summary.recentActivity.recentBatches}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Reviews</div>
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{summary.summary.totalReviews}</div>
                <div className="text-xs text-red-500 dark:text-red-400 mt-2">Flagged: {summary.summary.flaggedReviews}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Delivery Agents</div>
                <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">{summary.usersByRole.DELIVERY_GUY || 0}</div>
                <div className="text-xs text-green-500 dark:text-green-400 mt-2">Active: {summary.summary.activeDeliveryAgents}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Customers</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-transparent bg-clip-text">{summary.usersByRole.CUSTOMER || 0}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Total registered customers</div>
              </div>
            </div>
          </>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-yellow-200 dark:border-yellow-900/30">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Recent Activity (Last 24 Hours)</h2>
          {summary ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800/30">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center mr-3">
                    <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">New Orders</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{summary.recentActivity.recentOrders} orders placed</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.recentActivity.recentOrders}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800/30">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mr-3">
                    <Layers className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">New Batches</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{summary.recentActivity.recentBatches} batches created</p>
                  </div>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-transparent bg-clip-text">{summary.recentActivity.recentBatches}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg border border-amber-200 dark:border-amber-800/30">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center mr-3">
                    <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">New Reviews</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{summary.recentActivity.recentReviews} reviews submitted</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summary.recentActivity.recentReviews}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading activity...</div>
          )}
        </div>
      </div>
    </div>
  );
}
