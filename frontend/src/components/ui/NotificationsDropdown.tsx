'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Check,
  Trash2,
  X,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Loader2,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { type Notification } from '@/lib/api/notifications';
import { useNotifications } from '@/components/providers/NotificationsProvider';
import { useUserContext } from '@/components/providers/UserProvider';
import { useToast } from '@/hooks/use-toast';
import {
  getNotificationVisuals,
  getRelativeTime,
  type NotificationTone,
} from '@/lib/notifications-ui';

interface NotificationsDropdownProps {
  /** Callback when notification is clicked */
  onNotificationClick?: (notification: Notification) => void;
}

function renderToneIcon(tone: NotificationTone) {
  switch (tone) {
    case 'success':
      return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    case 'message':
      return <MessageSquare className="w-4 h-4 text-sky-500" />;
    case 'document':
      return <FileText className="w-4 h-4 text-indigo-500" />;
    case 'info':
    default:
      return <Info className="w-4 h-4 text-blue-500" />;
  }
}

export const NotificationsDropdown = ({
  onNotificationClick,
}: NotificationsDropdownProps) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUserContext();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const viewAllHref = user?.role
    ? `/dashboard/${user.role}/notifications`
    : '/dashboard/notifications';

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      try {
        await markAsRead(notification.id);
      } catch (error: any) {
        console.error('Failed to mark as read:', error);
      }
    }

    onNotificationClick?.(notification);
    setOpen(false);

    if (notification.action_url) {
      if (notification.action_url.startsWith('/')) {
        router.push(notification.action_url);
      } else {
        window.location.href = notification.action_url;
      }
    }
  };

  const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAsRead(notificationId);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark notification as read',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId);
      toast({
        title: 'Success',
        description: 'Notification deleted',
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
      await markAllAsRead();
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

  const handleClearAll = async () => {
    try {
      await clearAll();
      toast({
        title: 'Success',
        description: 'All notifications cleared',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to clear notifications',
        variant: 'destructive',
      });
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative" aria-label="Notifications">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-white text-xs p-0 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0 z-[100]" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-foreground">Notifications</h3>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Loading...' : unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
            </p>
          </div>
          {notifications.length > 0 && !loading && (
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs h-7"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-xs h-7 text-destructive hover:text-destructive/80"
              >
                <X className="w-3 h-3 mr-1" />
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[380px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Bell className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground/70 mt-1">You&apos;re all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const visuals = getNotificationVisuals(
                  notification.type,
                  notification.title
                );
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'p-4 hover:bg-accent/50 cursor-pointer transition-colors border-l-4',
                      !notification.is_read && 'bg-accent/20',
                      visuals.borderClass
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{renderToneIcon(visuals.tone)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {!notification.is_read && (
                                <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                              )}
                              <h4
                                className={cn(
                                  'text-sm font-semibold text-foreground truncate',
                                  !notification.is_read && 'font-bold'
                                )}
                              >
                                {notification.title}
                              </h4>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-muted-foreground/70">
                                {getRelativeTime(notification.created_at)}
                              </span>
                              <span
                                className={cn(
                                  'text-[10px] px-1.5 py-0.5 rounded font-medium',
                                  visuals.badgeClass
                                )}
                              >
                                {visuals.categoryLabel}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                                className="h-7 w-7 p-0"
                                title="Mark as read"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDelete(notification.id, e)}
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive/80"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer — always visible so user can open the full Notifications Center anytime */}
        <div className="p-3 border-t border-border bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs font-medium"
            asChild
            onClick={() => setOpen(false)}
          >
            <Link href={viewAllHref}>View all notifications</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
