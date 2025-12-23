'use client';

import Link from 'next/link';

export default function Sidebar() {
  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/users', label: 'Users', icon: '👥' },
    { href: '/login', label: 'Login', icon: '🔐' },
  ];

  return (
    <aside className="w-64 bg-gray-100 border-r border-gray-300 p-6 min-h-screen" aria-label="sidebar">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Navigation</h2>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition"
            >
              <span className="text-lg">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Sidebar Footer */}
      <div className="mt-auto pt-6 border-t border-gray-300">
        <p className="text-sm text-gray-600">FoodONtracks v1.0</p>
      </div>
    </aside>
  );
}
