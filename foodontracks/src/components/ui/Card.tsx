interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'bordered' | 'elevated';
}

export default function Card({ title, children, className = '', variant = 'default' }: CardProps) {
  const variantStyles = {
    default: 'bg-white border border-gray-200 rounded-lg p-6',
    bordered: 'bg-white border-2 border-gray-300 rounded-lg p-6',
    elevated: 'bg-white rounded-lg p-6 shadow-lg',
  };

  return (
    <div className={`${variantStyles[variant]} ${className}`}>
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      {children}
    </div>
  );
}
