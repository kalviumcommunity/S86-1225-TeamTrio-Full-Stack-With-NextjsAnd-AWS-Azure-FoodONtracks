'use client';

import { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { Star, FileText } from 'lucide-react';

interface Review {
  _id: string;
  orderNumber?: string;
  batchNumber: string;
  userId?: {
    name: string;
  };
  totalAmount: number;
  createdAt: string;
  ratings?: {
    restaurant?: {
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

export default function RestaurantReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ avgRating: 0, totalReviews: 0 });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/restaurant/reviews', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        const reviewsData = data.reviews || [];
        setReviews(reviewsData);
        
        // Calculate stats
        const totalReviews = reviewsData.length;
        const avgRating = totalReviews > 0
          ? reviewsData.reduce((sum: number, r: Review) => sum + (r.ratings?.restaurant?.rating || 0), 0) / totalReviews
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
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Customer Reviews</h1>
      
      {/* Stats Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-yellow-200 dark:border-yellow-900/30">
        <div className="text-center py-8">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 mb-4">
            <Star className="w-10 h-10 text-white fill-white" />
          </div>
          <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">Reviews & Ratings</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            View and respond to customer reviews and ratings
          </p>
          <div className="flex justify-center gap-4 text-sm">
            <div className="bg-green-100 dark:bg-green-900 px-6 py-3 rounded-lg">
              <p className="font-bold text-2xl text-green-800 dark:text-green-200">
                {stats.avgRating.toFixed(1)}
              </p>
              <p className="text-green-600 dark:text-green-400">Average Rating</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 px-6 py-3 rounded-lg">
              <p className="font-bold text-2xl text-blue-800 dark:text-blue-200">
                {stats.totalReviews}
              </p>
              <p className="text-blue-600 dark:text-blue-400">Total Reviews</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center border border-gray-200 dark:border-gray-700">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-700 mb-4">
            <FileText className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">No Reviews Yet</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Customer reviews will appear here once they rate their orders
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              {/* Review Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg">
                      {review.userId?.name || 'Customer'}
                    </h3>
                    {/* Star Rating */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= (review.ratings?.restaurant?.rating || 0)
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                      <span className="ml-2 font-bold text-orange-600 dark:text-orange-400">
                        {review.ratings?.restaurant?.rating}/5
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Order #{review.orderNumber || review.batchNumber}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {review.ratings?.restaurant?.ratedAt
                      ? new Date(review.ratings.restaurant.ratedAt).toLocaleDateString('en-IN', {
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
              {review.ratings?.restaurant?.comment && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-4 mb-4">
                  <p className="text-gray-800 dark:text-gray-200 italic">
                    "{review.ratings.restaurant.comment}"
                  </p>
                </div>
              )}

              {/* Order Details */}
              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Order Items:
                </p>
                <div className="flex flex-wrap gap-2">
                  {review.items.map((item, idx) => (
                    <span
                      key={idx}
                      className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-700 dark:text-gray-300"
                    >
                      {item.name} × {item.quantity}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Order Total: <span className="font-semibold">₹{review.totalAmount.toFixed(2)}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
