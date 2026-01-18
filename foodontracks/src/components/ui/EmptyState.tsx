import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      {icon && <div className="text-6xl mb-4">{icon}</div>}
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      {description && <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An error occurred while loading the data. Please try again.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 shadow-sm">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-medium shadow-md hover:shadow-lg hover:from-yellow-500 hover:to-orange-600 transition-all"
        >
          Try Again
        </button>
      )}
    </div>
  );
};
