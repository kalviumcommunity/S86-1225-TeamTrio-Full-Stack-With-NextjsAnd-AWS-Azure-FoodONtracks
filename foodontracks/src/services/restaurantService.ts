/**
 * Restaurant Service - Client-side utilities for fetching restaurant data
 */

export interface Restaurant {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  description: string;
  address: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  cuisine: string[];
  rating: number;
  isActive: boolean;
  imageUrl?: string;
  createdAt: string;
}

export interface RestaurantFilters {
  city?: string;
  state?: string;
  isActive?: boolean;
  minRating?: number;
  page?: number;
  limit?: number;
}

export interface RestaurantResponse {
  success: boolean;
  data: {
    restaurants: Restaurant[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message?: string;
}

/**
 * Fetch restaurants by city name
 * @param city - City name to filter by
 * @param options - Additional filter options
 * @returns Promise with restaurant data
 */
export async function fetchRestaurantsByCity(
  city: string,
  options: Omit<RestaurantFilters, 'city'> = {}
): Promise<RestaurantResponse> {
  try {
    const params = new URLSearchParams({
      city,
      ...(options.state && { state: options.state }),
      ...(options.isActive !== undefined && { isActive: String(options.isActive) }),
      ...(options.minRating && { minRating: String(options.minRating) }),
      ...(options.page && { page: String(options.page) }),
      ...(options.limit && { limit: String(options.limit) }),
    });

    const response = await fetch(`/api/restaurants?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch restaurants: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching restaurants by city:', error);
    throw error;
  }
}

/**
 * Fetch all restaurants with optional filters
 * @param filters - Filter options
 * @returns Promise with restaurant data
 */
export async function fetchRestaurants(
  filters: RestaurantFilters = {}
): Promise<RestaurantResponse> {
  try {
    const params = new URLSearchParams();
    
    if (filters.city) params.append('city', filters.city);
    if (filters.state) params.append('state', filters.state);
    if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters.minRating) params.append('minRating', String(filters.minRating));
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    const url = `/api/restaurants${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch restaurants: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    throw error;
  }
}

/**
 * Fetch a single restaurant by ID
 * @param id - Restaurant ID
 * @returns Promise with restaurant data
 */
export async function fetchRestaurantById(id: string): Promise<Restaurant> {
  try {
    const response = await fetch(`/api/restaurants/${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch restaurant: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching restaurant by ID:', error);
    throw error;
  }
}

/**
 * Get unique cities from all restaurants
 * @returns Promise with array of unique city names
 */
export async function getAvailableCities(): Promise<string[]> {
  try {
    const response = await fetchRestaurants({ limit: 1000 });
    const cities = new Set<string>();
    
    response.data.restaurants.forEach(restaurant => {
      if (restaurant.city) {
        cities.add(restaurant.city);
      }
    });
    
    return Array.from(cities).sort();
  } catch (error) {
    console.error('Error fetching available cities:', error);
    return [];
  }
}
