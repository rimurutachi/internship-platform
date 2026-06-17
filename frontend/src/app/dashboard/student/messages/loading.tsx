import { CardGridSkeleton } from '@/components/ui/skeletons/PageSkeleton';

export default function MessagesLoading() {
  return <CardGridSkeleton count={4} columns={1} />;
}
