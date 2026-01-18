import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div
      className={`animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
};

export const LoadingScreen: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Spinner size="xl" className="mx-auto mb-4" />
        <p className="text-gray-600 text-lg">{message}</p>
      </div>
    </div>
  );
};

export const LoadingOverlay: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        {message && <p className="text-gray-700">{message}</p>}
      </div>
    </div>
  );
};
