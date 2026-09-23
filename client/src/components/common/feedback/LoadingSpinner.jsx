import { Loader2 } from 'lucide-react';

/**
 * LoadingSpinner - Reusable feedback state saat fetch data
 */
export default function LoadingSpinner({
  message = "Memuat data...",
  size = 24,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-gray-500 gap-2.5 ${className}`}>
      <Loader2 size={size} className="animate-spin text-digital-blue-600" />
      {message && <p className="text-xs font-medium text-gray-400">{message}</p>}
    </div>
  );
}
