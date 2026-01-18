"use client";

import React from 'react';

interface ResponsiveTableProps {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  headers,
  children,
  className = '',
}) => {
  return (
    <>
      {/* Desktop Table */}
      <div className={`hidden md:block overflow-x-auto ${className}`}>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {children}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return null;

          const cells = React.Children.toArray(child.props.children);
          
          return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3">
              {cells.map((cell: any, index: number) => (
                <div key={index} className="flex justify-between items-start">
                  <span className="font-medium text-gray-600 dark:text-gray-400 text-sm">
                    {headers[index]}:
                  </span>
                  <span className="text-gray-900 dark:text-white text-sm text-right ml-2">
                    {cell.props?.children}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
};

interface ResponsiveTableWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveTableWrapper: React.FC<ResponsiveTableWrapperProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          {children}
        </div>
      </div>
    </div>
  );
};
