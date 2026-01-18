"use client";

import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetcher";
import { useState } from "react";
import { useUI } from "@/hooks/useUI";
import { logger } from "@/lib/logger";

interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  category?: string;
  available?: boolean;
}

export default function OptimisticUIDemo() {
  const { isDark } = useUI();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Fetch menu items
  const { data, error, isLoading } = useSWR<{ data: MenuItem[] }>(
    "/api/menu-items",
    fetcher,
    {
      revalidateOnFocus: true,
    }
  );

  const menuItems = data?.data || [];

  // Optimistic Add - UI updates immediately
  const handleOptimisticAdd = async () => {
    if (!name || !price) return;

    const newItem: MenuItem = {
      id: Date.now(), // Temporary ID
      name,
      price: parseFloat(price),
      description,
      category: "New",
      available: true,
    };

    logger.info("optimistic_add_start", { context: { item: newItem } });

    // Step 1: Update UI optimistically (no server call yet)
    mutate(
      "/api/menu-items",
      { data: [...menuItems, newItem] },
      false // Don't revalidate yet
    );

    setIsAdding(true);

    try {
      // Step 2: Make actual API call
      logger.info("optimistic_add_request", { context: { name, price: parseFloat(price) } });
      const response = await fetch("/api/menu-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          price: parseFloat(price),
          description,
          category: "New",
          restaurantId: 1, // Default restaurant
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add item");
      }

      const result = await response.json();
      logger.info("optimistic_add_confirmed", { context: { result } });

      // Step 3: Revalidate to get real data from server
      await mutate("/api/menu-items");
      logger.info("optimistic_revalidated", {});

      // Clear form
      setName("");
      setPrice("");
      setDescription("");
    } catch (error) {
      logger.error("optimistic_add_error", { error: String(error) });
      // Rollback on error
      mutate("/api/menu-items");
      alert("Failed to add item. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  // Optimistic Delete
  const handleOptimisticDelete = async (itemId: number) => {
    logger.info("optimistic_delete_start", { context: { itemId } });

    // Update UI immediately
    const updatedItems = menuItems.filter((item) => item.id !== itemId);
    mutate("/api/menu-items", { data: updatedItems }, false);

    try {
      // Make actual API call
      const response = await fetch(`/api/menu-items/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      logger.info("optimistic_delete_confirmed", { context: { itemId } });
      // Revalidate to sync
      await mutate("/api/menu-items");
    } catch (error) {
      logger.error("optimistic_delete_error", { error: String(error) });
      // Rollback on error
      mutate("/api/menu-items");
      alert("Failed to delete item. Please try again.");
    }
  };

  // Optimistic Toggle Availability
  const handleToggleAvailability = async (item: MenuItem) => {
    logger.info("optimistic_toggle_start", { context: { itemId: item.id } });

    // Update UI immediately
    const updatedItems = menuItems.map((i) =>
      i.id === item.id ? { ...i, available: !i.available } : i
    );
    mutate("/api/menu-items", { data: updatedItems }, false);

    try {
      // Make actual API call
      const response = await fetch(`/api/menu-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !item.available }),
      });

      if (!response.ok) {
        throw new Error("Failed to update availability");
      }

      logger.info("optimistic_toggle_confirmed", { context: { itemId: item.id } });
      await mutate("/api/menu-items");
    } catch (error) {
      logger.error("optimistic_toggle_error", { error: String(error) });
      // Rollback on error
      mutate("/api/menu-items");
      alert("Failed to update availability. Please try again.");
    }
  };

  if (error) {
    return (
      <div
        className={`min-h-screen p-8 ${isDark ? "bg-gray-900 text-white" : "bg-gray-50"}`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Error Loading Menu Items</p>
            <p>{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-8 ${isDark ? "bg-gray-900 text-white" : "bg-gray-50"}`}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">⚡ Optimistic UI Demo</h1>
          <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Watch UI update instantly before server confirmation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add Item Form */}
          <section
            className={`p-6 rounded-lg ${isDark ? "bg-gray-800" : "bg-white"} shadow`}
          >
            <h2 className="text-xl font-semibold mb-4">➕ Add Menu Item</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Margherita Pizza"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-gray-50 border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="12.99"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-gray-50 border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Delicious description..."
                  rows={3}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-gray-50 border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <button
                onClick={handleOptimisticAdd}
                disabled={!name || !price || isAdding}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAdding ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Adding...
                  </>
                ) : (
                  <>⚡ Add Item (Optimistic)</>
                )}
              </button>
            </div>

            {/* Instructions */}
            <div
              className={`mt-4 p-3 rounded-lg ${isDark ? "bg-blue-900/20" : "bg-blue-50"} border ${isDark ? "border-blue-800" : "border-blue-200"}`}
            >
              <p className="text-sm font-semibold mb-1">💡 How it works:</p>
              <ol className="text-xs space-y-1">
                <li>1. UI updates immediately (no waiting)</li>
                <li>2. Request sent to server in background</li>
                <li>3. Data revalidates when server responds</li>
                <li>4. If error occurs, changes roll back</li>
              </ol>
            </div>
          </section>

          {/* Menu Items List */}
          <section
            className={`p-6 rounded-lg ${isDark ? "bg-gray-800" : "bg-white"} shadow`}
          >
            <h2 className="text-xl font-semibold mb-4">🍽️ Menu Items</h2>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="ml-3">Loading...</p>
              </div>
            ) : menuItems.length === 0 ? (
              <p
                className={`text-center py-8 ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                No items yet. Add your first menu item!
              </p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border ${
                      isDark
                        ? "bg-gray-700 border-gray-600"
                        : "bg-gray-50 border-gray-200"
                    } ${!item.available ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        {item.description && (
                          <p
                            className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                          >
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-green-600 font-bold">
                            ${item.price.toFixed(2)}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              item.available
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.available ? "Available" : "Unavailable"}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleAvailability(item)}
                          className="p-2 rounded hover:bg-gray-600 transition-colors"
                          title="Toggle Availability"
                        >
                          {item.available ? "🔄" : "✅"}
                        </button>
                        <button
                          onClick={() => handleOptimisticDelete(item.id)}
                          className="p-2 rounded hover:bg-red-600 transition-colors"
                          title="Delete Item"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Console Log Section */}
        <section
          className={`mt-6 p-6 rounded-lg ${isDark ? "bg-gray-800" : "bg-white"} shadow`}
        >
          <h2 className="text-xl font-semibold mb-3">
            📊 Open Browser Console
          </h2>
          <p className={isDark ? "text-gray-400" : "text-gray-600"}>
            Check the browser console (F12) to see detailed logs of:
          </p>
          <ul
            className={`mt-2 space-y-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}
          >
            <li>🚀 Optimistic updates happening instantly</li>
            <li>📡 Server requests being sent in the background</li>
            <li>✅ Server confirmations and data sync</li>
            <li>🔄 Cache revalidation process</li>
            <li>❌ Error handling and rollbacks (if any)</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
