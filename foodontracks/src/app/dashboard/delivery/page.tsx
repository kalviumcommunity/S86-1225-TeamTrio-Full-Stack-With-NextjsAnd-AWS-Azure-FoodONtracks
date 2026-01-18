'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types/user';
import { Spinner } from '@/components/ui/Spinner';
import { Package, Clock, Truck, CheckCircle, Wallet } from 'lucide-react';

interface DeliveryStats {
  todayDeliveries: number;
  pendingPickups: number;
  inTransit: number;
  completed: number;
  earnings: number;
  rating: number;
}

export default function DeliveryDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DeliveryStats | null>(null);

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
        if (user.role !== UserRole.DELIVERY_GUY) {
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

        // Fetch stats
        const statsRes = await fetch('/api/delivery/stats');
        if (statsRes?.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
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
      <div className="flex items-center justify-center p-6">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Today&apos;s Deliveries</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-transparent bg-clip-text">{stats?.todayDeliveries || 0}</p>
            </div>
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500">
              <Package className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Pickups</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats?.pendingPickups || 0}</p>
            </div>
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/40">
              <Clock className="w-7 h-7 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">In Transit</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats?.inTransit || 0}</p>
            </div>
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/40">
              <Truck className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completed Today</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats?.completed || 0}</p>
            </div>
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/40">
              <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Earnings Summary */}
      {stats && stats.earnings > 0 && (
        <div className="bg-linear-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-lg p-8 mt-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg opacity-90 mb-2">Today&apos;s Earnings</p>
              <p className="text-5xl font-bold">₹{stats.earnings.toFixed(2)}</p>
            </div>
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 shadow-md">
              <Wallet className="w-9 h-9" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
