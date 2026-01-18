'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types/user';
import { ArrowLeft, Search, UserCircle2 } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  pages: number;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  useEffect(() => {
    const verifyAndFetchUsers = async () => {
      try {
        setLoading(true);
        const verifyRes = await fetch('/api/auth/verify');
        if (!verifyRes.ok) {
          router.push('/login');
          return;
        }

        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '20',
        });

        if (roleFilter) {
          params.append('role', roleFilter);
        }

        const usersRes = await fetch(`/api/users?${params}`);
        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(data.users);
          setFilteredUsers(data.users);
          setPagination(data.pagination);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    verifyAndFetchUsers();
  }, [router, roleFilter, currentPage]);

  // Client-side search filtering
  useEffect(() => {
    if (!searchQuery) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const handleRoleFilterChange = (role: string) => {
    setRoleFilter(role);
    setCurrentPage(1);
  };

  const getRoleBadgeColor = (role: UserRole) => {
    const colors = {
      [UserRole.ADMIN]: 'bg-red-100 text-red-800',
      [UserRole.RESTAURANT_OWNER]: 'bg-orange-100 text-orange-800',
      [UserRole.DELIVERY_GUY]: 'bg-blue-100 text-blue-800',
      [UserRole.CUSTOMER]: 'bg-green-100 text-green-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-orange-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
      <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-yellow-200 dark:border-yellow-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center gap-4">
            <div>
              <button
                onClick={() => router.push('/dashboard/admin')}
                className="inline-flex items-center text-sm text-orange-600 hover:text-orange-700 dark:text-orange-300 dark:hover:text-orange-200 mb-2 gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>
              <div className="flex items-center gap-3">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-100 text-orange-600 dark:bg-yellow-900/40 dark:text-orange-300">
                  <UserCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">View and manage all users across the platform.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-900 border border-yellow-100 dark:border-yellow-900/40 rounded-xl shadow-sm p-6 mb-6">
          <div className="mb-4">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Users
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                id="search"
                type="text"
                placeholder="Search by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Filter by Role</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleRoleFilterChange('')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                roleFilter === ''
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              All Users
            </button>
            <button
              onClick={() => handleRoleFilterChange(UserRole.ADMIN)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                roleFilter === UserRole.ADMIN
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50'
              }`}
            >
              Admins
            </button>
            <button
              onClick={() => handleRoleFilterChange(UserRole.RESTAURANT_OWNER)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                roleFilter === UserRole.RESTAURANT_OWNER
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-900/50'
              }`}
            >
              Restaurant Owners
            </button>
            <button
              onClick={() => handleRoleFilterChange(UserRole.DELIVERY_GUY)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                roleFilter === UserRole.DELIVERY_GUY
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50'
              }`}
            >
              Delivery Agents
            </button>
            <button
              onClick={() => handleRoleFilterChange(UserRole.CUSTOMER)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                roleFilter === UserRole.CUSTOMER
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50'
              }`}
            >
              Customers
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden border border-yellow-100 dark:border-yellow-900/40">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {roleFilter ? `${roleFilter.replace('_', ' ')}s` : 'All Users'}
              {pagination && (
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({filteredUsers.length} {searchQuery ? 'filtered' : 'total'})
                </span>
              )}
            </h2>
            {pagination && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Page {pagination.page} of {pagination.pages}
              </p>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800/80">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      {searchQuery ? 'No users found matching your search' : 'No users found'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-yellow-50/60 dark:hover:bg-gray-800/70 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-300">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-900/80">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Page {pagination.page} of {pagination.pages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(pagination.pages, prev + 1))
                  }
                  disabled={currentPage === pagination.pages}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
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
