'use client';

import { CldUploadWidget } from 'next-cloudinary';
import { useState } from 'react';

interface CloudinaryUploadWidgetProps {
  onUploadSuccess: (url: string, publicId: string) => void;
  folder?: string;
  buttonText?: string;
}

export default function CloudinaryUploadWidget({
  onUploadSuccess,
  folder = 'foodontracks',
  buttonText = 'Upload Image',
}: CloudinaryUploadWidgetProps) {
  const [isUploading, setIsUploading] = useState(false);

  return (
    <CldUploadWidget
      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
      options={{
        folder,
        maxFiles: 1,
        resourceType: 'image',
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        maxFileSize: 5000000, // 5MB
      }}
      onUpload={(result: any) => {
        if (result.event === 'success') {
          setIsUploading(false);
          onUploadSuccess(result.info.secure_url, result.info.public_id);
        }
      }}
      onOpen={() => setIsUploading(true)}
      onClose={() => setIsUploading(false)}
    >
      {({ open }) => (
        <button
          type="button"
          onClick={() => open()}
          disabled={isUploading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? 'Uploading...' : buttonText}
        </button>
      )}
    </CldUploadWidget>
  );
}
