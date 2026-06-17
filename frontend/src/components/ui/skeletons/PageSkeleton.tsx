'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/* ============================================
   Reusable Skeleton Compositions
   ============================================ */

/**
 * Skeleton for stat/metric cards (commonly used in dashboard overviews)
 */
export function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={cn(
      'grid gap-4',
      count <= 3 ? 'grid-cols-1 md:grid-cols-3' :
      count === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
      'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-in" style={{ animationDelay: `${i * 50}ms` }}>
          <CardContent className="pt-6">
            <Skeleton className="h-8 w-20 mb-2 skeleton-shimmer" />
            <Skeleton className="h-4 w-24 skeleton-shimmer" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Skeleton for filter/search bars
 */
export function FilterBarSkeleton() {
  return (
    <Card className="animate-in stagger-2">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-3">
          <Skeleton className="h-10 flex-1 skeleton-shimmer" />
          <Skeleton className="h-10 w-full md:w-44 skeleton-shimmer" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for data tables
 */
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <Card className="animate-in stagger-3">
      <CardHeader>
        <Skeleton className="h-6 w-40 skeleton-shimmer" />
        <Skeleton className="h-4 w-56 mt-1 skeleton-shimmer" />
      </CardHeader>
      <CardContent>
        {/* Table header */}
        <div className="flex gap-4 pb-3 border-b border-border mb-3">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1 skeleton-shimmer" />
          ))}
        </div>
        {/* Table rows */}
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex gap-4 py-2" style={{ animationDelay: `${(i + 3) * 50}ms` }}>
              {Array.from({ length: columns }).map((_, j) => (
                <Skeleton key={j} className={cn(
                  'h-4 flex-1 skeleton-shimmer',
                  j === 0 && 'w-8 flex-none',
                )} />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for card grids (e.g., students list, intern cards)
 */
export function CardGridSkeleton({ count = 6, columns = 2 }: { count?: number; columns?: number }) {
  return (
    <div className={cn(
      'grid gap-4',
      columns === 1 ? 'grid-cols-1' :
      columns === 2 ? 'grid-cols-1 md:grid-cols-2' :
      'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-in" style={{ animationDelay: `${i * 60}ms` }}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-10 w-10 rounded-full skeleton-shimmer" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2 skeleton-shimmer" />
                <Skeleton className="h-3 w-24 skeleton-shimmer" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-full skeleton-shimmer" />
              <Skeleton className="h-3 w-3/4 skeleton-shimmer" />
            </div>
            <div className="flex gap-2 mt-4">
              <Skeleton className="h-8 flex-1 skeleton-shimmer" />
              <Skeleton className="h-8 w-20 skeleton-shimmer" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Skeleton for form/settings pages
 */
export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <Card className="animate-in">
      <CardHeader>
        <Skeleton className="h-6 w-48 skeleton-shimmer" />
        <Skeleton className="h-4 w-72 mt-1 skeleton-shimmer" />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Array.from({ length: fields }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24 skeleton-shimmer" />
              <Skeleton className="h-10 w-full skeleton-shimmer" />
            </div>
          ))}
          <Skeleton className="h-10 w-32 mt-4 skeleton-shimmer" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for detail/view pages
 */
export function DetailPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-in">
        <Skeleton className="h-8 w-64 mb-2 skeleton-shimmer" />
        <Skeleton className="h-4 w-96 skeleton-shimmer" />
      </div>

      {/* Stats row */}
      <StatCardSkeleton count={3} />

      {/* Detail card */}
      <Card className="animate-in stagger-4">
        <CardHeader>
          <Skeleton className="h-6 w-40 skeleton-shimmer" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                <Skeleton className="h-4 w-28 skeleton-shimmer" />
                <Skeleton className="h-4 w-40 skeleton-shimmer" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================
   Pre-composed Page Skeletons
   ============================================ */

/**
 * Full dashboard page skeleton (stats + chart area + list)
 */
export function DashboardPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="animate-in">
        <Skeleton className="h-8 w-72 mb-2 skeleton-shimmer" />
        <Skeleton className="h-4 w-48 skeleton-shimmer" />
      </div>

      {/* Stat cards */}
      <StatCardSkeleton count={4} />

      {/* Chart area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="animate-in stagger-6">
          <CardHeader>
            <Skeleton className="h-5 w-36 skeleton-shimmer" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full skeleton-shimmer rounded-lg" />
          </CardContent>
        </Card>
        <Card className="animate-in stagger-7">
          <CardHeader>
            <Skeleton className="h-5 w-36 skeleton-shimmer" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full skeleton-shimmer rounded-lg" />
          </CardContent>
        </Card>
      </div>

      {/* Recent items list */}
      <Card className="animate-in stagger-8">
        <CardHeader>
          <Skeleton className="h-5 w-40 skeleton-shimmer" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <Skeleton className="h-8 w-8 rounded-full skeleton-shimmer" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-40 mb-1 skeleton-shimmer" />
                  <Skeleton className="h-3 w-28 skeleton-shimmer" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full skeleton-shimmer" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Full table management page skeleton (header + stats + filters + table)
 */
export function TablePageSkeleton({ statCount = 5 }: { statCount?: number }) {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between animate-in">
        <div>
          <Skeleton className="h-8 w-56 mb-2 skeleton-shimmer" />
          <Skeleton className="h-4 w-72 skeleton-shimmer" />
        </div>
        <Skeleton className="h-10 w-32 skeleton-shimmer" />
      </div>

      {/* Stats */}
      <StatCardSkeleton count={statCount} />

      {/* Filters */}
      <FilterBarSkeleton />

      {/* Table */}
      <TableSkeleton rows={6} columns={5} />
    </div>
  );
}
