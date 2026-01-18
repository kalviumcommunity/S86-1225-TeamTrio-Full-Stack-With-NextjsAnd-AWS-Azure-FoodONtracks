'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { Bike, Package, Phone } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Order {
  _id: string;
  batchNumber?: string;
  restaurantId?: string | { _id: string; name: string };
  deliveryPersonId?: string | {
    _id: string;
    name: string;
    phoneNumber: string;
    vehicleType?: string;
    vehicleNumber?: string;
  };
  totalAmount: number;
  status: string;
  createdAt: string;
  deliveryAddress?: string;
  trainDetails?: {
    trainNumber: string;
    passengerName: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export default function CustomerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        console.log('Orders data:', data);
        setOrders(data.data?.orders || data.orders || []);
      } else {
        console.error('Failed to fetch orders:', response.status);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const verifyAuthAndFetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/verify');
      const data = await response.json();
      
      if (!data.authenticated) {
        router.push('/?error=login_required');
        return;
      }
      
      if (data.user.role !== 'CUSTOMER') {
        const correctDashboard = data.user.role === 'ADMIN' 
          ? '/dashboard/admin' 
          : data.user.role === 'RESTAURANT_OWNER'
          ? '/dashboard/restaurant'
          : '/dashboard/customer';
        router.push(`${correctDashboard}?error=unauthorized`);
        return;
      }
      
      setUser(data.user);
      await fetchOrders();
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/?error=auth_failed');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    verifyAuthAndFetchData();
  }, [verifyAuthAndFetchData]);

  const getStatusColor = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'accent' => {
    const statusMap: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'accent'> = {
      pending: 'warning',
      confirmed: 'info',
      preparing: 'info',
      ready: 'primary',
      delivered: 'success',
      cancelled: 'danger',
    };
    return statusMap[status.toLowerCase()] || 'default';
  };

  const activeOrders = orders.filter(o => 
    !['delivered', 'cancelled'].includes(o.status.toLowerCase())
  );

  const paginatedOrders = orders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );

  const totalPages = Math.ceil(orders.length / ordersPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Spinner size="xl" />
          <p className="text-gray-600 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Customer Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user.name || user.email}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6">
            <div className="text-sm mb-2 opacity-90">Active Orders</div>
            <div className="text-4xl font-bold">{activeOrders.length}</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6">
            <div className="text-sm mb-2 opacity-90">Total Orders</div>
            <div className="text-4xl font-bold">{orders.length}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-6">
            <div className="text-sm mb-2 opacity-90">Total Spent</div>
            <div className="text-4xl font-bold">
              ₹{orders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(0)}
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Order History</h2>
          
          {orders.length === 0 ? (
            <EmptyState
              icon={<Package className="w-14 h-14 text-orange-500" />}
              title="No orders yet"
              description="Start ordering from your favorite restaurants!"
              action={
                <Link href="/restaurants">
                  <Button>Browse Restaurants</Button>
                </Link>
              }
            />
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Order #</TableHeader>
                    <TableHeader>Restaurant</TableHeader>
                    <TableHeader>Items</TableHeader>
                    <TableHeader>Amount</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Date</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedOrders.map((order) => {
                    const showDeliveryPerson = ['ready', 'picked_up', 'in_transit', 'delivered'].includes(order.status.toLowerCase());
                    const deliveryPerson = typeof order.deliveryPersonId === 'object' ? order.deliveryPersonId : null;
                    
                    return (
                    <TableRow key={order._id} onClick={() => router.push(`/orders/${order._id}`)}>
                      <TableCell>
                        <span className="font-semibold text-blue-600">
                          {order.batchNumber || order._id.slice(-8)}
                        </span>
                        {showDeliveryPerson && deliveryPerson && (
                          <div className="mt-1 text-xs text-green-600 font-medium flex items-center gap-1">
                            <Bike className="w-3 h-3 animate-pulse" />
                            <span>{deliveryPerson.name}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {typeof order.restaurantId === 'object' && order.restaurantId?.name 
                          ? order.restaurantId.name 
                          : order.trainDetails?.trainNumber 
                          ? `Train ${order.trainDetails.trainNumber}` 
                          : 'Restaurant'}
                        {showDeliveryPerson && deliveryPerson && (
                          <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{deliveryPerson.phoneNumber}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-green-600">₹{order.totalAmount.toFixed(2)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(order.status)}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Link href={`/orders/${order._id}`}>
                          <Button size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                  })}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
