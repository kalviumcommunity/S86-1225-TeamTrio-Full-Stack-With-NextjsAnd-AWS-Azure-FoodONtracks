interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'bordered' | 'elevated' | 'accent';
}

export default function Card({ title, children, className = '', variant = 'default' }: CardProps) {
  const variantStyles = {
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm transition-shadow hover:shadow-md',
    bordered: 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl p-6 transition-all hover:border-[#FFEB3B]',
    elevated: 'bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow',
    accent: 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 border border-yellow-200 dark:border-gray-600 rounded-xl p-6 shadow-sm',
  };

  return (
    <div className={`${variantStyles[variant]} ${className}`}>
      {title && <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>}
      {children}
    </div>
  );
}
