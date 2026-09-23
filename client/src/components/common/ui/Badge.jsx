/**
 * Badge - Reusable Status / Label Badge
 */
export default function Badge({
  children,
  variant = 'default', // default | primary | success | warning | danger | info
  size = 'md', // sm | md
  className = '',
}) {
  const variantStyles = {
    default: 'bg-gray-100 text-gray-700 border-gray-200/60',
    primary: 'bg-digital-blue-50 text-digital-blue-700 border-digital-blue-200/60',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/60',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/60',
    info: 'bg-digital-blue-50 text-digital-blue-700 border-digital-blue-200/60',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${variantStyles[variant] || variantStyles.default} ${sizeStyles[size] || sizeStyles.md} ${className}`}>
      {children}
    </span>
  );
}
