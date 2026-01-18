'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { UserRole } from '@/types/user';
import { UtensilsCrossed, Star, MapPin, Phone, Mail } from 'lucide-react';

interface Restaurant {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  description: string;
  address: string;
  cuisine: string[];
  rating?: number;
  isActive: boolean;
  imageUrl?: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminRestaurantsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const verifyAndFetchRestaurants = async () => {
      try {
        setLoading(true);
        
        // Verify authentication and role
        const verifyRes = await fetch('/api/auth/verify');
        if (!verifyRes.ok) {
          router.push('/login?error=unauthorized&redirect=/dashboard/admin/restaurants');
          return;
        }

        const { user } = await verifyRes.json();
        if (user.role !== UserRole.ADMIN) {
          router.push('/dashboard?error=forbidden');
          return;
        }

        // Fetch restaurants
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '20',
        });
        
        if (statusFilter !== '') {
          params.append('isActive', statusFilter);
        }

        const restaurantsRes = await fetch(`/api/restaurants?${params}`);
        if (restaurantsRes.ok) {
          const data = await restaurantsRes.json();
          setRestaurants(data.data?.restaurants || data.restaurants || []);
          setPagination(data.data?.pagination || data.pagination || null);
        }
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      } finally {
        setLoading(false);
      }
    };

    verifyAndFetchRestaurants();
  }, [router, statusFilter, currentPage]);

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading restaurants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <button
                onClick={() => router.push('/dashboard/admin')}
                className="text-sm text-orange-600 hover:text-orange-800 mb-2 flex items-center"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Restaurant Management</h1>
              <p className="text-sm text-gray-600">View and manage all restaurants</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filter Restaurants</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleStatusFilterChange('')}
              className={`px-4 py-2 rounded-lg transition ${
                statusFilter === ''
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Restaurants
            </button>
            <button
              onClick={() => handleStatusFilterChange('true')}
              className={`px-4 py-2 rounded-lg transition ${
                statusFilter === 'true'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              Active Only
            </button>
            <button
              onClick={() => handleStatusFilterChange('false')}
              className={`px-4 py-2 rounded-lg transition ${
                statusFilter === 'false'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              Inactive Only
            </button>
          </div>
        </div>

        {/* Restaurants Grid */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">
              {statusFilter === 'true' ? 'Active Restaurants' : statusFilter === 'false' ? 'Inactive Restaurants' : 'All Restaurants'}
              {pagination && (
                <span className="ml-2 text-sm font-normal text-gray-600">
                  ({pagination.total} total)
                </span>
              )}
            </h2>
          </div>

          <div className="p-6">
            {restaurants.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No restaurants found
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.map((restaurant) => (
                  <div
                    key={restaurant._id}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition"
                  >
                    {restaurant.imageUrl ? (
                      <div className="relative w-full h-48">
                        <Image
                          src={restaurant.imageUrl}
                          alt={restaurant.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                        <UtensilsCrossed className="w-16 h-16 text-white" />
                      </div>
                    )}
                    
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 flex-1">
                          {restaurant.name}
                        </h3>
                        <span
                          className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                            restaurant.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {restaurant.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {restaurant.rating !== undefined && (
                        <div className="flex items-center mb-2">
                          <Star className="w-4 h-4 text-yellow-500 mr-1 fill-yellow-500" />
                          <span className="text-sm font-medium text-gray-700">
                            {restaurant.rating.toFixed(1)}
                          </span>
                        </div>
                      )}

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {restaurant.description}
                      </p>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-start">
                          <MapPin className="w-4 h-4 text-gray-500 mr-2 mt-0.5" />
                          <span className="text-gray-700 flex-1">{restaurant.address}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 text-gray-500 mr-2" />
                          <span className="text-gray-700">{restaurant.phoneNumber}</span>
                        </div>

                        <div className="flex items-center">
                          <Mail className="w-4 h-4 text-gray-500 mr-2" />
                          <span className="text-gray-700 text-xs">{restaurant.email}</span>
                        </div>

                        {restaurant.cuisine && restaurant.cuisine.length > 0 && (
                          <div className="flex items-center flex-wrap gap-1 mt-2">
                            <span className="text-gray-500 mr-1">🍴</span>
                            {restaurant.cuisine.slice(0, 3).map((c, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs"
                              >
                                {c}
                              </span>
                            ))}
                            {restaurant.cuisine.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{restaurant.cuisine.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                        Joined: {new Date(restaurant.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))
                  }
                  disabled={currentPage === pagination.totalPages}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
