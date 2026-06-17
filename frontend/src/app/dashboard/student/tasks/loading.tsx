import { CardGridSkeleton } from '@/components/ui/skeletons/PageSkeleton';

export default function TasksLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-in">
        <div className="h-8 w-40 bg-muted rounded skeleton-shimmer mb-2" />
        <div className="h-4 w-56 bg-muted rounded skeleton-shimmer" />
      </div>
      <CardGridSkeleton count={4} columns={1} />
    </div>
  );
}
