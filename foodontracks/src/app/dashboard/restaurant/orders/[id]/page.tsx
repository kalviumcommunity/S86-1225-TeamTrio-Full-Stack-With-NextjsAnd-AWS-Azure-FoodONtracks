'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import InputField from '@/components/ui/InputField';
import { toast } from 'sonner';

interface Order {
  _id: string;
  orderNumber?: string;
  batchNumber: string;
  userId: {
    _id: string;
    name?: string;
    email: string;
    phone?: string;
  };
  restaurantId: {
    _id: string;
    name: string;
  };
  status: string;
  totalAmount: number;
  deliveryAddress: string;
  phoneNumber: string;
  paymentMethod: string;
  paymentStatus: string;
  notes?: string;
  items: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  orderTimeline?: {
    orderPlaced?: string;
    confirmed?: string;
    preparing?: string;
    ready?: string;
    delivered?: string;
  };
  batchTracking?: {
    preparedBy?: string;
    preparedAt?: string;
    foodTemperature?: number;
    handoverTemperature?: number;
    handoverTime?: string;
    qualityCheck?: boolean;
    notes?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [batchForm, setBatchForm] = useState({
    preparedBy: '',
    foodTemperature: '',
    handoverTemperature: '',
    qualityCheck: false,
    notes: '',
  });

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrder(data.data);
        
        // Pre-fill batch form if data exists
        if (data.data.batchTracking) {
          setBatchForm({
            preparedBy: data.data.batchTracking.preparedBy || '',
            foodTemperature: data.data.batchTracking.foodTemperature?.toString() || '',
            handoverTemperature: data.data.batchTracking.handoverTemperature?.toString() || '',
            qualityCheck: data.data.batchTracking.qualityCheck || false,
            notes: data.data.batchTracking.notes || '',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success('Order status updated');
        fetchOrder();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleBatchUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    
    try {
      const batchTracking: any = {
        preparedBy: batchForm.preparedBy || null,
        qualityCheck: batchForm.qualityCheck,
        notes: batchForm.notes || null,
      };

      if (batchForm.foodTemperature) {
        batchTracking.foodTemperature = parseFloat(batchForm.foodTemperature);
        batchTracking.preparedAt = new Date().toISOString();
      }

      if (batchForm.handoverTemperature) {
        batchTracking.handoverTemperature = parseFloat(batchForm.handoverTemperature);
        batchTracking.handoverTime = new Date().toISOString();
      }

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ batchTracking }),
      });

      if (response.ok) {
        toast.success('Batch details updated');
        fetchOrder();
      } else {
        toast.error('Failed to update batch details');
      }
    } catch (error) {
      console.error('Error updating batch:', error);
      toast.error('Failed to update batch details');
    } finally {
      setUpdating(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Order not found</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="text-orange-600 hover:text-orange-700 mb-2 flex items-center gap-2"
            >
              ← Back to Orders
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Order Number</div>
            <div className="text-xl font-bold">{order.orderNumber || order.batchNumber}</div>
            <div className="text-xs text-gray-500">Batch: {order.batchNumber}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Order Status</h2>
              <div className="flex items-center gap-4">
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={updating}
                  className={`px-4 py-2 rounded-lg font-semibold border-2 focus:ring-2 focus:ring-orange-500 ${getStatusColor(order.status)}`}
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
                {updating && <Spinner size="sm" />}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Order Items</h2>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center border-b pb-3 last:border-b-0">
                    <div>
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-sm text-gray-600">Quantity: {item.quantity}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">₹{item.price.toFixed(2)}</div>
                      <div className="text-sm text-gray-600">₹{(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t-2 flex justify-between items-center">
                  <div className="text-lg font-bold">Total Amount</div>
                  <div className="text-2xl font-bold text-green-600">₹{order.totalAmount.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Train Delivery Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Train Delivery Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Delivery Address</div>
                  <div className="font-semibold">{order.deliveryAddress}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Contact Number</div>
                  <div className="font-semibold">{order.phoneNumber}</div>
                </div>
              </div>
              {order.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <div className="text-sm text-gray-600 mb-1">Special Instructions</div>
                  <div className="text-sm whitespace-pre-wrap">{order.notes}</div>
                </div>
              )}
            </div>

            {/* Batch Tracking Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Batch Tracking</h2>
              <form onSubmit={handleBatchUpdate} className="space-y-4">
                <InputField
                  label="Prepared By (Staff Name)"
                  value={batchForm.preparedBy}
                  onChange={(e) => setBatchForm({ ...batchForm, preparedBy: e.target.value })}
                  placeholder="Enter staff name"
                />
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Food Temperature (°C)"
                    type="number"
                    step="0.1"
                    value={batchForm.foodTemperature}
                    onChange={(e) => setBatchForm({ ...batchForm, foodTemperature: e.target.value })}
                    placeholder="e.g., 65"
                  />
                  <InputField
                    label="Handover Temperature (°C)"
                    type="number"
                    step="0.1"
                    value={batchForm.handoverTemperature}
                    onChange={(e) => setBatchForm({ ...batchForm, handoverTemperature: e.target.value })}
                    placeholder="e.g., 60"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="qualityCheck"
                    checked={batchForm.qualityCheck}
                    onChange={(e) => setBatchForm({ ...batchForm, qualityCheck: e.target.checked })}
                    className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor="qualityCheck" className="font-medium">Quality Check Passed</label>
                </div>
                <InputField
                  label="Batch Notes"
                  value={batchForm.notes}
                  onChange={(e) => setBatchForm({ ...batchForm, notes: e.target.value })}
                  placeholder="Additional notes about preparation"
                />
                <Button type="submit" disabled={updating} className="w-full">
                  {updating ? 'Updating...' : 'Update Batch Details'}
                </Button>
              </form>
            </div>
          </div>

          {/* Right Column - Timeline & Customer */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Customer</h2>
              <div className="space-y-2">
                <div>
                  <div className="text-sm text-gray-600">Name</div>
                  <div className="font-semibold">{order.userId.name || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Email</div>
                  <div className="font-semibold">{order.userId.email}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Phone</div>
                  <div className="font-semibold">{order.userId.phone || order.phoneNumber}</div>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Payment</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Method</span>
                  <span className="font-semibold uppercase">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <Badge variant={order.paymentStatus === 'completed' ? 'success' : 'default'}>
                    {order.paymentStatus.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Timeline</h2>
              <div className="space-y-3">
                {order.orderTimeline?.orderPlaced && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-semibold">Order Placed</div>
                      <div className="text-sm text-gray-600">
                        {new Date(order.orderTimeline.orderPlaced).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
                {order.orderTimeline?.confirmed && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-semibold">Confirmed</div>
                      <div className="text-sm text-gray-600">
                        {new Date(order.orderTimeline.confirmed).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
                {order.orderTimeline?.preparing && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-semibold">Preparing</div>
                      <div className="text-sm text-gray-600">
                        {new Date(order.orderTimeline.preparing).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
                {order.orderTimeline?.ready && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-semibold">Ready</div>
                      <div className="text-sm text-gray-600">
                        {new Date(order.orderTimeline.ready).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
                {order.orderTimeline?.delivered && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <div className="font-semibold">Delivered</div>
                      <div className="text-sm text-gray-600">
                        {new Date(order.orderTimeline.delivered).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Batch Info (if exists) */}
            {order.batchTracking && (order.batchTracking.preparedBy || order.batchTracking.foodTemperature) && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Batch Info</h2>
                <div className="space-y-2 text-sm">
                  {order.batchTracking.preparedBy && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Prepared By</span>
                      <span className="font-semibold">{order.batchTracking.preparedBy}</span>
                    </div>
                  )}
                  {order.batchTracking.foodTemperature && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Food Temp</span>
                      <span className="font-semibold">{order.batchTracking.foodTemperature}°C</span>
                    </div>
                  )}
                  {order.batchTracking.handoverTemperature && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Handover Temp</span>
                      <span className="font-semibold">{order.batchTracking.handoverTemperature}°C</span>
                    </div>
                  )}
                  {order.batchTracking.qualityCheck !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quality Check</span>
                      <Badge variant={order.batchTracking.qualityCheck ? 'success' : 'default'}>
                        {order.batchTracking.qualityCheck ? 'PASSED' : 'PENDING'}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
