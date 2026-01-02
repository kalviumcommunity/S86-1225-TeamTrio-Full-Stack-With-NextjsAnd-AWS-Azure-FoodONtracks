"use client";

import { useUI } from "@/hooks/useUI";
import { useSWRConfig } from "swr";
import { useEffect, useState } from "react";
import Link from "next/link";
import { logger } from "@/lib/logger";

export default function SWRDemoPage() {
  const { isDark } = useUI();
  const { cache } = useSWRConfig();

  // Use lazy initialization to get cache keys
  const getCacheData = () => {
    const keys: string[] = [];
    if (cache instanceof Map) {
      cache.forEach((_, key) => {
        keys.push(String(key));
      });
    }
    return {
      keys,
      stats: {
        totalKeys: keys.length,
        activeKeys: keys.filter((k) => k.startsWith("/api")).length,
      },
    };
  };

  const [cacheData, setCacheData] = useState(getCacheData);
  const { keys: cacheKeys, stats: cacheStats } = cacheData;

  useEffect(() => {
    // Update cache data when cache changes
    const newData = getCacheData();
    setCacheData(newData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cache]);

  const clearCache = () => {
    logger.info("swr_clear_cache", {});
    if (cache instanceof Map) {
      cache.clear();
    }
    setCacheData({ keys: [], stats: { totalKeys: 0, activeKeys: 0 } });
  };

  return (
    <div
      className={`min-h-screen p-8 ${isDark ? "bg-gray-900 text-white" : "bg-gray-50"}`}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🚀 SWR Data Fetching Demo
          </h1>
          <p
            className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Explore Stale-While-Revalidate pattern with real-time caching
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Users Demo */}
          <Link href="/swr-demo/users">
            <div
              className={`p-6 rounded-xl shadow-lg cursor-pointer transition-transform hover:scale-105 ${
                isDark
                  ? "bg-gray-800 hover:bg-gray-750"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">👥</span>
                <h2 className="text-2xl font-semibold">Users List</h2>
              </div>
              <p
                className={`mb-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                Basic SWR data fetching with automatic caching and revalidation
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Automatic caching
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Revalidate on focus
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Auto-refresh every 30s
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Search & filter
                </li>
              </ul>
              <div className="mt-4">
                <span className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-medium">
                  View Demo →
                </span>
              </div>
            </div>
          </Link>

          {/* Optimistic UI Demo */}
          <Link href="/swr-demo/optimistic">
            <div
              className={`p-6 rounded-xl shadow-lg cursor-pointer transition-transform hover:scale-105 ${
                isDark
                  ? "bg-gray-800 hover:bg-gray-750"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">⚡</span>
                <h2 className="text-2xl font-semibold">Optimistic Updates</h2>
              </div>
              <p
                className={`mb-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                Instant UI updates with background synchronization
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Instant UI feedback
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Background sync
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Automatic rollback on error
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Add, update, delete
                </li>
              </ul>
              <div className="mt-4">
                <span className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg font-medium">
                  View Demo →
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Cache Visualization */}
        <section
          className={`p-6 rounded-xl shadow-lg mb-8 ${
            isDark ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">📊 Cache Visualization</h2>
            <button
              onClick={clearCache}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              🗑️ Clear Cache
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div
              className={`p-4 rounded-lg ${isDark ? "bg-gray-700" : "bg-blue-50"}`}
            >
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Cache Keys
              </p>
              <p className="text-3xl font-bold text-blue-600">
                {cacheStats.totalKeys}
              </p>
            </div>
            <div
              className={`p-4 rounded-lg ${isDark ? "bg-gray-700" : "bg-green-50"}`}
            >
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Active API Keys
              </p>
              <p className="text-3xl font-bold text-green-600">
                {cacheStats.activeKeys}
              </p>
            </div>
          </div>

          <div
            className={`p-4 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-50"}`}
          >
            <h3 className="font-semibold mb-2">Cached Keys:</h3>
            {cacheKeys.length === 0 ? (
              <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                No cached data yet. Visit a demo page to see caching in action.
              </p>
            ) : (
              <ul className="space-y-1 text-sm font-mono">
                {cacheKeys.map((key, index) => (
                  <li
                    key={index}
                    className={`p-2 rounded ${isDark ? "bg-gray-800" : "bg-white"}`}
                  >
                    {key}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Comparison Table */}
        <section
          className={`p-6 rounded-xl shadow-lg mb-8 ${
            isDark ? "bg-gray-800" : "bg-white"
          }`}
        >
          <h2 className="text-2xl font-semibold mb-4">⚖️ SWR vs Fetch API</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className={`border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}
                >
                  <th className="text-left py-3 px-4">Feature</th>
                  <th className="text-center py-3 px-4">SWR</th>
                  <th className="text-center py-3 px-4">Fetch API</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  className={`border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}
                >
                  <td className="py-3 px-4">Built-in cache</td>
                  <td className="text-center py-3 px-4 text-green-500">✅</td>
                  <td className="text-center py-3 px-4 text-red-500">❌</td>
                </tr>
                <tr
                  className={`border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}
                >
                  <td className="py-3 px-4">Auto revalidation</td>
                  <td className="text-center py-3 px-4 text-green-500">✅</td>
                  <td className="text-center py-3 px-4 text-red-500">❌</td>
                </tr>
                <tr
                  className={`border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}
                >
                  <td className="py-3 px-4">Optimistic UI</td>
                  <td className="text-center py-3 px-4 text-green-500">✅</td>
                  <td className="text-center py-3 px-4 text-yellow-500">⚠️</td>
                </tr>
                <tr
                  className={`border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}
                >
                  <td className="py-3 px-4">Loading states</td>
                  <td className="text-center py-3 px-4 text-green-500">✅</td>
                  <td className="text-center py-3 px-4 text-yellow-500">⚠️</td>
                </tr>
                <tr
                  className={`border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}
                >
                  <td className="py-3 px-4">Error handling</td>
                  <td className="text-center py-3 px-4 text-green-500">✅</td>
                  <td className="text-center py-3 px-4 text-yellow-500">⚠️</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Dynamic updates</td>
                  <td className="text-center py-3 px-4 text-green-500">
                    ✅ Simple
                  </td>
                  <td className="text-center py-3 px-4 text-yellow-500">
                    ⚠️ Manual
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Key Concepts */}
        <section
          className={`p-6 rounded-xl shadow-lg ${
            isDark ? "bg-gray-800" : "bg-white"
          }`}
        >
          <h2 className="text-2xl font-semibold mb-4">🎯 Key Concepts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-2 text-blue-600">
                Stale-While-Revalidate
              </h3>
              <p
                className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                Returns cached (stale) data immediately for instant UI, then
                fetches fresh data in the background and updates when ready.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2 text-purple-600">
                Automatic Caching
              </h3>
              <p
                className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                SWR caches responses using the request key. Multiple components
                using the same key share the same data without extra requests.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2 text-green-600">
                Revalidation
              </h3>
              <p
                className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                Automatically refetches data on focus, reconnect, or at
                specified intervals to keep your UI in sync with the server.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2 text-orange-600">
                Optimistic Updates
              </h3>
              <p
                className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                Update the UI immediately before server confirmation for a
                snappy user experience. Rollback automatically on errors.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
