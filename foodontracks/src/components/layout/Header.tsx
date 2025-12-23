'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="w-full bg-gray-900 text-white px-6 py-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold hover:text-gray-300 transition">
          🍔 FoodONtracks
        </Link>
        <nav className="flex gap-6" aria-label="main navigation">
          <Link href="/" className="hover:text-gray-300 transition">
            Home
          </Link>
          <Link href="/login" className="hover:text-gray-300 transition">
            Login
          </Link>
          <Link href="/dashboard" className="hover:text-gray-300 transition">
            Dashboard
          </Link>
          <Link href="/users" className="hover:text-gray-300 transition">
            Users
          </Link>
        </nav>
      </div>
    </header>
  );
}
