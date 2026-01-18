'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import { Zap, Package, Star, UserCircle2, Store, CheckCircle, Truck, Bike, ClipboardList } from 'lucide-react';

interface Order {
  _id: string;
  orderNumber?: string;
  batchNumber: string;
  totalAmount: number;
  status: string;
  deliveryAddress: string;
  phoneNumber: string;
  createdAt: string;
  restaurantId?: {
    name: string;
    location?: string;
  };
  userId?: {
    name?: string;
    phone?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  ratings?: {
    delivery?: {
      rating?: number;
      comment?: string;
      ratedAt?: string;
    };
  };
}

interface Batch {
  _id: string;
  batchNumber: string;
  restaurantId: {
    _id: string;
    name: string;
    address: string;
  };
  orderId: {
    _id: string;
    deliveryAddress: string;
    customerName: string;
    customerPhone: string;
    totalAmount?: number;
    ratings?: {
      delivery?: {
        rating?: number;
        comment?: string;
        ratedAt?: string;
      };
    };
  };
  status: string;
  items: { name: string; quantity: number }[];
  preparedAt?: string;
  packedAt?: string;
  pickedUpAt?: string;
  inTransitAt?: string;
}

export default function ActiveDeliveriesPage() {
  const [loading, setLoading] = useState(true);
  const [assignedBatches, setAssignedBatches] = useState<Batch[]>([]);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [updating, setUpdating] = useState(false);
  const [view, setView] = useState<'AVAILABLE' | 'MY_ORDERS'>('MY_ORDERS');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [batchesRes, availableRes, myOrdersRes] = await Promise.all([
        fetch('/api/delivery/batches'),
        fetch('/api/delivery/available-orders'),
        fetch('/api/delivery/my-orders'),
      ]);

      if (batchesRes.ok) {
        const batchesData = await batchesRes.json();
        setAssignedBatches(batchesData.batches || []);
      }

      if (availableRes.ok) {
        const availableData = await availableRes.json();
        setAvailableOrders(availableData.orders || []);
      }

      if (myOrdersRes.ok) {
        const myOrdersData = await myOrdersRes.json();
        setMyOrders(myOrdersData.orders || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignOrder = async (orderId: string) => {
    setUpdating(true);
    try {
      const res = await fetch('/api/delivery/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId }),
      });

      if (res.ok) {
        toast.success('Order assigned successfully!');
        await fetchData();
        setView('MY_ORDERS');
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to assign order');
      }
    } catch (error) {
      console.error('Error assigning order:', error);
      toast.error('Failed to assign order');
    } finally {
      setUpdating(false);
    }
  };

  const updateBatchStatus = async (batchNumber: string, newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/delivery/batch/${batchNumber}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success(`Batch status updated to ${newStatus.replace('_', ' ')}`);
        await fetchData();
        setSelectedBatch(null);
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to update batch status');
      }
    } catch (error) {
      console.error('Error updating batch status:', error);
      toast.error('Failed to update batch status');
    } finally {
      setUpdating(false);
    }
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow: Record<string, string> = {
      PREPARED: 'PICKED_UP',
      PACKED: 'PICKED_UP',
      PICKED_UP: 'OUT_FOR_DELIVERY',
      PICKED_BY_DELIVERY: 'OUT_FOR_DELIVERY', // Handle order status
      OUT_FOR_DELIVERY: 'DELIVERED',
    };
    return statusFlow[currentStatus] || null;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'accent'> = {
      PREPARED: 'warning',
      PACKED: 'info',
      PICKED_UP: 'primary',
      PICKED_BY_DELIVERY: 'primary', // Handle order status
      OUT_FOR_DELIVERY: 'info',
      DELIVERED: 'success',
      CANCELLED: 'danger',
    };
    return colors[status] || 'default';
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
      <div className="flex items-center gap-3 mb-6">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-3xl font-bold">Active Deliveries</h1>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-6">
        <Button
          onClick={() => setView('MY_ORDERS')}
          variant={view === 'MY_ORDERS' ? 'primary' : 'outline'}
        >
          My Assigned Orders ({myOrders.length + assignedBatches.length})
        </Button>
        <Button
          onClick={() => setView('AVAILABLE')}
          variant={view === 'AVAILABLE' ? 'primary' : 'outline'}
        >
          Available Orders ({availableOrders.length})
        </Button>
      </div>

      {/* Available Orders */}
      {view === 'AVAILABLE' && (
        <div>
          {availableOrders.length === 0 ? (
            <EmptyState
              icon={<Package className="w-12 h-12" />}
              title="No Available Orders"
              description="Check back later for new delivery opportunities"
            />
          ) : (
            <div className="grid gap-4">
              {availableOrders.map((order) => (
                <div key={order._id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">Order #{order.orderNumber || order.batchNumber}</h3>
                      <p className="text-sm text-gray-600">{order.restaurantId?.name}</p>
                    </div>
                    <Badge variant="warning">Available</Badge>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Delivery Address</p>
                      <p className="font-medium">{order.deliveryAddress}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="font-bold text-green-600">₹{order.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => assignOrder(order._id)}
                    disabled={updating}
                    className="w-full"
                  >
                    {updating ? 'Assigning...' : 'Accept Delivery'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* My Orders/Batches */}
      {view === 'MY_ORDERS' && (
        <div>
          {/* Assigned Batches */}
          {assignedBatches.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assigned Batches</h2>
              </div>
              <div className="grid gap-4">
                {assignedBatches.map((batch) => (
                  <div key={batch._id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg">Batch #{batch.batchNumber}</h3>
                        <p className="text-sm text-gray-600">{batch.restaurantId?.name}</p>
                      </div>
                      <Badge variant={getStatusColor(batch.status)}>{batch.status.replace('_', ' ')}</Badge>
                    </div>

                    {/* Customer Rating Display */}
                    {batch.orderId?.ratings?.delivery && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-gray-700">Customer Rating:</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={
                                  star <= (batch.orderId.ratings?.delivery?.rating || 0)
                                    ? 'w-4 h-4 text-yellow-400 fill-yellow-400'
                                    : 'w-4 h-4 text-gray-300'
                                }
                              />
                            ))}
                            <span className="ml-2 font-bold text-yellow-700">
                              {batch.orderId.ratings.delivery.rating}/5
                            </span>
                          </div>
                        </div>
                        {batch.orderId.ratings.delivery.comment && (
                          <p className="text-sm text-gray-700 italic">"{batch.orderId.ratings.delivery.comment}"</p>
                        )}
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Pickup</p>
                        <p className="font-medium">{batch.restaurantId.address}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Delivery</p>
                        <p className="font-medium">{batch.orderId.deliveryAddress}</p>
                      </div>
                    </div>

                    {batch.status !== 'DELIVERED' && batch.status !== 'CANCELLED' && (
                      <Button
                        onClick={() => setSelectedBatch(batch)}
                        className="w-full"
                      >
                        View Details & Update Status
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My Orders */}
          {myOrders.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold mb-4">
                <Bike className="w-5 h-5 text-blue-500" />
                <span>My Orders</span>
              </h2>
              <div className="grid gap-4">
                {myOrders.map((order) => (
                  <div key={order._id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg">Order #{order.orderNumber || order.batchNumber}</h3>
                        <p className="text-sm text-gray-600">{order.restaurantId?.name}</p>
                      </div>
                      <Badge variant={getStatusColor(order.status)}>{order.status.replace('_', ' ')}</Badge>
                    </div>

                    {/* Customer Rating Display */}
                    {order.ratings?.delivery && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-gray-700">Customer Rating:</span>
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
                            <span className="ml-2 font-bold text-yellow-700">
                              {order.ratings.delivery.rating}/5
                            </span>
                          </div>
                        </div>
                        {order.ratings.delivery.comment && (
                          <p className="text-sm text-gray-700 italic">"{order.ratings.delivery.comment}"</p>
                        )}
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Delivery Address</p>
                        <p className="font-medium">{order.deliveryAddress}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Amount</p>
                        <p className="font-bold text-green-600">₹{order.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {assignedBatches.length === 0 && myOrders.length === 0 && (
            <EmptyState
              icon={<Truck className="w-14 h-14 text-blue-500" />}
              title="No Active Deliveries"
              description="Accept an order from available orders to get started"
            />
          )}
        </div>
      )}

      {/* Batch Details Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="flex items-center gap-2 text-2xl font-bold mb-6">
              <ClipboardList className="w-6 h-6 text-blue-500" />
              <span>Batch Details - Verify &amp; Update</span>
            </h2>
            
            <div className="space-y-5 mb-6">
              {/* Batch Number */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Batch Number</p>
                <p className="font-bold text-lg">{selectedBatch.batchNumber}</p>
              </div>

              {/* Current Status */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Current Status</p>
                <Badge variant={getStatusColor(selectedBatch.status)} size="lg">
                  {selectedBatch.status.replace('_', ' ')}
                </Badge>
              </div>

              {/* Restaurant Details */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Store className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-lg">Pickup Location</h3>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800/30">
                  <p className="font-bold text-blue-900 dark:text-blue-200">{selectedBatch.restaurantId?.name}</p>
                  <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">{selectedBatch.restaurantId?.address}</p>
                </div>
              </div>

              {/* Customer Details */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <UserCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h3 className="font-semibold text-lg">Customer Details</h3>
                </div>
                <div className="bg-green-50 p-4 rounded-lg space-y-2">
                  <div>
                    <p className="text-xs text-gray-600">Name</p>
                    <p className="font-medium text-green-900">{selectedBatch.orderId?.customerName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Phone</p>
                    <p className="font-medium text-green-900">{selectedBatch.orderId?.customerPhone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Delivery Address</p>
                    <p className="font-medium text-green-900">{selectedBatch.orderId?.deliveryAddress}</p>
                  </div>
                  {selectedBatch.orderId?.totalAmount && (
                    <div>
                      <p className="text-xs text-gray-600">Order Amount</p>
                      <p className="font-bold text-green-900">₹{selectedBatch.orderId.totalAmount.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Items to Deliver */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-semibold text-lg">Items to Deliver</h3>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <ul className="space-y-2">
                    {selectedBatch.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between items-center border-b border-orange-200 pb-2 last:border-0">
                        <span className="font-medium text-orange-900">{item.name}</span>
                        <span className="bg-orange-200 text-orange-900 px-3 py-1 rounded-full text-sm font-bold">
                          × {item.quantity}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Timestamps */}
              {(selectedBatch.preparedAt || selectedBatch.packedAt || selectedBatch.pickedUpAt) && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-lg mb-3">⏱️ Timeline</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    {selectedBatch.preparedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Prepared:</span>
                        <span className="font-medium">{new Date(selectedBatch.preparedAt).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedBatch.packedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Packed:</span>
                        <span className="font-medium">{new Date(selectedBatch.packedAt).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedBatch.pickedUpAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Picked Up:</span>
                        <span className="font-medium">{new Date(selectedBatch.pickedUpAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="border-t pt-4 flex gap-3">
              {getNextStatus(selectedBatch.status) ? (
                <Button
                  onClick={() => updateBatchStatus(selectedBatch.batchNumber, getNextStatus(selectedBatch.status)!)}
                  disabled={updating}
                  variant="primary"
                  className="flex-1 text-lg py-3"
                >
                  {updating ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner size="sm" />
                      Updating...
                    </span>
                  ) : (
                    `✓ Update to ${getNextStatus(selectedBatch.status)?.replace('_', ' ')}`
                  )}
                </Button>
              ) : (
                <div className="flex-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg p-4 text-center font-semibold flex items-center justify-center gap-2 border border-green-200 dark:border-green-800/30">
                  <CheckCircle className="w-5 h-5" />
                  Order Completed
                </div>
              )}
              
              <Button onClick={() => setSelectedBatch(null)} variant="outline" className="px-6">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
