'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, X, AlertCircle, CheckCircle, Info, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { notificationsAPI, type Notification } from '@/lib/api/notifications';
import { useBackendSocket } from '@/hooks/use-backend-socket';
import { useToast } from '@/hooks/use-toast';

interface NotificationsDropdownProps {
  /** Callback when notification is clicked */
  onNotificationClick?: (notification: Notification) => void;
}

// Helper function to format relative time
const getRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const created = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour${Math.floor(diffInSeconds / 3600) > 1 ? 's' : ''} ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} day${Math.floor(diffInSeconds / 86400) > 1 ? 's' : ''} ago`;
  return created.toLocaleDateString();
};

// Helper function to determine notification type icon
const getNotificationType = (type: string): 'info' | 'success' | 'warning' | 'error' => {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('success') || lowerType.includes('complete')) return 'success';
  if (lowerType.includes('error') || lowerType.includes('fail') || lowerType.includes('alert')) return 'error';
  if (lowerType.includes('warning') || lowerType.includes('update')) return 'warning';
  return 'info';
};

export const NotificationsDropdown = ({
  onNotificationClick,
}: NotificationsDropdownProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { socket } = useBackendSocket();

  // Load notifications from backend
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationsAPI.getNotifications(50);
      setNotifications(data);
    } catch (error: any) {
      console.error('Failed to load notifications:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load notifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadNotifications();
  }, []);

  // Socket.io real-time notifications
  useEffect(() => {
    if (!socket) return;

    // Listen for new notifications
    const handleNewNotification = (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      
      // Show toast for new notification
      toast({
        title: notification.title,
        description: notification.message,
      });
    };

    // Listen for notification count updates
    const handleCountUpdate = (data: { count: number }) => {
      // Count is handled by filtering is_read
      console.log('Notification count updated:', data.count);
    };

    socket.on('new_notification', handleNewNotification);
    socket.on('notification_count_updated', handleCountUpdate);

    return () => {
      socket.off('new_notification', handleNewNotification);
      socket.off('notification_count_updated', handleCountUpdate);
    };
  }, [socket, toast]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotificationIcon = (type: string) => {
    const displayType = getNotificationType(type);
    switch (displayType) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getNotificationBorderColor = (type: string) => {
    const displayType = getNotificationType(type);
    switch (displayType) {
      case 'success':
        return 'border-l-green-500';
      case 'error':
        return 'border-l-red-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'info':
      default:
        return 'border-l-blue-500';
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      try {
        await notificationsAPI.markAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n => (n.id === notification.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
        );
      } catch (error: any) {
        console.error('Failed to mark as read:', error);
      }
    }

    // Call external callback
    onNotificationClick?.(notification);

    // Navigate if action_url exists
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      );
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
      await notificationsAPI.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
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
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
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
      // Delete all notifications one by one
      await Promise.all(notifications.map(n => notificationsAPI.deleteNotification(n.id)));
      setNotifications([]);
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
                className="text-xs h-7 text-error hover:text-error/80"
              >
                <X className="w-3 h-3 mr-1" />
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Bell className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground/70 mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'p-4 hover:bg-accent/50 cursor-pointer transition-colors border-l-4',
                    !notification.is_read && 'bg-accent/20',
                    getNotificationBorderColor(notification.type)
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4
                            className={cn(
                              'text-sm font-semibold text-foreground',
                              !notification.is_read && 'font-bold'
                            )}
                          >
                            {notification.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-2">
                            {getRelativeTime(notification.created_at)}
                          </p>
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
                            className="h-7 w-7 p-0 text-error hover:text-error/80"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && !loading && (
          <div className="p-3 border-t border-border bg-muted/30">
            <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
              <a href="/dashboard/notifications">View all notifications</a>
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
