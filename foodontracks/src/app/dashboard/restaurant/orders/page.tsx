"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UtensilsCrossed, Star, MessageCircle } from "lucide-react";

interface Order {
  _id: string;
  orderNumber: string;
  userId: { name: string; phone: string };
  orderStatus: string;
  totalAmount: number;
  createdAt: string;
  ratings?: {
    restaurant?: {
      rating?: number;
      comment?: string;
      ratedAt?: string;
    };
    delivery?: {
      rating?: number;
      comment?: string;
      ratedAt?: string;
    };
  };
}

export default function RestaurantOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/restaurant/orders');
        if (response.ok) {
          const data = await response.json();
          setOrders(data.orders || []);
        } else if (response.status === 401) {
          router.push('/login');
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-xl">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Restaurant Orders</h1>
      
      {orders.length === 0 ? (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">No orders yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">Order #{order.orderNumber}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {order.userId.name} - {order.userId.phone}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      order.orderStatus === 'DELIVERED'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}
                  >
                    {order.orderStatus}
                  </span>
                  <p className="mt-2 font-bold text-xl">${order.totalAmount.toFixed(2)}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                {new Date(order.createdAt).toLocaleString()}
              </p>
              
              {/* Restaurant Rating Display */}
              {order.ratings?.restaurant && (
                <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <UtensilsCrossed className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-sm font-semibold text-orange-800 dark:text-orange-300">Food Rating:</span>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= (order.ratings?.restaurant?.rating || 0)
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm font-bold text-orange-700 dark:text-orange-400">
                        {order.ratings.restaurant.rating}/5
                      </span>
                    </div>
                  </div>
                  {order.ratings.restaurant.comment && (
                    <div className="flex items-start gap-2 mt-2">
                      <MessageCircle className="w-3 h-3 text-gray-600 dark:text-gray-400 mt-0.5" />
                      <p className="text-xs text-gray-700 dark:text-gray-300 italic">
                        "{order.ratings.restaurant.comment}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
