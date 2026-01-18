'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import Button from '@/components/ui/Button';
import InputField from '@/components/ui/InputField';
import { Textarea } from '@/components/ui/Textarea';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from 'sonner';

interface Address {
  trainNumber: string;
  trainName: string;
  seatNumber: string;
  pnrNumber: string;
  phoneNumber: string;
  deliveryDateTime: string;
  ticketUrl?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart, getRestaurantId } = useCart();
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [address, setAddress] = useState<Address>({
    trainNumber: '',
    trainName: '',
    seatNumber: '',
    pnrNumber: '',
    phoneNumber: '',
    deliveryDateTime: '',
    ticketUrl: '',
  });
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'UPI' | 'COD'>('CARD');

  useEffect(() => {
    if (items.length === 0) {
      router.push('/restaurants');
    }
  }, [items, router]);

  const handleAddressChange = (field: keyof Address, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const validateAddress = (): boolean => {
    if (!address.trainNumber || !address.trainName || !address.seatNumber || 
        !address.pnrNumber || !address.phoneNumber || !address.deliveryDateTime) {
      toast.error('Please fill in all required train delivery fields');
      return false;
    }
    return true;
  };

  // TODO: PRODUCTION PAYMENT INTEGRATION REQUIRED
  // This is a mock payment gateway for development/testing only
  // For production, integrate with Razorpay:
  // 1. Install: npm install razorpay
  // 2. Get API keys from https://dashboard.razorpay.com/
  // 3. Replace this mock with actual Razorpay integration
  // 4. Add environment variables: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET
  // Reference: https://razorpay.com/docs/payment-gateway/web-integration/standard/
  const mockRazorpayPayment = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      // Simulate Razorpay payment gateway
      setTimeout(() => {
        // 90% success rate simulation for testing
        const success = Math.random() > 0.1;
        resolve(success);
      }, 2000);
    });
  };

  const handlePlaceOrder = async () => {
    if (!validateAddress()) return;

    setLoading(true);
    setProcessingPayment(true);

    try {
      // Step 1: Get authenticated user
      const userResponse = await fetch('/api/auth/verify', { credentials: 'include' });
      if (!userResponse.ok) {
        throw new Error('Please log in to place an order');
      }
      const userData = await userResponse.json();
      const userId = userData.user.userId;

      // Step 2: Process mock payment (if not COD)
      if (paymentMethod !== 'COD') {
        toast.info('Processing payment with Razorpay (Mock)...');
        const paymentSuccess = await mockRazorpayPayment();
        
        if (!paymentSuccess) {
          toast.error('Payment failed. Please try again.');
          setProcessingPayment(false);
          setLoading(false);
          return;
        }
        toast.success('Payment successful!');
      }

      // Step 3: Create Address for train delivery details
      const addressData = {
        userId,
        addressLine1: `Train: ${address.trainName} (${address.trainNumber}), Seat: ${address.seatNumber}`,
        addressLine2: `PNR: ${address.pnrNumber}, Phone: ${address.phoneNumber}`,
        city: 'Train Delivery',
        state: 'India',
        zipCode: '000000',
        country: 'India',
        isDefault: false,
      };

      const addressResponse = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressData),
        credentials: 'include',
      });

      if (!addressResponse.ok) {
        const errorData = await addressResponse.json();
        console.error('Address creation failed:', errorData);
        console.error('Sent data:', addressData);
        throw new Error(errorData.errors ? JSON.stringify(errorData.errors) : 'Failed to save delivery details');
      }

      const addressResult = await addressResponse.json();
      const addressId = addressResult.data._id;

      // Step 4: Calculate order totals
      const subtotal = getTotalPrice();
      const deliveryFee = 40;
      const tax = subtotal * 0.05;

      // Step 5: Create order with correct API structure
      const orderData = {
        userId,
        restaurantId: getRestaurantId(),
        addressId,
        orderItems: items.map((item) => ({
          menuItemId: item._id,
          quantity: item.quantity,
          price: item.price,
        })),
        deliveryFee,
        tax,
        discount: 0,
        specialInstructions: `Train Delivery - ${address.trainName} (${address.trainNumber})
PNR: ${address.pnrNumber}
Seat: ${address.seatNumber}
Phone: ${address.phoneNumber}
Expected Delivery: ${address.deliveryDateTime}
${address.ticketUrl ? 'Ticket: ' + address.ticketUrl : ''}
${deliveryInstructions ? 'Instructions: ' + deliveryInstructions : ''}`,
        paymentMethod: paymentMethod === 'CARD' ? 'CARD' : paymentMethod === 'UPI' ? 'UPI' : 'CASH',
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Order creation failed:', error);
        console.error('Sent order data:', orderData);
        throw new Error(error.message || error.errors ? JSON.stringify(error.errors) : 'Failed to create order');
      }

      const data = await response.json();
      
      // Clear cart and redirect
      clearCart();
      toast.success('Order placed successfully!');
      router.push(`/orders/${data.data._id}`);
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to place order');
    } finally {
      setLoading(false);
      setProcessingPayment(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  const subtotal = getTotalPrice();
  const deliveryFee = 40;
  const tax = subtotal * 0.05; // 5% tax
  const total = subtotal + deliveryFee + tax;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Train Delivery Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Train Delivery Details</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Train Number"
                    value={address.trainNumber}
                    onChange={(e) => handleAddressChange('trainNumber', e.target.value)}
                    required
                    placeholder="e.g., 12345"
                  />
                  <InputField
                    label="Train Name"
                    value={address.trainName}
                    onChange={(e) => handleAddressChange('trainName', e.target.value)}
                    required
                    placeholder="e.g., Rajdhani Express"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Seat No"
                    value={address.seatNumber}
                    onChange={(e) => handleAddressChange('seatNumber', e.target.value)}
                    required
                    placeholder="e.g., A1/23"
                  />
                  <InputField
                    label="PNR Number"
                    value={address.pnrNumber}
                    onChange={(e) => handleAddressChange('pnrNumber', e.target.value)}
                    required
                    placeholder="e.g., 1234567890"
                  />
                </div>
                <InputField
                  label="Phone Number"
                  type="tel"
                  value={address.phoneNumber}
                  onChange={(e) => handleAddressChange('phoneNumber', e.target.value)}
                  required
                  placeholder="e.g., +91 9876543210"
                />
                <InputField
                  label="Expected Delivery Date & Time"
                  type="datetime-local"
                  value={address.deliveryDateTime}
                  onChange={(e) => handleAddressChange('deliveryDateTime', e.target.value)}
                  required
                />
                <InputField
                  label="Ticket URL (Optional)"
                  value={address.ticketUrl}
                  onChange={(e) => handleAddressChange('ticketUrl', e.target.value)}
                  placeholder="Upload ticket image or paste URL"
                />
                <Textarea
                  label="Delivery Instructions (Optional)"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="e.g., Coach number, additional notes"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>
              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CARD"
                    checked={paymentMethod === 'CARD'}
                    onChange={() => setPaymentMethod('CARD')}
                    className="w-4 h-4 text-orange-600"
                  />
                  <div className="ml-3">
                    <span className="font-semibold">Credit/Debit Card (Mock Razorpay)</span>
                    <p className="text-sm text-gray-600">Secure payment via Razorpay gateway</p>
                  </div>
                </label>
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="UPI"
                    checked={paymentMethod === 'UPI'}
                    onChange={() => setPaymentMethod('UPI')}
                    className="w-4 h-4 text-orange-600"
                  />
                  <div className="ml-3">
                    <span className="font-semibold">UPI (Mock Razorpay)</span>
                    <p className="text-sm text-gray-600">Pay using Google Pay, PhonePe, Paytm</p>
                  </div>
                </label>
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="w-4 h-4 text-orange-600"
                  />
                  <div className="ml-3">
                    <span className="font-semibold">Cash on Delivery</span>
                    <p className="text-sm text-gray-600">Pay when your order arrives</p>
                  </div>
                </label>
              </div>

              {paymentMethod !== 'COD' && (
                <Alert variant="info" className="mt-4">
                  This is a mock payment integration. No real payment will be processed.
                </Alert>
              )}
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item._id} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-semibold">₹{deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (5%)</span>
                  <span className="font-semibold">₹{tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-green-600">₹{total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full mt-6"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner size="sm" />
                    {processingPayment ? 'Processing Payment...' : 'Placing Order...'}
                  </span>
                ) : (
                  `Place Order - ₹${total.toFixed(2)}`
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
