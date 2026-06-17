import { CardGridSkeleton, StatCardSkeleton } from '@/components/ui/skeletons/PageSkeleton';

export default function DailyReportsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-in">
        <div>
          <div className="h-8 w-48 bg-muted rounded skeleton-shimmer mb-2" />
          <div className="h-4 w-64 bg-muted rounded skeleton-shimmer" />
        </div>
        <div className="h-10 w-32 bg-muted rounded skeleton-shimmer" />
      </div>
      <StatCardSkeleton count={3} />
      <CardGridSkeleton count={4} columns={1} />
    </div>
  );
}
