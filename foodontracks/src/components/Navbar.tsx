'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { UtensilsCrossed, Package, MessageCircle, ShoppingCart, User, Menu, X, Train } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { getTotalItems } = useCart();
  const cartCount = getTotalItems();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: '/restaurants', label: 'Restaurants', icon: UtensilsCrossed },
    { href: '/dashboard/customer', label: 'My Orders', icon: Package },
    { href: '/contact', label: 'Contact', icon: MessageCircle },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-gray-200 dark:border-gray-700'
          : 'bg-white dark:bg-gray-900 shadow-md border-b-2 border-yellow-400 dark:border-yellow-600'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-md group-hover:shadow-lg transition-shadow">
              <Train className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                FoodONtracks
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 -mt-1">Fast & Fresh Delivery</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const IconComponent = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group relative flex items-center gap-2 font-medium transition-colors duration-200 px-3 py-2 rounded-lg ${
                    isActive(link.href)
                      ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950'
                      : 'text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <IconComponent className="w-5 h-5" strokeWidth={2} />
                  <span>{link.label}</span>
                  {isActive(link.href) && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-yellow-400 to-orange-500"></span>
                  )}
                </Link>
              );
            })}

            {/* Cart Button */}
            <Link href="/cart" className="relative group">
              <Button
                variant={cartCount > 0 ? 'accent' : 'outline'}
                size="md"
                className="relative"
              >
                <ShoppingCart className="w-5 h-5" strokeWidth={2} />
                <span>Cart</span>
                {cartCount > 0 && (
                  <Badge
                    variant="primary"
                    size="sm"
                    className="ml-1 bg-yellow-400 text-gray-900 font-bold"
                  >
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User Actions */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-300 dark:border-gray-700">
              <DarkModeToggle />
              <Link href="/login">
                <Button variant="outline" size="sm" className="hover:border-orange-500 hover:text-orange-600">
                  <User className="w-4 h-4" strokeWidth={2} />
                  <span>Sign In</span>
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="accent" size="sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-800 dark:text-gray-200" />
            ) : (
              <Menu className="w-6 h-6 text-gray-800 dark:text-gray-200" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="py-4 space-y-2 border-t border-gray-200 dark:border-gray-700">
            {navLinks.map((link) => {
              const IconComponent = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(link.href)
                      ? 'bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <IconComponent className="w-5 h-5" strokeWidth={2} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            <Link
              href="/cart"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" strokeWidth={2} />
              <span>Cart</span>
              {cartCount > 0 && (
                <Badge variant="accent" size="sm" className="ml-auto">
                  {cartCount}
                </Badge>
              )}
            </Link>
            <div className="flex gap-2 px-4 pt-2">
              <Link href="/login" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                <Button variant="outline" size="md" className="w-full">
                  <User className="w-4 h-4" strokeWidth={2} />
                  <span>Sign In</span>
                </Button>
              </Link>
              <Link href="/signup" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                <Button variant="accent" size="md" className="w-full">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
