import Skeleton from './Skeleton';

export default function ChartLoadingSkeleton() {
  return (
    <div className="space-y-3 py-6">
      <Skeleton className="h-6 w-1/3 rounded-lg" />
      <Skeleton className="h-44 w-full rounded-2xl" />
    </div>
  );
}
