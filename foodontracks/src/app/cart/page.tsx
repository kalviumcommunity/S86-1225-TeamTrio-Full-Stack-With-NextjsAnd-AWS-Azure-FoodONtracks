'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import Button from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ShoppingCart, UtensilsCrossed } from 'lucide-react';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <EmptyState
            icon={
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-50 text-orange-500 dark:bg-yellow-900/30 dark:text-orange-300 shadow-sm">
                <ShoppingCart className="w-8 h-8" />
              </div>
            }
            title="Your cart is empty"
            description="Add some delicious items from our restaurants to get started!"
            action={
              <Link href="/restaurants">
                <Button className="mt-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white rounded-xl shadow-md">
                  Browse Restaurants
                </Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const restaurantName = items[0]?.restaurantName || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-yellow-100 dark:border-yellow-900/40">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-100 text-orange-500 dark:bg-yellow-900/30 dark:text-orange-300">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Shopping Cart</h1>
            </div>
            <Button variant="outline" onClick={clearCart}>
              Clear Cart
            </Button>
          </div>

          <div className="mb-4">
            <p className="text-gray-600">From: <span className="font-semibold">{restaurantName}</span></p>
          </div>

          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item._id}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-orange-500 dark:text-orange-300">
                    <UtensilsCrossed className="w-8 h-8" />
                  </div>
                )}

                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  )}
                  <p className="text-green-600 font-semibold mt-2">₹{item.price}</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(item._id, item.quantity - 1)}
                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold transition"
                  >
                    −
                  </button>
                  <span className="font-semibold text-lg min-w-8 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold transition"
                  >
                    +
                  </button>
                </div>

                <div className="text-right">
                  <p className="font-bold text-lg text-gray-900">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </p>
                  <button
                    onClick={() => removeItem(item._id)}
                    className="text-red-500 text-sm hover:text-red-700 mt-2 transition"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t pt-6">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xl font-semibold text-gray-700">Total:</span>
              <span className="text-3xl font-bold text-green-600">₹{getTotalPrice().toFixed(2)}</span>
            </div>

            <div className="flex gap-4">
              <Link href="/restaurants" className="flex-1">
                <Button variant="outline" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
              <Link href="/checkout" className="flex-1">
                <Button className="w-full">
                  Proceed to Checkout
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
