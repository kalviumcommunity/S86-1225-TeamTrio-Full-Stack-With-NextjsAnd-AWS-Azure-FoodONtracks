'use client';

import { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { FileText, Star } from 'lucide-react';

interface Review {
  _id: string;
  orderNumber?: string;
  batchNumber: string;
  customerId?: {
    name: string;
  };
  restaurantId?: {
    name: string;
  };
  totalAmount: number;
  deliveryAddress?: string;
  createdAt: string;
  ratings?: {
    delivery?: {
      rating: number;
      comment?: string;
      ratedAt: string;
    };
  };
  items: Array<{
    name: string;
    quantity: number;
  }>;
}

export default function DeliveryReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ avgRating: 0, totalReviews: 0 });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/delivery/reviews', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        const reviewsData = data.reviews || [];
        setReviews(reviewsData);
        
        // Calculate stats
        const totalReviews = reviewsData.length;
        const avgRating = totalReviews > 0
          ? reviewsData.reduce((sum: number, r: Review) => sum + (r.ratings?.delivery?.rating || 0), 0) / totalReviews
          : 0;
        
        setStats({ avgRating, totalReviews });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
          <Star className="w-6 h-6" />
          <span>My Delivery Reviews</span>
        </h1>
        
        {/* Stats Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="text-center py-8">
            <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
              <Star className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Your Performance</h2>
            <p className="text-gray-600 mb-6">
              Customer feedback on your delivery service
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <div className="bg-gradient-to-br from-green-100 to-green-200 px-6 py-3 rounded-lg">
                <p className="font-bold text-2xl text-green-800">
                  {stats.avgRating.toFixed(1)}
                </p>
                <p className="text-green-600">Average Rating</p>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 px-6 py-3 rounded-lg">
                <p className="font-bold text-2xl text-blue-800">
                  {stats.totalReviews}
                </p>
                <p className="text-blue-600">Total Reviews</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
              <FileText className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No Reviews Yet</h2>
            <p className="text-gray-600">
              Customer reviews for your deliveries will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review._id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-blue-500"
              >
                {/* Review Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">
                        {review.customerId?.name || 'Customer'}
                      </h3>
                      {/* Star Rating */}
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={
                              star <= (review.ratings?.delivery?.rating || 0)
                                ? 'w-4 h-4 text-yellow-400 fill-yellow-400'
                                : 'w-4 h-4 text-gray-300'
                            }
                          />
                        ))}
                        <span className="ml-2 font-bold text-blue-600">
                          {review.ratings?.delivery?.rating}/5
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Order #{review.orderNumber || review.batchNumber}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {review.restaurantId?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {review.ratings?.delivery?.ratedAt
                        ? new Date(review.ratings.delivery.ratedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : new Date(review.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                    </p>
                  </div>
                </div>

                {/* Review Comment */}
                {review.ratings?.delivery?.comment && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                    <p className="text-gray-800 italic">
                      &ldquo;{review.ratings.delivery.comment}&rdquo;
                    </p>
                  </div>
                )}

                {/* Order Details */}
                <div className="border-t pt-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        Order Items:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {review.items.map((item, idx) => (
                          <span
                            key={idx}
                            className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-700"
                          >
                            {item.name} × {item.quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Delivery Address:</span><br />
                        {review.deliveryAddress || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        Order Total: <span className="font-semibold">₹{review.totalAmount.toFixed(2)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
