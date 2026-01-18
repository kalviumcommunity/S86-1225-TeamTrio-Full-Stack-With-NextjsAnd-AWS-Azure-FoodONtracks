'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import InputField from '@/components/ui/InputField';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { toast } from 'sonner';
import { CheckCircle, Clock, Package, Search, Truck, UtensilsCrossed } from 'lucide-react';

export default function TrackOrderPage() {
  const router = useRouter();
  const [batchNumber, setBatchNumber] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<'batch' | 'order'>('batch');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const searchValue = searchType === 'batch' ? batchNumber : orderNumber;
      
      if (!searchValue) {
        toast.error(`Please enter a ${searchType} number`);
        setLoading(false);
        return;
      }

      // Search for order by batch number
      if (searchType === 'batch') {
        const response = await fetch(`/api/batch/search?batchNumber=${searchValue}`);
        const data = await response.json();

        if (response.ok && data.order) {
          router.push(`/orders/${data.order._id}`);
        } else {
          toast.error(data.message || 'Order not found');
        }
      } else {
        // Search by order ID
        const response = await fetch(`/api/orders/${searchValue}`);
        
        if (response.ok) {
          router.push(`/orders/${searchValue}`);
        } else {
          toast.error('Order not found');
        }
      }
    } catch (error) {
      console.error('Error tracking order:', error);
      toast.error('Failed to track order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-yellow-50 via-white to-orange-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-md">
            <Search className="w-7 h-7" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Track Your Order</h1>
          <p className="text-gray-600">Enter your batch or order number to track delivery status</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setSearchType('batch')}
              className={`flex-1 py-3 rounded-lg font-semibold transition ${
                searchType === 'batch'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Track by Batch Number
            </button>
            <button
              onClick={() => setSearchType('order')}
              className={`flex-1 py-3 rounded-lg font-semibold transition ${
                searchType === 'order'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Track by Order ID
            </button>
          </div>

          <form onSubmit={handleTrack} className="space-y-6">
            {searchType === 'batch' ? (
              <InputField
                label="Batch Number"
                placeholder="e.g., foodontrack-12345"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                required
                helperText="Find your batch number in your order confirmation"
              />
            ) : (
              <InputField
                label="Order ID"
                placeholder="Enter your order ID"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                required
                helperText="Find your order ID in your email confirmation"
              />
            )}

            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              size="lg"
              className="w-full"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" />
                  Tracking...
                </span>
              ) : (
                'Track Order'
              )}
            </Button>
          </form>

          <Alert variant="info" className="mt-6">
            <p className="font-semibold mb-1">Need help?</p>
            <p className="text-sm">
              Your batch number starts with &quot;foodontrack-&quot; and can be found in your order confirmation email.
              If you&apos;re having trouble, please contact customer support.
            </p>
          </Alert>

          <div className="mt-8 p-6 bg-linear-to-r from-orange-50 to-yellow-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Order Status Guide:</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <span className="w-24 font-medium flex items-center gap-1">
                  <Clock className="w-4 h-4 text-gray-500" />
                  Pending:
                </span>
                <span>Order received, awaiting confirmation</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-24 font-medium flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Confirmed:
                </span>
                <span>Restaurant is preparing your food</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-24 font-medium flex items-center gap-1">
                  <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                  Preparing:
                </span>
                <span>Your food is being cooked</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-24 font-medium flex items-center gap-1">
                  <Package className="w-4 h-4 text-amber-500" />
                  Ready:
                </span>
                <span>Food is ready for delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-24 font-medium flex items-center gap-1">
                  <Truck className="w-4 h-4 text-blue-500" />
                  Out:
                </span>
                <span>Delivery person is on the way</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-24 font-medium flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Delivered:
                </span>
                <span>Enjoy your meal!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
