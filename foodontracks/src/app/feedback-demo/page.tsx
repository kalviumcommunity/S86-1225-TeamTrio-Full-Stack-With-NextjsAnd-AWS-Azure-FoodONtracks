"use client";
import { useState } from "react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import Loader from "@/components/ui/Loader";

export default function FeedbackDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fullScreenLoading, setFullScreenLoading] = useState(false);

  // Toast Examples
  const showSuccessToast = () => {
    toast.success("Item added to cart successfully!");
  };

  const showErrorToast = () => {
    toast.error("Failed to delete item. Please try again.");
  };

  const showLoadingToast = async () => {
    const promise = new Promise((resolve) => setTimeout(resolve, 3000));

    toast.promise(promise, {
      loading: "Saving changes...",
      success: "Changes saved successfully!",
      error: "Failed to save changes.",
    });
  };

  const showInfoToast = () => {
    toast.info("New update available. Refresh to see changes.");
  };

  const showWarningToast = () => {
    toast.warning("Your session will expire in 5 minutes.");
  };

  // Simulated API Call with Loader
  const handleSaveData = async () => {
    setIsLoading(true);
    toast.loading("Saving data...", { id: "save-data" });

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Data saved successfully!", { id: "save-data" });
    } catch (error) {
      toast.error("Failed to save data!", { id: "save-data" });
    } finally {
      setIsLoading(false);
    }
  };

  // Full Screen Loader Demo
  const handleUpload = async () => {
    setFullScreenLoading(true);

    try {
      // Simulate file upload
      await new Promise((resolve) => setTimeout(resolve, 3000));
      toast.success("File uploaded successfully!");
    } catch (error) {
      toast.error("Upload failed!");
    } finally {
      setFullScreenLoading(false);
    }
  };

  // Delete Confirmation Flow
  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    toast.loading("Deleting item...", { id: "delete-item" });

    try {
      // Simulate delete operation
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Item deleted successfully!", { id: "delete-item" });
    } catch (error) {
      toast.error("Failed to delete item!", { id: "delete-item" });
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            User Feedback Demo
          </h1>
          <p className="text-gray-600">
            Explore Toast Notifications, Modals, and Loaders
          </p>
        </div>

        {/* Full Screen Loader */}
        {fullScreenLoading && <Loader fullScreen text="Uploading file..." />}

        {/* Toast Notifications Section */}
        <section className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            🔔 Toast Notifications (Instant Feedback)
          </h2>
          <p className="text-gray-600 mb-4">
            Non-intrusive messages for quick updates and confirmations.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button
              onClick={showSuccessToast}
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              ✓ Success Toast
            </button>
            <button
              onClick={showErrorToast}
              className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
            >
              ✗ Error Toast
            </button>
            <button
              onClick={showInfoToast}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              ℹ Info Toast
            </button>
            <button
              onClick={showWarningToast}
              className="px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium"
            >
              ⚠ Warning Toast
            </button>
            <button
              onClick={showLoadingToast}
              className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
            >
              ⏳ Promise Toast
            </button>
          </div>
        </section>

        {/* Modal Section */}
        <section className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            📦 Modals (Blocking Feedback)
          </h2>
          <p className="text-gray-600 mb-4">
            Require user decision before proceeding with important actions.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Open Info Modal
            </button>
            <button
              onClick={handleDelete}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
            >
              Delete Item (with confirmation)
            </button>
          </div>
        </section>

        {/* Loader Section */}
        <section className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            ⏳ Loaders (Process Feedback)
          </h2>
          <p className="text-gray-600 mb-4">
            Visual indicators for ongoing operations and async processes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Inline Loaders */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-gray-700">
                Inline Loaders
              </h3>
              <div className="flex flex-col gap-4 items-center">
                <Loader size="sm" />
                <Loader size="md" text="Loading data..." />
                <Loader size="lg" />
              </div>
            </div>

            {/* Action with Loader */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-gray-700">
                Actions with Loading State
              </h3>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSaveData}
                  disabled={isLoading}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
                >
                  {isLoading ? "Saving..." : "Save Data"}
                </button>
                <button
                  onClick={handleUpload}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                >
                  Upload File (Full Screen Loader)
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Combined Flow Example */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <h2 className="text-2xl font-semibold mb-2">🚀 Complete User Flow</h2>
          <p className="mb-4 text-blue-100">
            Demonstrates: Toast → Modal → Loader → Toast (Success/Failure)
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm mb-4">
            <li>Click &quot;Delete Item&quot; button above</li>
            <li>Modal appears asking for confirmation</li>
            <li>Click Confirm to see loading toast</li>
            <li>Success toast appears after operation</li>
          </ol>
        </section>

        {/* Modals */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Welcome to FoodONtracks!"
          variant="info"
        >
          <p>
            This is an informational modal. It provides context or important
            information without requiring a destructive action.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Press <kbd className="px-2 py-1 bg-gray-200 rounded">Esc</kbd> or
            click Cancel to close.
          </p>
        </Modal>

        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Item?"
          variant="danger"
          onConfirm={confirmDelete}
          confirmText="Delete"
          cancelText="Cancel"
        >
          <p>
            This action cannot be undone. Are you sure you want to delete this
            item?
          </p>
          <p className="mt-2 text-sm font-semibold text-red-600">
            Warning: This is a destructive action!
          </p>
        </Modal>
      </div>
    </main>
  );
}
