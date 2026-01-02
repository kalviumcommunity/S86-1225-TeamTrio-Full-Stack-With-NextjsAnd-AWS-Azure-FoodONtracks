"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useState } from "react";
import { useUI } from "@/hooks/useUI";
import { logger } from "@/lib/logger";

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
}

export default function UsersListPage() {
  const { isDark } = useUI();
  const [searchTerm, setSearchTerm] = useState("");

  // Basic SWR usage
  const { data, error, isLoading, mutate } = useSWR<{ data: User[] }>(
    "/api/users",
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );

  const handleRefresh = () => {
    logger.info("swr_manual_refresh", {});
    mutate();
  };

  if (error) {
    return (
      <div
        className={`min-h-screen p-8 ${isDark ? "bg-gray-900 text-white" : "bg-gray-50"}`}
      >
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Error Loading Users</p>
            <p>{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className={`min-h-screen p-8 ${isDark ? "bg-gray-900 text-white" : "bg-gray-50"}`}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="ml-4 text-lg">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  const users = data?.data || [];
  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className={`min-h-screen p-8 ${isDark ? "bg-gray-900 text-white" : "bg-gray-50"}`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">👥 Users List (SWR Demo)</h1>
          <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Real-time data fetching with automatic caching and revalidation
          </p>
        </div>

        {/* Controls */}
        <div
          className={`mb-6 p-4 rounded-lg ${isDark ? "bg-gray-800" : "bg-white"} shadow`}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`flex-1 px-4 py-2 rounded-lg border ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-gray-50 border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <button
              onClick={handleRefresh}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div
            className={`p-4 rounded-lg ${isDark ? "bg-gray-800" : "bg-white"} shadow`}
          >
            <p
              className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              Total Users
            </p>
            <p className="text-2xl font-bold text-blue-600">{users.length}</p>
          </div>
          <div
            className={`p-4 rounded-lg ${isDark ? "bg-gray-800" : "bg-white"} shadow`}
          >
            <p
              className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              Filtered
            </p>
            <p className="text-2xl font-bold text-green-600">
              {filteredUsers.length}
            </p>
          </div>
          <div
            className={`p-4 rounded-lg ${isDark ? "bg-gray-800" : "bg-white"} shadow`}
          >
            <p
              className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              Cache Status
            </p>
            <p className="text-2xl font-bold text-purple-600">
              {isLoading ? "⏳" : "✅"}
            </p>
          </div>
        </div>

        {/* Users List */}
        <div
          className={`rounded-lg ${isDark ? "bg-gray-800" : "bg-white"} shadow`}
        >
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold">User Directory</h2>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                {searchTerm
                  ? "No users found matching your search"
                  : "No users available"}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-700">
              {filteredUsers.map((user) => (
                <li
                  key={user.id}
                  className={`p-4 hover:${
                    isDark ? "bg-gray-700" : "bg-gray-50"
                  } transition-colors`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{user.name}</h3>
                      <p
                        className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                      >
                        {user.email}
                      </p>
                      {user.role && (
                        <span className="inline-block mt-1 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {user.role}
                        </span>
                      )}
                    </div>
                    <div className="text-gray-400">ID: {user.id}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Info Box */}
        <div
          className={`mt-6 p-4 rounded-lg ${isDark ? "bg-blue-900/20" : "bg-blue-50"} border ${isDark ? "border-blue-800" : "border-blue-200"}`}
        >
          <h3 className="font-semibold mb-2">🎯 SWR Features Demonstrated:</h3>
          <ul
            className={`space-y-1 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}
          >
            <li>✅ Automatic caching - Data is cached after first fetch</li>
            <li>
              ✅ Revalidation on focus - Switch tabs and come back to see
              refresh
            </li>
            <li>✅ Auto-refresh every 30 seconds</li>
            <li>✅ Manual refresh with mutate()</li>
            <li>✅ Loading and error states</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
