import { CardGridSkeleton } from '@/components/ui/skeletons/PageSkeleton';

export default function StudentsLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-in">
        <div className="h-8 w-48 bg-muted rounded skeleton-shimmer mb-2" />
        <div className="h-4 w-64 bg-muted rounded skeleton-shimmer" />
      </div>
      <CardGridSkeleton count={6} columns={2} />
    </div>
  );
}
