'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { Search, UtensilsCrossed, MapPin, Star, ImageOff } from 'lucide-react';

interface Restaurant {
  _id: string;
  name: string;
  description: string;
  address: string;
  cuisine: string[];
  rating: number;
  isActive: boolean;
  imageUrl?: string;
  physicalAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
    landmark?: string;
  };
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('all');

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const response = await fetch('/api/restaurants?limit=100');
      if (response.ok) {
        const data = await response.json();
        setRestaurants(data.data?.restaurants || []);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch restaurants by city
  const fetchRestaurantsByCity = async (city: string) => {
    if (!city.trim()) {
      fetchRestaurants();
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        city: city.trim(),
        limit: '100',
      });
      const response = await fetch(`/api/restaurants?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setRestaurants(data.data?.restaurants || []);
      }
    } catch (error) {
      console.error('Error fetching restaurants by city:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle city search
  const handleCitySearch = () => {
    fetchRestaurantsByCity(cityFilter);
  };

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCuisine = cuisineFilter === 'all' || 
      restaurant.cuisine?.some(c => c.toLowerCase() === cuisineFilter.toLowerCase());
    return matchesSearch && matchesCuisine && restaurant.isActive;
  });

  const allCuisines = Array.from(
    new Set(restaurants.flatMap((r) => r.cuisine || []))
  );

  const allCities = Array.from(
    new Set(restaurants.map((r) => r.physicalAddress?.city).filter(Boolean))
  ).sort() as string[];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-yellow-200 dark:border-yellow-600 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            Discover Restaurants
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Order from the best restaurants in your area
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur shadow-md sticky top-0 z-10 border-b border-yellow-200 dark:border-yellow-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            {/* City Search */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter city name..."
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCitySearch()}
                className="flex-1 px-4 py-2 border-2 border-yellow-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/90 dark:bg-gray-900/80 text-gray-900 dark:text-white placeholder:text-gray-400"
                list="cities-list"
              />
              <datalist id="cities-list">
                {allCities.map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
              <Button
                onClick={handleCitySearch}
                className="px-6 whitespace-nowrap bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white rounded-xl shadow-md flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>Search City</span>
              </Button>
              {cityFilter && (
                <Button
                  onClick={() => {
                    setCityFilter('');
                    fetchRestaurants();
                  }}
                  variant="outline"
                  className="whitespace-nowrap"
                >
                  Clear
                </Button>
              )}
            </div>
            
            {/* Name and Cuisine Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Search restaurants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/90 dark:bg-gray-900/80 text-gray-900 dark:text-white placeholder:text-gray-400"
              />
              <select
                value={cuisineFilter}
                onChange={(e) => setCuisineFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/90 dark:bg-gray-900/80 text-gray-900 dark:text-white"
              >
                <option value="all">All Cuisines</option>
                {allCuisines.map((cuisine) => (
                  <option key={cuisine} value={cuisine}>
                    {cuisine}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {filteredRestaurants.length === 0 ? (
          <EmptyState
            icon={
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-50 text-orange-500 dark:bg-yellow-900/30 dark:text-orange-300 shadow-sm">
                <UtensilsCrossed className="w-8 h-8" />
              </div>
            }
            title="No restaurants found"
            description="Try adjusting your search or filters"
          />
        ) : (
          <>
            <p className="text-gray-600 mb-6">
              Found {filteredRestaurants.length} restaurant{filteredRestaurants.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRestaurants.map((restaurant) => (
                <Link
                  key={restaurant._id}
                  href={`/restaurants/${restaurant._id}`}
                  className="group"
                >
                  <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1 border border-yellow-100 dark:border-yellow-900/40">
                    {restaurant.imageUrl ? (
                      <div className="relative w-full h-48">
                        <NextImage
                          src={restaurant.imageUrl}
                          alt={restaurant.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover"
                          priority={false}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-yellow-200 to-orange-400 flex items-center justify-center text-orange-700">
                        <ImageOff className="w-12 h-12" />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition">
                        {restaurant.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {restaurant.description}
                      </p>
                      
                      {/* Physical Address */}
                      {restaurant.physicalAddress && (
                        <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-orange-500 mt-0.5" />
                            <div className="line-clamp-2">
                              {restaurant.physicalAddress.city}, {restaurant.physicalAddress.state}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {restaurant.cuisine?.slice(0, 3).map((cuisine) => (
                          <Badge key={cuisine} variant="default" size="sm">
                            {cuisine}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-orange-600 dark:bg-yellow-900/40 dark:text-orange-300">
                            <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
                            <span>
                              {restaurant.rating?.toFixed(1) || 'New'}
                            </span>
                          </span>
                        </div>
                        <Button size="sm" className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white rounded-full">
                          View Menu
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
