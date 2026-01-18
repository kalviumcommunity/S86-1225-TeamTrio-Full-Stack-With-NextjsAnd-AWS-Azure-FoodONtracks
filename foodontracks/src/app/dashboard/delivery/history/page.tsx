'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Clock, Inbox, ScrollText, Star } from 'lucide-react';

interface Order {
  _id: string;
  orderNumber?: string;
  batchNumber: string;
  totalAmount: number;
  status: string;
  deliveryAddress: string;
  createdAt: string;
  restaurantId?: {
    name: string;
  };
  items: Array<{
    name: string;
    quantity: number;
  }>;
  ratings?: {
    delivery?: {
      rating?: number;
      comment?: string;
      ratedAt?: string;
    };
  };
}

export default function DeliveryHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/delivery/my-orders');
      if (res.ok) {
        const data = await res.json();
        // Filter for completed orders only
        const completedOrders = (data.orders || []).filter(
          (order: Order) => order.status.toLowerCase() === 'delivered'
        );
        setOrders(completedOrders);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="flex items-center gap-2 text-3xl font-bold mb-6">
        <ScrollText className="w-7 h-7 text-blue-600" />
        <span>Delivery History</span>
      </h1>

      {orders.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-14 h-14 text-blue-500" />}
          title="No Delivery History"
          description="Your completed deliveries will appear here"
        />
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">Order #{order.orderNumber || order.batchNumber}</h3>
                  <p className="text-sm text-gray-600">{order.restaurantId?.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Delivered on {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="success">Delivered</Badge>
              </div>

              {/* Customer Rating Display */}
              {order.ratings?.delivery ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-700">Customer Rating:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={
                            star <= (order.ratings?.delivery?.rating || 0)
                              ? 'w-4 h-4 text-yellow-400 fill-yellow-400'
                              : 'w-4 h-4 text-gray-300'
                          }
                        />
                      ))}
                      <span className="ml-2 text-lg font-bold text-green-700">
                        {order.ratings.delivery.rating}/5
                      </span>
                    </div>
                  </div>
                  {order.ratings.delivery.comment && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700">Comment:</p>
                      <p className="text-sm text-gray-600 italic bg-white p-2 rounded mt-1">
                        "{order.ratings.delivery.comment}"
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Rated on {new Date(order.ratings.delivery.ratedAt!).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                  <p className="flex items-center justify-center gap-2 text-sm text-gray-600 text-center">
                    <Clock className="w-4 h-4" />
                    <span>Customer hasn&apos;t rated this delivery yet</span>
                  </p>
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Delivery Address</p>
                  <p className="font-medium text-sm">{order.deliveryAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-bold text-green-600">₹{order.totalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Items</p>
                  <p className="font-medium text-sm">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
