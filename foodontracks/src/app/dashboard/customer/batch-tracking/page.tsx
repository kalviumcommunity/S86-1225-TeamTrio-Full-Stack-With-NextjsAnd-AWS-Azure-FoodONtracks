'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import InputField from '@/components/ui/InputField';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from 'sonner';
import { CheckCircle, ClipboardList, Info, Loader2, Phone, Search, Timer, Truck, User, CarFront } from 'lucide-react';

interface BatchTracking {
  preparedBy?: string;
  preparedAt?: string;
  foodTemperature?: number;
  handoverTemperature?: number;
  handoverTime?: string;
  qualityCheck?: boolean;
  notes?: string;
}

interface OrderDetails {
  _id: string;
  orderNumber?: string;
  batchNumber: string;
  status: string;
  totalAmount: number;
  deliveryAddress: string;
  createdAt: string;
  updatedAt?: string;
  restaurantId?: {
    name: string;
    location?: string;
  };
  deliveryPersonId?: {
    _id: string;
    name: string;
    phoneNumber?: string;
    vehicleNumber?: string;
  };
  batchTracking?: BatchTracking;
  orderTimeline?: Array<{
    status: string;
    timestamp: string;
    updatedBy?: string;
  }>;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export default function BatchTrackingPage() {
  const router = useRouter();
  const [batchNumber, setBatchNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Auto-refresh effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh && orderDetails && orderDetails.status !== 'delivered' && orderDetails.status !== 'cancelled') {
      interval = setInterval(() => {
        fetchOrderDetails(batchNumber);
      }, 10000); // Refresh every 10 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, orderDetails, batchNumber]);

  const fetchOrderDetails = async (batch: string) => {
    try {
      const response = await fetch(`/api/orders/batch/${encodeURIComponent(batch)}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setOrderDetails(data.data);
      }
    } catch (error) {
      console.error('Error refreshing order:', error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!batchNumber.trim()) {
      toast.error('Please enter a batch number');
      return;
    }

    setLoading(true);
    setOrderDetails(null);

    try {
      const response = await fetch(`/api/orders/batch/${encodeURIComponent(batchNumber)}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('=== ORDER DATA RECEIVED ===');
        console.log('Full order data:', JSON.stringify(data.data, null, 2));
        console.log('deliveryPersonId value:', data.data?.deliveryPersonId);
        console.log('deliveryPersonId type:', typeof data.data?.deliveryPersonId);
        console.log('Is object?:', typeof data.data?.deliveryPersonId === 'object');
        console.log('Has name?:', data.data?.deliveryPersonId?.name);
        setOrderDetails(data.data);
        setAutoRefresh(true); // Enable auto-refresh after successful search
        toast.success('Batch tracking details found!');
      } else {
        const error = await response.json();
        setAutoRefresh(false);
        toast.error(error.error || 'Batch number not found');
      }
    } catch (error) {
      console.error('Error searching batch:', error);
      setAutoRefresh(false);
      toast.error('Failed to search batch number');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-orange-600 hover:text-orange-700 mb-2 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
            <Search className="w-6 h-6 text-orange-500" />
            <span>Track Your Batch</span>
          </h1>
          <p className="text-gray-600 mt-2">
            Enter your batch number to view food quality and tracking details
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleSearch} className=" text-black space-y-4">
            <InputField
              label="Batch Number"
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              placeholder="e.g., foodontrack-UJF85T"
              required
            />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Spinner size="sm" /> : 'Search Batch'}
            </Button>
          </form>
        </div>

        {/* Results */}
        {orderDetails && (
          <div className="space-y-6">
            {/* Live Update Indicator */}
            {autoRefresh && orderDetails.status !== 'delivered' && orderDetails.status !== 'cancelled' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="flex items-center gap-2 text-sm text-green-800 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Live tracking enabled - Updates every 10 seconds</span>
                </span>
              </div>
            )}

            {/* Order Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Order Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Order Number</div>
                  <div className="font-semibold">{orderDetails.orderNumber || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Batch Number</div>
                  <div className="font-semibold text-orange-600">{orderDetails.batchNumber}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <div className={`font-semibold capitalize inline-block px-3 py-1 rounded-full text-sm ${
                    orderDetails.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    orderDetails.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-800' :
                    orderDetails.status === 'picked_by_delivery' ? 'bg-purple-100 text-purple-800' :
                    orderDetails.status === 'ready' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {orderDetails.status.replace(/_/g, ' ')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Amount</div>
                  <div className="font-semibold">₹{orderDetails.totalAmount.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Ordered At</div>
                  <div className="font-semibold text-sm">
                    {new Date(orderDetails.createdAt).toLocaleString('en-IN')}
                  </div>
                </div>
                {orderDetails.updatedAt && (
                  <div>
                    <div className="text-sm text-gray-600">Last Updated</div>
                    <div className="font-semibold text-sm">
                      {new Date(orderDetails.updatedAt).toLocaleString('en-IN')}
                    </div>
                  </div>
                )}
                {orderDetails.restaurantId && (
                  <>
                    <div>
                      <div className="text-sm text-gray-600">Restaurant</div>
                      <div className="font-semibold">{orderDetails.restaurantId.name}</div>
                    </div>
                    {orderDetails.restaurantId.location && (
                      <div>
                        <div className="text-sm text-gray-600">Location</div>
                        <div className="font-semibold">{orderDetails.restaurantId.location}</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Delivery Person Info - Always show */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6 border-2 border-blue-200">
              <h2 className="text-2xl font-bold mb-4 text-blue-900 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                <span>Delivery Person Details</span>
              </h2>

              {orderDetails.deliveryPersonId && typeof orderDetails.deliveryPersonId === 'object' && orderDetails.deliveryPersonId._id ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Name</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {orderDetails.deliveryPersonId.name || 'Not available'}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Contact Number</div>
                    <div className="text-lg font-semibold text-blue-600">
                      {orderDetails.deliveryPersonId.phoneNumber ? (
                        <a href={`tel:${orderDetails.deliveryPersonId.phoneNumber}`} className="hover:underline">
                          {orderDetails.deliveryPersonId.phoneNumber}
                        </a>
                      ) : (
                        <span className="text-gray-400">Not available</span>
                      )}
                    </div>
                  </div>
                  {orderDetails.deliveryPersonId.vehicleNumber && (
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Vehicle Number</div>
                      <div className="text-lg font-semibold font-mono text-gray-900">
                        {orderDetails.deliveryPersonId.vehicleNumber}
                      </div>
                    </div>
                  )}
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Delivery Status</div>
                    <div className={`text-lg font-semibold ${
                      orderDetails.status === 'delivered' ? 'text-green-600' :
                      orderDetails.status === 'out_for_delivery' ? 'text-blue-600' :
                      'text-orange-600'
                    }`}>
                      {orderDetails.status === 'delivered' ? 'Delivered' :
                       orderDetails.status === 'out_for_delivery' ? 'On the way' :
                       orderDetails.status === 'picked_by_delivery' ? 'Picked up' :
                       'Preparing'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg p-6 text-center">
                  <div className="flex justify-center mb-3">
                    <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
                      <User className="w-7 h-7 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-gray-600 font-medium">Delivery person not assigned yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    A delivery person will be assigned once your order is ready
                  </p>
                </div>
              )}
            </div>

            {/* Order Timeline - Enhanced */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Timer className="w-5 h-5 text-orange-500" />
                <span>Order Timeline</span>
              </h2>
              <div className="space-y-4">
                {/* Prepared */}
                {orderDetails.batchTracking?.preparedAt && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <div className="w-0.5 flex-1 bg-green-500 mt-1" style={{ minHeight: '40px' }}></div>
                    </div>
                    <div className="flex-1 pb-4 bg-green-50 rounded-lg p-4">
                      <div className="font-semibold text-green-800 flex items-center gap-2">
                        Prepared
                      </div>
                      <div className="text-sm text-green-600 mt-1">
                        {new Date(orderDetails.batchTracking.preparedAt).toLocaleString('en-IN', {
                          month: 'numeric',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        })}
                      </div>
                      {orderDetails.batchTracking.preparedBy && (
                        <div className="text-xs text-gray-600 mt-1">
                          By: {orderDetails.batchTracking.preparedBy}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Packed (when ready) */}
                {(orderDetails.status === 'ready' || orderDetails.status === 'picked_by_delivery' || orderDetails.status === 'out_for_delivery' || orderDetails.status === 'delivered') && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <div className="w-0.5 flex-1 bg-blue-500 mt-1" style={{ minHeight: '40px' }}></div>
                    </div>
                    <div className="flex-1 pb-4 bg-blue-50 rounded-lg p-4">
                      <div className="font-semibold text-blue-800 flex items-center gap-2">
                        Packed
                      </div>
                      <div className="text-sm text-blue-600 mt-1">
                        {orderDetails.batchTracking?.handoverTime 
                          ? new Date(orderDetails.batchTracking.handoverTime).toLocaleString('en-IN', {
                              month: 'numeric',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: true
                            })
                          : new Date(orderDetails.updatedAt || orderDetails.createdAt).toLocaleString('en-IN', {
                              month: 'numeric',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: true
                            })
                        }
                      </div>
                    </div>
                  </div>
                )}

                {/* Picked Up */}
                {(orderDetails.status === 'picked_by_delivery' || orderDetails.status === 'out_for_delivery' || orderDetails.status === 'delivered') && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <div className="w-0.5 flex-1 bg-purple-500 mt-1" style={{ minHeight: '40px' }}></div>
                    </div>
                    <div className="flex-1 pb-4 bg-purple-50 rounded-lg p-4">
                      <div className="font-semibold text-purple-800 flex items-center gap-2">
                        Picked Up
                      </div>
                      <div className="text-sm text-purple-600 mt-1">
                        {new Date(orderDetails.updatedAt || orderDetails.createdAt).toLocaleString('en-IN', {
                          month: 'numeric',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        })}
                      </div>
                      {orderDetails.deliveryPersonId && typeof orderDetails.deliveryPersonId === 'object' ? (
                        <div className="mt-2 pt-2 border-t border-purple-200">
                          <div className="text-sm font-semibold text-purple-900">Delivery Person:</div>
                          <div className="text-sm text-gray-700 mt-1 flex items-center gap-2">
                            <User className="w-4 h-4 text-purple-700" />
                            <span>{orderDetails.deliveryPersonId.name}</span>
                          </div>
                          {orderDetails.deliveryPersonId.phoneNumber && (
                            <div className="text-sm text-gray-700 flex items-center gap-2">
                              <Phone className="w-4 h-4 text-purple-700" />
                              <a
                                href={`tel:${orderDetails.deliveryPersonId.phoneNumber}`}
                                className="text-purple-700 hover:underline"
                              >
                                {orderDetails.deliveryPersonId.phoneNumber}
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 mt-1">
                          Delivery person assigned
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* In Transit */}
                {(orderDetails.status === 'out_for_delivery' || orderDetails.status === 'delivered') && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                      {orderDetails.status === 'delivered' && (
                        <div className="w-0.5 flex-1 bg-indigo-500 mt-1" style={{ minHeight: '40px' }}></div>
                      )}
                    </div>
                    <div className="flex-1 pb-4 bg-indigo-50 rounded-lg p-4">
                      <div className="font-semibold text-indigo-800 flex items-center gap-2">
                        In Transit
                      </div>
                      <div className="text-sm text-indigo-600 mt-1">
                        {new Date(orderDetails.updatedAt || orderDetails.createdAt).toLocaleString('en-IN', {
                          month: 'numeric',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        })}
                      </div>
                      {orderDetails.deliveryPersonId && typeof orderDetails.deliveryPersonId === 'object' ? (
                        <div className="mt-2 pt-2 border-t border-indigo-200">
                          <div className="text-sm font-semibold text-indigo-900">Delivery Person:</div>
                          <div className="text-sm text-gray-700 mt-1 flex items-center gap-2">
                            <User className="w-4 h-4 text-indigo-700" />
                            <span>{orderDetails.deliveryPersonId.name}</span>
                          </div>
                          {orderDetails.deliveryPersonId.phoneNumber && (
                            <div className="text-sm text-gray-700 flex items-center gap-2">
                              <Phone className="w-4 h-4 text-indigo-700" />
                              <a
                                href={`tel:${orderDetails.deliveryPersonId.phoneNumber}`}
                                className="text-indigo-700 hover:underline font-medium"
                              >
                                {orderDetails.deliveryPersonId.phoneNumber}
                              </a>
                            </div>
                          )}
                          {orderDetails.deliveryPersonId.vehicleNumber && (
                            <div className="text-sm text-gray-700 flex items-center gap-2">
                              <CarFront className="w-4 h-4 text-indigo-700" />
                              <span>Vehicle: {orderDetails.deliveryPersonId.vehicleNumber}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 mt-1">
                          On the way to you
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Delivered */}
                {orderDetails.status === 'delivered' && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-green-600"></div>
                    </div>
                    <div className="flex-1 bg-green-50 rounded-lg p-4 border-2 border-green-500">
                      <div className="font-semibold text-green-800 flex items-center gap-2 text-lg">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span>Delivered</span>
                      </div>
                      <div className="text-sm text-green-600 mt-1">
                        {new Date(orderDetails.updatedAt || orderDetails.createdAt).toLocaleString('en-IN', {
                          month: 'numeric',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Batch Tracking Details */}
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg shadow-lg p-6 border-2 border-orange-200">
              <h2 className="text-2xl font-bold mb-6 text-orange-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-orange-500" />
                <span>Batch Tracking Details</span>
              </h2>

              {orderDetails.batchTracking ? (
                <div className="space-y-6">
                  {/* Staff Info */}
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Prepared By (Staff Name)</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {orderDetails.batchTracking.preparedBy || 'Not updated yet'}
                    </div>
                    {orderDetails.batchTracking.preparedAt && (
                      <div className="text-xs text-gray-500 mt-1">
                        Prepared at: {new Date(orderDetails.batchTracking.preparedAt).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Temperature Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Food Temperature (°C)</div>
                      <div className="text-3xl font-bold text-blue-600">
                        {orderDetails.batchTracking.foodTemperature !== undefined 
                          ? `${orderDetails.batchTracking.foodTemperature}°C` 
                          : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">When ready</div>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Handover Temperature (°C)</div>
                      <div className="text-3xl font-bold text-green-600">
                        {orderDetails.batchTracking.handoverTemperature !== undefined 
                          ? `${orderDetails.batchTracking.handoverTemperature}°C` 
                          : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {orderDetails.batchTracking.handoverTime 
                          ? new Date(orderDetails.batchTracking.handoverTime).toLocaleString()
                          : 'When given to delivery'}
                      </div>
                    </div>
                  </div>

                  {/* Quality Check */}
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        orderDetails.batchTracking.qualityCheck 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        {orderDetails.batchTracking.qualityCheck ? '✓' : '✗'}
                      </div>
                      <div>
                        <div className="font-semibold text-lg">
                          Quality Check {orderDetails.batchTracking.qualityCheck ? 'Passed' : 'Not Completed'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Food safety and quality verification
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Batch Notes */}
                  {orderDetails.batchTracking.notes && (
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-2">Batch Notes</div>
                      <div className="text-gray-900 whitespace-pre-wrap">
                        {orderDetails.batchTracking.notes}
                      </div>
                    </div>
                  )}

                  {/* Information Footer */}
                  <div className="bg-orange-100 border border-orange-300 rounded-lg p-4 mt-6">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        <Info className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="text-sm text-orange-900">
                        <strong>Note:</strong> These details are updated by the restaurant staff to ensure 
                        food quality and safety during preparation. The delivery person also verifies these 
                        details before pickup and delivery.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="flex justify-center mb-2">
                    <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center">
                      <ClipboardList className="w-7 h-7 text-orange-500" />
                    </div>
                  </div>
                  <p>Batch tracking details not yet updated by restaurant.</p>
                  <p className="text-sm mt-2">Details will appear once the restaurant prepares your order.</p>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Order Items</h2>
              <div className="space-y-3">
                {orderDetails.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center border-b pb-3 last:border-b-0">
                    <div>
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-sm text-gray-600">Quantity: {item.quantity}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
