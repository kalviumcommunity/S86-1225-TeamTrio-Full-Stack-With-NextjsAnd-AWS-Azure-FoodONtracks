'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import { Bike, CheckCircle, Clock, FileText, Phone, Save, Trash2, UtensilsCrossed, XCircle } from 'lucide-react';

interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  orderNumber?: string;
  batchNumber?: string;
  restaurantId?: {
    _id: string;
    name: string;
    location?: string;
    cuisineType?: string;
  };
  deliveryPersonId?: {
    _id: string;
    name: string;
    email?: string;
    phoneNumber?: string;
    vehicleType?: string;
    vehicleNumber?: string;
  };
  items: OrderItem[];
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  deliveryAddress: string;
  phoneNumber: string;
  notes?: string;
  createdAt: string;
  estimatedDeliveryTime?: string;
  ratings?: {
    restaurant?: number;
    delivery?: number;
  };
}

interface Review {
  _id: string;
  restaurantRating?: number;
  restaurantComment?: string;
  restaurantRatedAt?: string;
  deliveryRating?: number;
  deliveryComment?: string;
  deliveryRatedAt?: string;
}

function StarRating({ rating, setRating, label }: { rating: number; setRating: (r: number) => void; label: string }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="text-3xl hover:scale-110 transition-transform cursor-pointer focus:outline-none"
          >
            <span className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}>
              ★
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [hasReview, setHasReview] = useState(false);
  const [editMode, setEditMode] = useState({ restaurant: false, delivery: false });
  const [restaurantRating, setRestaurantRating] = useState(0);
  const [restaurantComment, setRestaurantComment] = useState('');
  const [submittingRestaurantRating, setSubmittingRestaurantRating] = useState(false);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [deliveryComment, setDeliveryComment] = useState('');
  const [submittingDeliveryRating, setSubmittingDeliveryRating] = useState(false);
  const [deletingRating, setDeletingRating] = useState(false);

  const fetchExistingRating = useCallback(async () => {
    if (!orderId) return;
    try {
      const response = await fetch(`/api/orders/${orderId}/rating`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        if (data.hasReview && data.review) {
          setHasReview(true);
          setExistingReview(data.review);
          setRestaurantRating(data.review.restaurantRating || 0);
          setRestaurantComment(data.review.restaurantComment || '');
          setDeliveryRating(data.review.deliveryRating || 0);
          setDeliveryComment(data.review.deliveryComment || '');
        }
      }
    } catch (error) {
      console.error('Error fetching existing rating:', error);
    }
  }, [orderId]);

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) return;
    try {
      const response = await fetch(`/api/orders/${orderId}`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setOrder(data.data || data.order);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    fetchOrderDetails();
    fetchExistingRating();
  }, [orderId, fetchOrderDetails, fetchExistingRating]);

  const handleSubmitRestaurantRating = async () => {
    if (!orderId || !restaurantRating) {
      toast.error('Please select a rating');
      return;
    }
    setSubmittingRestaurantRating(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ratingType: 'restaurant', rating: restaurantRating, comment: restaurantComment }),
      });
      if (response.ok) {
        toast.success(hasReview && editMode.restaurant ? 'Restaurant rating updated!' : 'Restaurant rating submitted!');
        await fetchExistingRating();
        await fetchOrderDetails(); // Refresh order data
        setEditMode({ ...editMode, restaurant: false });
        setHasReview(true); // Mark as having a review
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting restaurant rating:', error);
      toast.error('Error submitting rating');
    } finally {
      setSubmittingRestaurantRating(false);
    }
  };

  const handleSubmitDeliveryRating = async () => {
    if (!orderId || !deliveryRating) {
      toast.error('Please select a rating');
      return;
    }
    setSubmittingDeliveryRating(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ratingType: 'delivery', rating: deliveryRating, comment: deliveryComment }),
      });
      if (response.ok) {
        toast.success(hasReview && editMode.delivery ? 'Delivery rating updated!' : 'Delivery rating submitted!');
        await fetchExistingRating();
        await fetchOrderDetails(); // Refresh order data
        setEditMode({ ...editMode, delivery: false });
        setHasReview(true); // Mark as having a review
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting delivery rating:', error);
      toast.error('Error submitting rating');
    } finally {
      setSubmittingDeliveryRating(false);
    }
  };

  const handleDeleteRating = async () => {
    if (!orderId || !confirm('Are you sure you want to delete all your ratings for this order?')) {
      return;
    }
    setDeletingRating(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/rating`, { 
        method: 'DELETE', 
        credentials: 'include' 
      });
      if (response.ok) {
        toast.success('All ratings deleted successfully!');
        setHasReview(false);
        setExistingReview(null);
        setRestaurantRating(0);
        setRestaurantComment('');
        setDeliveryRating(0);
        setDeliveryComment('');
        setEditMode({ restaurant: false, delivery: false });
        await fetchOrderDetails();
      } else {
        toast.error('Failed to delete ratings');
      }
    } catch (error) {
      console.error('Error deleting ratings:', error);
      toast.error('Error deleting ratings');
    } finally {
      setDeletingRating(false);
    }
  };

  const getStatusColor = (status: string): 'default' | 'success' | 'warning' | 'danger' => {
    const s = status.toLowerCase();
    if (s === 'delivered') return 'success';
    if (s === 'cancelled' || s === 'failed') return 'danger';
    if (s === 'pending') return 'warning';
    return 'default';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  if (!orderId || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <EmptyState 
            icon={<XCircle className="w-14 h-14 text-red-500" />} 
            title="Order not found" 
            description="The order you're looking for doesn't exist." 
            action={
              <Button onClick={() => router.push('/dashboard/customer')}>
                View All Orders
              </Button>
            } 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Message */}
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6 text-center">
          <div className="mx-auto mb-3 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-600 shadow-sm">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-green-800 mb-2">Order Placed Successfully!</h1>
          <p className="text-green-700">
            Order #{order.orderNumber} has been received and is being processed.
          </p>
        </div>

        {/* Order Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Order #{order.orderNumber}</h2>
              <p className="text-gray-600">Placed on {new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <Badge variant={getStatusColor(order.status)} size="lg">
              {order.status.replace('_', ' ')}
            </Badge>
          </div>

          {/* Order Progress */}
          <div className="flex items-center justify-between mb-6">
            {['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'].map((status, index) => (
              <div key={status} className="flex-1 flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    order.status === status || index < ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'].indexOf(order.status)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                {index < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      index < ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'].indexOf(order.status)
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {order.estimatedDeliveryTime && (
            <p className="flex items-center justify-center gap-2 text-center text-gray-700 bg-blue-50 p-3 rounded-lg">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>
                Estimated Delivery: {new Date(order.estimatedDeliveryTime).toLocaleString()}
              </span>
            </p>
          )}
        </div>

        {/* Delivery Person Info */}
        {['ready', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'].includes(order.status.toLowerCase()) && order.deliveryPersonId && (
          <div className="bg-linear-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/15 shadow-md">
                <Bike className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <p className="text-sm opacity-90 mb-1">Your Delivery Partner</p>
                <h3 className="text-2xl font-bold mb-3">{order.deliveryPersonId.name}</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={`tel:${order.deliveryPersonId.phoneNumber}`}
                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all"
                  >
                    <Phone className="w-4 h-4" />
                    <span className="font-semibold">{order.deliveryPersonId.phoneNumber}</span>
                  </a>
                  {order.deliveryPersonId.vehicleType && (
                    <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                      <Bike className="w-4 h-4" />
                      <span className="capitalize">{order.deliveryPersonId.vehicleType}</span>
                      {order.deliveryPersonId.vehicleNumber && (
                        <span className="font-semibold ml-2">{order.deliveryPersonId.vehicleNumber}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Restaurant Info */}
        {order.restaurantId && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Restaurant</h3>
            <p className="text-gray-700">{order.restaurantId.name}</p>
            {order.restaurantId.location && (
              <p className="text-gray-600 text-sm mt-1">{order.restaurantId.location}</p>
            )}
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Order Items</h3>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <span className="font-semibold text-gray-900">{item.name}</span>
                  <span className="text-gray-600 ml-2">× {item.quantity}</span>
                </div>
                <span className="font-semibold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t mt-4 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-green-600">₹{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Delivery Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Delivery Details</h3>
          <div className="space-y-2">
            <p className="text-gray-700">
              <span className="font-semibold">Address:</span> {order.deliveryAddress}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Phone:</span> {order.phoneNumber}
            </p>
            {order.notes && (
              <p className="text-gray-700">
                <span className="font-semibold">Instructions:</span> {order.notes}
              </p>
            )}
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Details</h3>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700">Payment Method:</span>
            <span className="font-semibold text-gray-900">{order.paymentMethod}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Payment Status:</span>
            <Badge
              variant={['PAID', 'COMPLETED'].includes((order.paymentStatus || '').toUpperCase()) ? 'success' : 'warning'}
            >
              {order.paymentStatus && order.paymentStatus.toUpperCase() === 'PAID'
                ? 'Paid'
                : order.paymentStatus || 'Pending'}
            </Badge>
          </div>
        </div>

        {/* Rating Section - Only for delivered orders */}
        {order.status.toLowerCase() === 'delivered' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <FileText className="w-5 h-5 text-orange-500" />
                Rate Your Experience
              </h3>
              {hasReview && (existingReview?.restaurantRating || existingReview?.deliveryRating) && !editMode.restaurant && !editMode.delivery && (
                <Button
                  onClick={handleDeleteRating}
                  disabled={deletingRating}
                  variant="outline"
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  {deletingRating ? 'Deleting...' : (
                    <span className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      <span>Delete All Ratings</span>
                    </span>
                  )}
                </Button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Restaurant Rating */}
              {order.restaurantId && (
                <div className="bg-orange-50 p-5 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                    <span>Rate the Food &amp; Restaurant</span>
                  </h4>

                  {hasReview && existingReview?.restaurantRating && !editMode.restaurant ? (
                    <div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-2xl ${
                                  star <= (existingReview.restaurantRating || 0)
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              >
                                ★
                              </span>
                          ))}
                          <span className="ml-3 text-xl font-bold text-orange-600">
                            {existingReview.restaurantRating}/5
                          </span>
                        </div>
                      </div>
                      {existingReview.restaurantComment && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Your Comment</label>
                          <p className="text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                            {existingReview.restaurantComment}
                          </p>
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mb-4">
                        Rated on {new Date(existingReview.restaurantRatedAt || '').toLocaleString()}
                      </div>
                      <Button
                        onClick={() => setEditMode({ ...editMode, restaurant: true })}
                        className="w-full bg-orange-500 hover:bg-orange-600"
                      >
                        Edit Restaurant Rating
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <StarRating
                        rating={restaurantRating}
                        setRating={setRestaurantRating}
                        label="How was the food quality?"
                      />
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Comments (Optional)
                        </label>
                        <textarea
                          value={restaurantComment}
                          onChange={(e) => setRestaurantComment(e.target.value)}
                          placeholder="Share your experience with the food and restaurant..."
                          className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSubmitRestaurantRating}
                          disabled={submittingRestaurantRating || !restaurantRating}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submittingRestaurantRating
                            ? 'Submitting...'
                            : hasReview && editMode.restaurant
                            ? (
                              <span className="flex items-center justify-center gap-2">
                                <Save className="w-4 h-4" />
                                <span>Update</span>
                              </span>
                            )
                            : 'Submit Rating'}
                        </Button>
                        {hasReview && editMode.restaurant && (
                          <Button
                            onClick={() => {
                              setEditMode({ ...editMode, restaurant: false });
                              setRestaurantRating(existingReview?.restaurantRating || 0);
                              setRestaurantComment(existingReview?.restaurantComment || '');
                            }}
                            variant="outline"
                            className="px-4"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Delivery Person Rating */}
              {order.deliveryPersonId && (
                <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Bike className="w-4 h-4 text-blue-500" />
                    <span>Rate the Delivery Service</span>
                  </h4>

                  {hasReview && existingReview?.deliveryRating && !editMode.delivery ? (
                    <div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-2xl ${
                                star <= (existingReview.deliveryRating || 0)
                                  ? 'text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                          <span className="ml-3 text-xl font-bold text-blue-600">
                            {existingReview.deliveryRating}/5
                          </span>
                        </div>
                      </div>
                      {existingReview.deliveryComment && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Your Comment</label>
                          <p className="text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                            {existingReview.deliveryComment}
                          </p>
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mb-4">
                        Rated on {new Date(existingReview.deliveryRatedAt || '').toLocaleString()}
                      </div>
                      <Button
                        onClick={() => setEditMode({ ...editMode, delivery: true })}
                        className="w-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Edit Delivery Rating</span>
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <StarRating
                        rating={deliveryRating}
                        setRating={setDeliveryRating}
                        label="How was the delivery experience?"
                      />
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Comments (Optional)
                        </label>
                        <textarea
                          value={deliveryComment}
                          onChange={(e) => setDeliveryComment(e.target.value)}
                          placeholder="Share your experience with the delivery person..."
                          className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSubmitDeliveryRating}
                          disabled={submittingDeliveryRating || !deliveryRating}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submittingDeliveryRating
                            ? 'Submitting...'
                            : hasReview && editMode.delivery
                            ? (
                              <span className="flex items-center justify-center gap-2">
                                <Save className="w-4 h-4" />
                                <span>Update</span>
                              </span>
                            )
                            : 'Submit Rating'}
                        </Button>
                        {hasReview && editMode.delivery && (
                          <Button
                            onClick={() => {
                              setEditMode({ ...editMode, delivery: false });
                              setDeliveryRating(existingReview?.deliveryRating || 0);
                              setDeliveryComment(existingReview?.deliveryComment || '');
                            }}
                            variant="outline"
                            className="px-4"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button onClick={() => router.push('/dashboard/customer')} className="flex-1">
            View All Orders
          </Button>
          <Button onClick={() => router.push('/restaurants')} variant="outline" className="flex-1">
            Order Again
          </Button>
        </div>
      </div>
    </div>
  );
}
