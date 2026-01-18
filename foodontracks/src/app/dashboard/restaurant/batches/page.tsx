'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Package, Check } from 'lucide-react';

interface Order {
  _id: string;
  orderNumber?: string;
  batchNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: Array<{
    name: string;
    quantity: number;
  }>;
  batchTracking?: {
    preparedBy?: string;
    qualityCheck?: boolean;
  };
}

export default function RestaurantBatchesPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/restaurant/orders', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      delivered: 'success',
      pending: 'warning',
      confirmed: 'info',
      preparing: 'info',
      ready: 'info',
      cancelled: 'danger',
    };
    return statusMap[status.toLowerCase()] || 'info';
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Batch Traceability</h1>
          <p className="text-gray-600">Track and manage food batches for complete traceability</p>
        </div>
        <button 
          onClick={() => router.push('/dashboard/restaurant/batches/create')}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white px-6 py-3 rounded-lg font-medium shadow-md transition-all"
        >
          <Package className="w-4 h-4" />
          <span>Update Batch Tracking</span>
        </button>
      </div>
      
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-50 text-yellow-600 shadow-sm">
            <Package className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">No Orders Yet</h2>
          <p className="text-gray-600">Orders with batch numbers will appear here</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tracking
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono font-semibold text-orange-600">
                        {order.batchNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.orderNumber || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.items.slice(0, 2).map((item, idx) => (
                          <div key={idx}>{item.name} × {item.quantity}</div>
                        ))}
                        {order.items.length > 2 && (
                          <div className="text-gray-500">+{order.items.length - 2} more</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusBadge(order.status)}>
                        {order.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.batchTracking?.preparedBy ? (
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>{order.batchTracking.preparedBy}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Not updated</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{order.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => router.push(`/dashboard/restaurant/batches/create?batch=${order.batchNumber}`)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit Tracking
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
