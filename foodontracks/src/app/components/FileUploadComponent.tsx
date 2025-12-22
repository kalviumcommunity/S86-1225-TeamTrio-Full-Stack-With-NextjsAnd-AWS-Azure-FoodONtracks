"use client";

import { useState } from "react";
import { uploadFile, validateFileBeforeUpload } from "@/app/lib/uploadUtils";

/**
 * File Upload Component
 * Example component demonstrating file upload functionality
 */
export default function FileUploadComponent() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    fileUrl?: string;
    error?: string;
  } | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file before setting
      const validation = validateFileBeforeUpload(file, 5, [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
      ]);

      if (!validation.valid) {
        alert(validation.error);
        return;
      }

      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const result = await uploadFile(selectedFile, {
        entityType: "menu-item",
        entityId: 1, // Example entity ID
        uploaderId: 1, // Example uploader ID
      });

      setUploadResult(result);

      if (result.success) {
        console.log("File uploaded successfully:", result.fileUrl);
        // Reset file input
        setSelectedFile(null);
      } else {
        console.error("Upload failed:", result.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadResult({
        success: false,
        error: "An unexpected error occurred",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Upload Image</h2>

      <div className="mb-4">
        <label
          htmlFor="file-upload"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Select File
        </label>
        <input
          id="file-upload"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          disabled={uploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {selectedFile && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">
            <strong>Selected:</strong> {selectedFile.name}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Size:</strong> {(selectedFile.size / 1024).toFixed(2)} KB
          </p>
          <p className="text-sm text-gray-600">
            <strong>Type:</strong> {selectedFile.type}
          </p>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md
          hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
          transition-colors font-medium"
      >
        {uploading ? "Uploading..." : "Upload File"}
      </button>

      {uploadResult && (
        <div
          className={`mt-4 p-4 rounded-md ${
            uploadResult.success
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          {uploadResult.success ? (
            <div>
              <p className="text-green-800 font-medium mb-2">
                ✓ Upload Successful!
              </p>
              {uploadResult.fileUrl && (
                <div>
                  <p className="text-sm text-green-700 mb-2">
                    File URL: {uploadResult.fileUrl}
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uploadResult.fileUrl}
                    alt="Uploaded file"
                    className="max-w-full h-auto rounded border"
                  />
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-red-800 font-medium">✗ Upload Failed</p>
              <p className="text-sm text-red-700">{uploadResult.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
