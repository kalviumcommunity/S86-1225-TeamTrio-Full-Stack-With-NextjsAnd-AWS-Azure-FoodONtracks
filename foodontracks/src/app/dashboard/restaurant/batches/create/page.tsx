'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import InputField from '@/components/ui/InputField';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/Spinner';

interface Order {
  _id: string;
  orderNumber?: string;
  batchNumber: string;
  totalAmount: number;
  status: string;
  deliveryAddress: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  batchTracking?: {
    preparedBy?: string;
    preparedAt?: string;
    foodTemperature?: number;
    handoverTemperature?: number;
    handoverTime?: string;
    qualityCheck?: boolean;
    notes?: string;
  };
}

export default function CreateBatchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [batchNumber, setBatchNumber] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState({
    preparedBy: '',
    foodTemperature: '',
    handoverTemperature: '',
    qualityCheck: false,
    notes: '',
  });

  useEffect(() => {
    const batchParam = searchParams?.get('batch');
    if (batchParam) {
      setBatchNumber(batchParam);
      // Auto-search when batch number is in URL
      searchBatchByNumber(batchParam);
    }
  }, [searchParams]);

  const searchBatchByNumber = async (batch: string) => {
    if (!batch.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(`/api/orders/batch/${encodeURIComponent(batch)}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setOrder(data.data);
        
        // Pre-fill form if batch tracking exists
        if (data.data.batchTracking) {
          setFormData({
            preparedBy: data.data.batchTracking.preparedBy || '',
            foodTemperature: data.data.batchTracking.foodTemperature?.toString() || '',
            handoverTemperature: data.data.batchTracking.handoverTemperature?.toString() || '',
            qualityCheck: data.data.batchTracking.qualityCheck || false,
            notes: data.data.batchTracking.notes || '',
          });
        }
        toast.success('Order found!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Batch number not found');
        setOrder(null);
      }
    } catch (error) {
      console.error('Error searching batch:', error);
      toast.error('Failed to search batch number');
      setOrder(null);
    } finally {
      setSearching(false);
    }
  };

  const searchBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchNumber.trim()) {
      toast.error('Please enter a batch number');
      return;
    }
    searchBatchByNumber(batchNumber);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${order._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          batchTracking: {
            preparedBy: formData.preparedBy,
            foodTemperature: formData.foodTemperature ? parseFloat(formData.foodTemperature) : undefined,
            handoverTemperature: formData.handoverTemperature ? parseFloat(formData.handoverTemperature) : undefined,
            qualityCheck: formData.qualityCheck,
            notes: formData.notes,
          },
        }),
      });

      if (response.ok) {
        toast.success('Batch tracking updated successfully!');
        router.push('/dashboard/restaurant/batches');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update batch tracking');
      }
    } catch (error) {
      console.error('Error updating batch:', error);
      toast.error('Failed to update batch tracking');
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
            ← Back to Batches
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Update Batch Tracking</h1>
          <p className="text-gray-600 mt-2">
            Enter batch number to update food quality and traceability information
          </p>
        </div>

        {/* Batch Number Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={searchBatch} className="space-y-4">
            <InputField
              label="Batch Number"
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              placeholder="e.g., foodontrack-UJF85T"
              required
            />
            <Button type="submit" disabled={searching} className="w-full">
              {searching ? <Spinner size="sm" /> : 'Search Batch'}
            </Button>
          </form>
        </div>

        {/* Order Details */}
        {order && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Order Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Order Number</div>
                  <div className="font-semibold">{order.orderNumber || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Batch Number</div>
                  <div className="font-semibold text-orange-600">{order.batchNumber}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <div className="font-semibold capitalize">{order.status.replace(/_/g, ' ')}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Amount</div>
                  <div className="font-semibold">₹{order.totalAmount.toFixed(2)}</div>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="text-sm text-gray-600 mb-2">Order Items</div>
                <div className="space-y-1">
                  {order.items.map((item, index) => (
                    <div key={index} className="text-sm">
                      {item.name} × {item.quantity}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Batch Tracking Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Batch Tracking Information</h2>
              
              {/* Prepared By */}
              <div className="mb-4">
                <InputField
                  label="Prepared By (Staff Name)"
                  type="text"
                  value={formData.preparedBy}
                  onChange={(e) => setFormData({ ...formData, preparedBy: e.target.value })}
                  placeholder="Enter staff name"
                  required
                />
              </div>

              {/* Temperature Fields */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <InputField
                  label="Food Temperature (°C)"
                  type="number"
                  step="0.1"
                  value={formData.foodTemperature}
                  onChange={(e) => setFormData({ ...formData, foodTemperature: e.target.value })}
                  placeholder="e.g., 75"
                />
                <InputField
                  label="Handover Temperature (°C)"
                  type="number"
                  step="0.1"
                  value={formData.handoverTemperature}
                  onChange={(e) => setFormData({ ...formData, handoverTemperature: e.target.value })}
                  placeholder="e.g., 65"
                />
              </div>

              {/* Quality Check */}
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.qualityCheck}
                    onChange={(e) => setFormData({ ...formData, qualityCheck: e.target.checked })}
                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="font-medium">Quality Check Passed</span>
                </label>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Add any notes about food quality, preparation process, etc."
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Updating...' : 'Update Batch Details'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
