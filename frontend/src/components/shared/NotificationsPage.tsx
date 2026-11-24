'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  MessageSquare,
  FileText,
  ExternalLink,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import {
  notificationsAPI,
  type Notification,
  type NotificationCategory,
} from '@/lib/api/notifications';
import { useNotifications } from '@/components/providers/NotificationsProvider';
import { useToast } from '@/hooks/use-toast';
import {
  NOTIFICATION_CATEGORIES,
  getNotificationVisuals,
  getRelativeTime,
  type NotificationTone,
} from '@/lib/notifications-ui';

type StatusFilter = 'all' | 'unread' | 'read';

function renderToneIcon(tone: NotificationTone) {
  switch (tone) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    case 'error':
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    case 'message':
      return <MessageSquare className="w-5 h-5 text-sky-500" />;
    case 'document':
      return <FileText className="w-5 h-5 text-indigo-500" />;
    case 'info':
    default:
      return <Info className="w-5 h-5 text-blue-500" />;
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    unreadCount: globalUnreadCount,
    lastIncomingNotification,
    markAsRead: contextMarkAsRead,
    markAllAsRead: contextMarkAllAsRead,
    deleteNotification: contextDeleteNotification,
    clearRead: contextClearRead,
    clearAll: contextClearAll,
    refresh: refreshContext,
  } = useNotifications();

  const [items, setItems] = useState<Notification[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory>('all');
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState<boolean>(false);
  const [clearing, setClearing] = useState<boolean>(false);

  const lastHandledIncomingId = useRef<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchPage = useCallback(
    async (targetPage: number, append: boolean = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const result = await notificationsAPI.getNotificationsPaginated({
          page: targetPage,
          limit: 20,
          is_read:
            statusFilter === 'unread'
              ? false
              : statusFilter === 'read'
              ? true
              : undefined,
          category: categoryFilter,
          search: debouncedSearch || undefined,
        });

        setItems((prev) => {
          if (!append) return result.notifications;
          const existingIds = new Set(prev.map((p) => p.id));
          const merged = [
            ...prev,
            ...result.notifications.filter((n) => !existingIds.has(n.id)),
          ];
          return merged;
        });
        setTotal(result.total);
        setPage(result.page);
        setHasMore(result.has_more);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to load notifications',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [statusFilter, categoryFilter, debouncedSearch, toast]
  );

  useEffect(() => {
    fetchPage(1, false);
  }, [fetchPage]);

  // Real-time prepend when a new notification arrives via Socket.io
  useEffect(() => {
    if (!lastIncomingNotification?.id) return;
    if (lastHandledIncomingId.current === lastIncomingNotification.id) return;
    lastHandledIncomingId.current = lastIncomingNotification.id;

    // Only prepend if it matches active filters
    if (statusFilter === 'read') return;

    const visuals = getNotificationVisuals(
      lastIncomingNotification.type,
      lastIncomingNotification.title
    );
    if (categoryFilter !== 'all' && visuals.category !== categoryFilter) return;

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      const matches =
        lastIncomingNotification.title.toLowerCase().includes(q) ||
        lastIncomingNotification.message.toLowerCase().includes(q);
      if (!matches) return;
    }

    setItems((prev) => {
      if (prev.some((n) => n.id === lastIncomingNotification.id)) return prev;
      return [lastIncomingNotification, ...prev];
    });
    setTotal((prev) => prev + 1);
  }, [lastIncomingNotification, statusFilter, categoryFilter, debouncedSearch]);

  const handleRefresh = async () => {
    await Promise.all([fetchPage(1, false), refreshContext(true)]);
  };

  const handleMarkAsRead = async (notification: Notification, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (notification.is_read) return;
    try {
      await contextMarkAsRead(notification.id);
      const readAt = new Date().toISOString();
      setItems((prev) => {
        if (statusFilter === 'unread') {
          return prev.filter((n) => n.id !== notification.id);
        }
        return prev.map((n) =>
          n.id === notification.id ? { ...n, is_read: true, read_at: readAt } : n
        );
      });
      if (statusFilter === 'unread') {
        setTotal((t) => Math.max(0, t - 1));
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark as read',
        variant: 'destructive',
      });
    }
  };

  const handleOpenNotification = async (notification: Notification) => {
    if (!notification.is_read) {
      await handleMarkAsRead(notification);
    }
    if (notification.action_url) {
      if (notification.action_url.startsWith('/')) {
        router.push(notification.action_url);
      } else {
        window.location.href = notification.action_url;
      }
    }
  };

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await contextDeleteNotification(notificationId);
      setItems((prev) => prev.filter((n) => n.id !== notificationId));
      setTotal((t) => Math.max(0, t - 1));
      toast({
        title: 'Deleted',
        description: 'Notification removed',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete notification',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await contextMarkAllAsRead();
      const readAt = new Date().toISOString();
      if (statusFilter === 'unread') {
        setItems([]);
        setTotal(0);
      } else {
        setItems((prev) => prev.map((n) => ({ ...n, is_read: true, read_at: readAt })));
      }
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark all as read',
        variant: 'destructive',
      });
    }
  };

  const handleClearRead = async () => {
    try {
      setClearing(true);
      const deletedCount = await contextClearRead();
      await fetchPage(1, false);
      toast({
        title: 'Cleared',
        description:
          deletedCount > 0
            ? `Removed ${deletedCount} read notification${deletedCount > 1 ? 's' : ''}`
            : 'No read notifications to clear',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to clear read notifications',
        variant: 'destructive',
      });
    } finally {
      setClearing(false);
    }
  };

  const handleConfirmClearAll = async () => {
    try {
      setClearing(true);
      await contextClearAll();
      setItems([]);
      setTotal(0);
      setHasMore(false);
      setClearAllDialogOpen(false);
      toast({
        title: 'Cleared',
        description: 'All notifications have been cleared',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to clear notifications',
        variant: 'destructive',
      });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl w-full mx-auto">
      {/* Header Banner */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <CardTitle className="text-xl sm:text-2xl">Notifications Center</CardTitle>
                {globalUnreadCount > 0 ? (
                  <Badge className="bg-primary text-primary-foreground">
                    {globalUnreadCount} unread
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="w-3 h-3" />
                    All caught up
                  </Badge>
                )}
              </div>
              <CardDescription className="mt-1">
                Real-time updates across internships, documents, evaluations, and messages.
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
              Refresh
            </Button>
            {globalUnreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="gap-1.5"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearRead}
              disabled={clearing}
              className="gap-1.5"
            >
              Clear read
            </Button>
            {total > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setClearAllDialogOpen(true)}
                disabled={clearing}
                className="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
                Clear all
              </Button>
            )}
          </div>
        </CardHeader>

        {/* Filter & Search Bar */}
        <CardContent className="pt-0 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Status Filter Pills */}
            <div className="inline-flex rounded-lg bg-muted p-1 w-fit">
              {(['all', 'unread', 'read'] as StatusFilter[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors',
                    statusFilter === status
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search notifications..."
                className="pl-9 h-9"
              />
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {NOTIFICATION_CATEGORIES.map((cat) => (
              <Button
                key={cat.value}
                type="button"
                variant={categoryFilter === cat.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter(cat.value)}
                className="h-7 text-xs rounded-full"
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">Loading notifications...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Bell className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <p className="text-base font-medium text-foreground">No notifications found</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              {debouncedSearch || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try clearing your active search or filters to see all notifications.'
                : "You're all caught up! New updates from your internship workflows will appear here in real time."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((notification) => {
              const visuals = getNotificationVisuals(
                notification.type,
                notification.title
              );
              const fullTimestamp = new Date(notification.created_at).toLocaleString();

              return (
                <div
                  key={notification.id}
                  onClick={() => handleOpenNotification(notification)}
                  className={cn(
                    'p-4 sm:p-5 transition-colors border-l-4 flex items-start gap-3.5',
                    notification.action_url && 'cursor-pointer hover:bg-accent/40',
                    !notification.is_read ? 'bg-accent/20' : 'bg-background',
                    visuals.borderClass
                  )}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {renderToneIcon(visuals.tone)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {!notification.is_read && (
                            <span
                              className="w-2 h-2 rounded-full bg-primary flex-shrink-0"
                              aria-label="Unread"
                            />
                          )}
                          <h3
                            className={cn(
                              'text-sm sm:text-base text-foreground',
                              !notification.is_read ? 'font-bold' : 'font-semibold'
                            )}
                          >
                            {notification.title}
                          </h3>
                          <span
                            className={cn(
                              'text-[11px] px-2 py-0.5 rounded-full font-medium',
                              visuals.badgeClass
                            )}
                          >
                            {visuals.categoryLabel}
                          </span>
                        </div>

                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                          {notification.message}
                        </p>

                        <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground/80 flex-wrap">
                          <span title={fullTimestamp}>
                            {getRelativeTime(notification.created_at)} · {fullTimestamp}
                          </span>
                          {notification.action_url && (
                            <span className="inline-flex items-center gap-1 text-primary font-medium">
                              Open <ExternalLink className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleMarkAsRead(notification, e)}
                            className="h-8 w-8 p-0"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDelete(notification.id, e)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                          title="Delete notification"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && items.length > 0 && (
          <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-muted-foreground">
              Showing {items.length} of {total} notification{total === 1 ? '' : 's'}
            </p>
            {hasMore && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchPage(page + 1, true)}
                disabled={loadingMore}
                className="gap-1.5"
              >
                {loadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Load more
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Confirm Clear All Dialog */}
      <AlertDialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {total} notification{total === 1 ? '' : 's'} from
              your inbox. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmClearAll();
              }}
              disabled={clearing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {clearing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Clear all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

