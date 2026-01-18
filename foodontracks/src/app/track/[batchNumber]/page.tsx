'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Activity, CheckCircle, Clock, FileText, Loader2, Package, Truck, XCircle } from 'lucide-react';

interface BatchData {
  success: boolean;
  batchNumber: string;
  order: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    items: any[];
    createdAt: string;
  };
  customer: {
    name: string;
    phoneNumber: string;
  };
  restaurant: {
    id: string;
    name: string;
    address: string;
    city: string;
    phoneNumber: string;
    cuisine: string[];
  };
  deliveryPerson: {
    name?: string;
    phoneNumber?: string;
    vehicleNumber?: string;
    message?: string;
  };
  timeline: {
    orderPlaced: string;
    confirmed?: string;
    preparing?: string;
    ready?: string;
    delivered?: string;
  };
  traceabilityFlow: Array<{
    stage: string;
    timestamp: string | null;
    status: string;
    description: string;
  }>;
}

export default function TrackBatchPage() {
  const params = useParams();
  const router = useRouter();
  const batchNumber = params?.batchNumber as string;
  
  const [data, setData] = useState<BatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (batchNumber) {
      fetchBatchData();
      
      // Auto-refresh every 10 seconds for live updates
      const interval = setInterval(() => {
        fetchBatchData();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [batchNumber]);

  const fetchBatchData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/batch/search?batchNumber=${batchNumber}`);
      const result = await response.json();

      if (!response.ok) {
        setError(result.message || 'Order not found');
        setLoading(false);
        return;
      }

      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'completed') return 'text-green-600 bg-green-100';
    if (status === 'pending') return 'text-gray-600 bg-gray-100';
    return 'text-blue-600 bg-blue-100';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'completed') {
      return <CheckCircle className="w-5 h-5" />;
    }
    if (status === 'pending') {
      return <Clock className="w-5 h-5" />;
    }
    return <Loader2 className="w-5 h-5 animate-spin" />;
  };

  const getOrderProgress = (status: string): number => {
    const statusMap: Record<string, number> = {
      'pending': 1,
      'confirmed': 2,
      'preparing': 2,
      'ready': 3,
      'picked_by_delivery': 3,
      'out_for_delivery': 4,
      'delivered': 5,
      'cancelled': 0,
    };
    return statusMap[status.toLowerCase()] || 0;
  };

  const progressSteps = [
    { step: 1, label: 'Order Placed', Icon: FileText },
    { step: 2, label: 'Confirmed', Icon: CheckCircle },
    { step: 3, label: 'Preparing', Icon: Package },
    { step: 4, label: 'Out for Delivery', Icon: Truck },
    { step: 5, label: 'Delivered', Icon: CheckCircle },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <XCircle className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-6">
            Batch Number: <code className="bg-gray-100 px-2 py-1 rounded">{batchNumber}</code>
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center"
          >
            ← Back to Home
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Order Traceability</h1>
          <p className="text-gray-600 mt-1">Complete supply chain transparency</p>
        </div>

        {/* Batch Number Card */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-lg shadow-lg mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-90">Batch Number</p>
              <p className="text-2xl font-bold font-mono">{data.batchNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Status</p>
              <p className="text-xl font-semibold capitalize">{data.order.status.replace(/_/g, ' ')}</p>
              {lastUpdated && (
                <p className="text-xs opacity-75 mt-1">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          
          {/* Live Update Indicator */}
          <div className="mt-4 flex items-center gap-2 text-xs opacity-90">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Auto-updating every 10 seconds</span>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Order #</h2>
          <p className="text-gray-600 mb-6">Placed on {new Date(data.order.createdAt).toLocaleString('en-IN', { 
            dateStyle: 'medium', 
            timeStyle: 'medium' 
          })}</p>

          {/* Dynamic Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200" style={{ zIndex: 0 }}>
                <div 
                  className="h-full bg-green-500 transition-all duration-500 ease-in-out"
                  style={{ 
                    width: `${((getOrderProgress(data.order.status) - 1) / 4) * 100}%` 
                  }}
                ></div>
              </div>

              {/* Progress Steps */}
              {progressSteps.map((item) => {
                const isCompleted = getOrderProgress(data.order.status) >= item.step;
                const isActive = getOrderProgress(data.order.status) === item.step;
                
                return (
                  <div key={item.step} className="flex flex-col items-center relative" style={{ zIndex: 1 }}>
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                        isCompleted 
                          ? 'bg-green-500 text-white shadow-lg' 
                          : isActive
                          ? 'bg-blue-500 text-white shadow-lg animate-pulse'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? <item.Icon className="w-6 h-6" /> : item.step}
                    </div>
                    <p className={`text-xs mt-2 text-center max-w-[80px] ${
                      isCompleted || isActive ? 'text-gray-900 font-semibold' : 'text-gray-500'
                    }`}>
                      {item.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-600">Order Number</p>
              <p className="font-semibold">{data.order.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-semibold capitalize">
                <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                  data.order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  data.order.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-800' :
                  data.order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {data.order.status.replace(/_/g, ' ')}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="font-semibold">₹{data.order.totalAmount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="font-semibold">₹{data.order.totalAmount}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600 mb-2">Items Ordered</p>
              <ul className="mt-1 space-y-1">
                {data.order.items.map((item, idx) => (
                  <li key={idx} className="text-sm bg-gray-50 p-2 rounded">
                    • {item.quantity}x {item.name} - ₹{item.price}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Restaurant Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Restaurant</h2>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-semibold">{data.restaurant.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Address</p>
              <p>{data.restaurant.address}, {data.restaurant.city}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p>{data.restaurant.phoneNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Cuisine</p>
              <p>{data.restaurant.cuisine.join(', ')}</p>
            </div>
          </div>
        </div>

        {/* Delivery Person */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-500" />
            <span>Delivery Person</span>
          </h2>
          {data.deliveryPerson.name ? (
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-semibold">{data.deliveryPerson.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p>{data.deliveryPerson.phoneNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Vehicle Number</p>
                <p className="font-mono">{data.deliveryPerson.vehicleNumber}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">{data.deliveryPerson.message || 'Not assigned yet'}</p>
          )}
        </div>

        {/* Traceability Timeline */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            <span>Traceability Timeline</span>
          </h2>
          <div className="space-y-6">
            {data.traceabilityFlow.map((stage, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`text-2xl w-12 h-12 rounded-full flex items-center justify-center ${getStatusColor(stage.status)}`}>
                    {getStatusIcon(stage.status)}
                  </div>
                  {idx < data.traceabilityFlow.length - 1 && (
                    <div className={`w-1 flex-1 mt-2 ${stage.status === 'completed' ? 'bg-green-300' : 'bg-gray-300'}`} style={{ minHeight: '40px' }}></div>
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-800">{stage.stage}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(stage.status)}`}>
                      {stage.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{stage.description}</p>
                  {stage.timestamp && (
                    <p className="text-xs text-gray-500">
                      {new Date(stage.timestamp).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-blue-50 rounded-lg p-4 mt-6 text-center">
          <p className="text-sm text-gray-700">
            <strong>Customer:</strong> {data.customer.name} • {data.customer.phoneNumber}
          </p>
        </div>
      </div>
    </div>
  );
}
