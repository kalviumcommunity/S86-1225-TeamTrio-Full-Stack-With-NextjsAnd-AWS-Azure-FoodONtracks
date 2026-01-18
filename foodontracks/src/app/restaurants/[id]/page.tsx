'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { MapPin, Phone, Star, UtensilsCrossed, ImageOff } from 'lucide-react';

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  imageUrl?: string;
  isAvailable: boolean;
}

interface Restaurant {
  _id: string;
  name: string;
  description: string;
  address: string;
  phoneNumber?: string;
  cuisineType: string[];
  rating: number;
  image?: string;
  physicalAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
    landmark?: string;
  };
}

export default function RestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (params?.id) {
      fetchRestaurantDetails();
      fetchMenuItems();
    }
  }, [params?.id]);

  const fetchRestaurantDetails = async () => {
    try {
      const response = await fetch(`/api/restaurants/${params?.id}`);
      if (response.ok) {
        const data = await response.json();
        setRestaurant(data.data);
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await fetch(`/api/menu-items?restaurantId=${params?.id}`);
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    if (!restaurant) return;
    
    addItem({
      _id: item._id,
      name: item.name,
      price: item.price,
      restaurantId: restaurant._id,
      restaurantName: restaurant.name,
      image: item.image,
      description: item.description,
    });
    
    toast.success(`${item.name} added to cart!`);
  };

  const categories = Array.from(new Set(menuItems.map((item) => item.category)));
  const filteredItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter((item) => item.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <EmptyState
            icon={<ImageOff className="w-14 h-14 text-red-500" />}
            title="Restaurant not found"
            description="The restaurant you're looking for doesn't exist."
            action={
              <Button onClick={() => router.push('/restaurants')}>
                Browse Restaurants
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Restaurant Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-6">
            {restaurant.image ? (
              <img
                src={restaurant.image}
                alt={restaurant.name}
                className="w-full md:w-64 h-64 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full md:w-64 h-64 bg-linear-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="w-20 h-20 text-white drop-shadow-lg" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
              <p className="text-gray-600 mb-4">{restaurant.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {restaurant.cuisineType?.map((cuisine) => (
                  <Badge key={cuisine} variant="info">
                    {cuisine}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="text-xl font-semibold">{restaurant.rating?.toFixed(1) || 'New'}</span>
                  </div>
                  {restaurant.phoneNumber && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{restaurant.phoneNumber}</span>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-2">
                    <div className="mt-1">
                      <MapPin className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">Physical Address</h3>
                      {restaurant.physicalAddress ? (
                        <>
                          {restaurant.physicalAddress.street && (
                            <p className="text-gray-700">{restaurant.physicalAddress.street}</p>
                          )}
                          {restaurant.physicalAddress.landmark && (
                            <p className="text-gray-600 text-sm">Near: {restaurant.physicalAddress.landmark}</p>
                          )}
                          <p className="text-gray-700">
                            {[
                              restaurant.physicalAddress.city,
                              restaurant.physicalAddress.state,
                              restaurant.physicalAddress.zipCode
                            ]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                          {restaurant.physicalAddress.country && (
                            <p className="text-gray-600 text-sm">{restaurant.physicalAddress.country}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-gray-700">{restaurant.address}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-full font-medium transition whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Items
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full font-medium transition whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {filteredItems.length === 0 ? (
          <EmptyState
            icon="🍽️"
            title="No menu items available"
            description="This restaurant hasn't added any menu items yet."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition"
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-linear-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-6xl">
                    🍽️
                  </div>
                )}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                    {!item.isAvailable && (
                      <Badge variant="danger" size="sm">
                        Unavailable
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                  <Badge variant="default" size="sm" className="mb-3">
                    {item.category}
                  </Badge>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-green-600">₹{item.price}</span>
                    <Button
                      onClick={() => handleAddToCart(item)}
                      disabled={!item.isAvailable}
                      size="sm"
                    >
                      Add to Cart
                    </Button>
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
