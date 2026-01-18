"use client";

import React, { useState, useRef } from 'react';
import Image from 'next/image';

interface ImageUploadPreviewProps {
  onImageSelect: (file: File) => void;
  label?: string;
  maxSize?: number; // in MB
  acceptedFormats?: string[];
}

export const ImageUploadPreview: React.FC<ImageUploadPreviewProps> = ({
  onImageSelect,
  label = 'Upload Image',
  maxSize = 5,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset error
    setError(null);

    // Validate file type
    if (!acceptedFormats.includes(file.type)) {
      setError(`Invalid file type. Accepted formats: ${acceptedFormats.join(', ')}`);
      return;
    }

    // Validate file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxSize) {
      setError(`File size exceeds ${maxSize}MB limit`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Pass file to parent component
    onImageSelect(file);
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>

      {!preview ? (
        <div
          onClick={handleClick}
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-orange-500 transition-colors"
        >
          <div className="text-6xl mb-4">📷</div>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Click to upload or drag and drop
          </p>
          <p className="text-sm text-gray-500">
            {acceptedFormats.join(', ')} (Max {maxSize}MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="relative">
          <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600">
            <Image
              src={preview}
              alt="Upload preview"
              fill
              className="object-cover"
            />
          </div>
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
            aria-label="Remove image"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};
