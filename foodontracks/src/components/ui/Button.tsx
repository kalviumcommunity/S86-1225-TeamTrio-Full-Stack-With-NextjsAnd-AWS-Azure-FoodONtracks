interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'danger' | 'outline' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

function Button({
  label,
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shadow-sm hover:shadow-md';

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3.5 text-lg',
  };

  const variantStyles = {
    default: 'bg-[#FF5722] text-white hover:bg-[#E64A19] active:scale-95',
    primary: 'bg-[#FFEB3B] text-gray-900 hover:bg-[#FBC02D] active:scale-95 border border-yellow-400',
    accent: 'bg-[#FF5722] text-white hover:bg-[#E64A19] active:scale-95',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95 border border-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:scale-95',
    outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:scale-95',
  };

  const styles = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`;

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={styles} {...props}>
      {children || label}
    </button>
  );
}

// Support both named and default exports for backward compatibility
export { Button };
export default Button;
