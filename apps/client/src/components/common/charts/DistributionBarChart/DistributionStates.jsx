import EmptyState from '../../feedback/EmptyState';
import Skeleton from '../../feedback/Skeleton';

/** Loading / error / empty untuk chart distribusi. Null = data siap digambar. */
export function DistributionStates({
  isLoading,
  error,
  isEmpty,
  emptyTitle,
  emptyDescription,
  emptyIcon,
}) {
  if (isLoading) {
    return (
      <div className="space-y-3 py-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="h-5 w-36 sm:w-44 shrink-0 rounded" />
            <Skeleton className="h-6 flex-1 rounded-lg" />
            <Skeleton className="h-5 w-12 shrink-0 rounded" />
          </div>
        ))}
      </div>
    );
  }
  if (error) return <EmptyState title="Gagal Memuat Data" description={error} icon={emptyIcon} />;
  if (isEmpty)
    return <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} />;
  return null;
}
