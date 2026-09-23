/**
 * Skeleton - Reusable Skeleton Loader component
 */
export default function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-gray-200/80 rounded-lg ${className}`} />
  );
}
