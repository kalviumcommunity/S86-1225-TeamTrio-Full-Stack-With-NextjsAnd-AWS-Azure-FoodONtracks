'use client';

import { useState, useEffect } from 'react';
import { fetchRestaurantsByCity, getAvailableCities, Restaurant } from '@/services/restaurantService';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import { MapPin, Star, UtensilsCrossed } from 'lucide-react';

/**
 * Example component showing how to fetch restaurants by city
 */
export default function RestaurantsByCityExample() {
  const [selectedCity, setSelectedCity] = useState('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch available cities on mount
  useEffect(() => {
    loadAvailableCities();
  }, []);

  const loadAvailableCities = async () => {
    try {
      const cities = await getAvailableCities();
      setAvailableCities(cities);
    } catch (err) {
      console.error('Failed to load cities:', err);
    }
  };

  const handleCitySearch = async () => {
    if (!selectedCity) {
      setError('Please select a city');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetchRestaurantsByCity(selectedCity, {
        isActive: true,
        limit: 50,
      });

      setRestaurants(response.data.restaurants);
      
      if (response.data.restaurants.length === 0) {
        setError(`No restaurants found in ${selectedCity}`);
      }
    } catch (err) {
      setError('Failed to fetch restaurants. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Find Restaurants by City</h1>

      {/* City Search */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select City
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">-- Choose a city --</option>
              {availableCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleCitySearch}
              disabled={loading || !selectedCity}
              className="px-6"
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <Spinner size="xl" />
        </div>
      )}

      {/* Results */}
      {!loading && restaurants.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            Found {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''} in {selectedCity}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <Link
                key={restaurant._id}
                href={`/restaurants/${restaurant._id}`}
                className="group"
              >
                <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1">
                  {restaurant.imageUrl ? (
                    <img
                      src={restaurant.imageUrl}
                      alt={restaurant.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                      <UtensilsCrossed className="w-14 h-14 text-white drop-shadow" />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition">
                      {restaurant.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {restaurant.description}
                    </p>

                    {/* Address */}
                    <div className="mb-3 text-sm text-gray-600">
                      <div className="flex items-start gap-1">
                        <MapPin className="w-4 h-4 mt-0.5 text-orange-500" />
                        <div>
                          {restaurant.street && <div>{restaurant.street}</div>}
                          <div>
                            {[restaurant.city, restaurant.state, restaurant.zipCode]
                              .filter(Boolean)
                              .join(', ')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cuisine Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {restaurant.cuisine?.slice(0, 3).map((c) => (
                        <Badge key={c} variant="info" size="sm">
                          {c}
                        </Badge>
                      ))}
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="font-semibold">
                        {restaurant.rating?.toFixed(1) || 'New'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
