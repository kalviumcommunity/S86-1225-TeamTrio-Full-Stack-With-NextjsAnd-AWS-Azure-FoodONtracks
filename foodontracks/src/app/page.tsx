'use client';

import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { useEffect } from 'react';
import Button from '@/components/ui/Button';
import { Train, Zap, UtensilsCrossed, CreditCard, MapPin, Star, MessageCircle, ShoppingBag, CheckCircle, Clock } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { user } = useAuthContext();

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      if (user.role === 'ADMIN') router.push('/dashboard/admin');
      else if (user.role === 'RESTAURANT_OWNER') router.push('/dashboard/restaurant');
      else if (user.role === 'DELIVERY_GUY') router.push('/dashboard/delivery');
      else router.push('/dashboard/customer');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden bg-gradient-to-br from-yellow-50 via-orange-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 py-16 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-6 px-5 py-2 bg-white dark:bg-gray-800 border border-yellow-400 rounded-full shadow-sm">
              <Zap className="w-4 h-4 text-orange-600" fill="currentColor" />
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Next-Gen Food Delivery Platform
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
              <span className="text-gray-900 dark:text-white">Food</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-600">ON</span>
              <span className="text-gray-900 dark:text-white">tracks</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed max-w-3xl mx-auto">
              Order delicious meals from your favorite restaurants, track deliveries in real-time, and enjoy seamless dining experiences.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button
                onClick={() => router.push('/signup')}
                variant="accent"
                size="lg"
                className="min-w-[200px]"
              >
                Get Started Free
              </Button>
              <Button
                onClick={() => router.push('/restaurants')}
                variant="primary"
                size="lg"
                className="min-w-[200px]"
              >
                <UtensilsCrossed className="w-5 h-5" />
                Browse Restaurants
              </Button>
              <Button
                onClick={() => router.push('/login')}
                variant="outline"
                size="lg"
                className="min-w-[200px]"
              >
                Sign In
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border border-gray-200 dark:border-gray-700">
                <div className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-orange-600 bg-clip-text text-transparent">500+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Restaurants</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border border-gray-200 dark:border-gray-700">
                <div className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-orange-600 bg-clip-text text-transparent">10K+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Happy Customers</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border border-gray-200 dark:border-gray-700">
                <div className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-orange-600 bg-clip-text text-transparent">50K+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Orders Delivered</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border border-gray-200 dark:border-gray-700">
                <div className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-orange-600 bg-clip-text text-transparent">4.8★</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Average Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Why Choose FoodONtracks?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Experience the best food delivery with cutting-edge features
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 hover:border-yellow-400">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Train className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Fast Delivery</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Get your food delivered in 30 minutes or less with our efficient delivery network and real-time tracking.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 hover:border-yellow-400">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UtensilsCrossed className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Wide Selection</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Choose from hundreds of restaurants offering diverse cuisines from local favorites to international dishes.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 hover:border-yellow-400">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CreditCard className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Secure Payments</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Pay safely with multiple payment options including cards, UPI, wallets, and cash on delivery.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 hover:border-yellow-400">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MapPin className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Live Tracking</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Track your order in real-time from restaurant to your doorstep with detailed status updates.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 hover:border-yellow-400">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Star className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Quality Assured</h3>
              <p className="text-gray-600 leading-relaxed">
                Read reviews, check ratings, and order from verified restaurants with quality standards.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 hover:border-yellow-400">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">24/7 Support</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Get help anytime with our dedicated customer support team ready to assist you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Order food in just 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-lg">
                <ShoppingBag className="w-10 h-10" strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Browse & Select</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Explore restaurants, menus, and choose your favorite dishes
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-lg">
                <CheckCircle className="w-10 h-10" strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Checkout & Pay</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Add to cart, enter delivery address, and complete secure payment
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-lg">
                <Clock className="w-10 h-10" strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Track & Enjoy</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Track your order in real-time and enjoy fresh, hot food
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Order?
          </h2>
          <p className="text-xl mb-8 opacity-95">
            Join thousands of happy customers and get your favorite meals delivered
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push('/signup')}
              className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl active:scale-95"
            >
              Create Free Account
            </Button>
            <Button
              onClick={() => router.push('/restaurants')}
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold"
            >
              <UtensilsCrossed className="w-5 h-5" />
              Explore Restaurants
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg">
                  <Train className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-bold text-white">
                  FoodONtracks
                </h3>
              </div>
              <p className="text-gray-400">
                Your favorite food, delivered fast and fresh.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/restaurants" className="hover:text-yellow-400 transition-colors">Restaurants</a></li>
                <li><a href="/login" className="hover:text-yellow-400 transition-colors">Login</a></li>
                <li><a href="/signup" className="hover:text-yellow-400 transition-colors">Sign Up</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">For Partners</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/signup" className="hover:text-yellow-400 transition-colors">Become a Restaurant</a></li>
                <li><a href="/signup" className="hover:text-yellow-400 transition-colors">Become a Delivery Partner</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>support@foodontracks.com</li>
                <li>1800-123-4567</li>
                <li>24/7 Available</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>© 2026 FoodONtracks. All rights reserved. Built for food lovers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
