'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { notificationsAPI, type Notification } from '@/lib/api/notifications';
import { useBackendSocket } from '@/hooks/use-backend-socket';
import { useToast } from '@/hooks/use-toast';

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  lastIncomingNotification: Notification | null;
  refresh: (force?: boolean) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearRead: () => Promise<number>;
  clearAll: () => Promise<number>;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(
  undefined
);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastIncomingNotification, setLastIncomingNotification] =
    useState<Notification | null>(null);

  const { socket, isConnected } = useBackendSocket();
  const { toast } = useToast();
  const hasLoadedOnceRef = useRef(false);

  const refresh = useCallback(async (force: boolean = true) => {
    try {
      if (!hasLoadedOnceRef.current) {
        setLoading(true);
      }
      const [list, count] = await Promise.all([
        notificationsAPI.getNotifications(50, force),
        notificationsAPI.getUnreadCount().catch(() => null),
      ]);
      setNotifications(list);
      setUnreadCount(
        count !== null ? count : list.filter((n) => !n.is_read).length
      );
      hasLoadedOnceRef.current = true;
    } catch (error) {
      console.error('[NotificationsProvider] Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    refresh(true);
  }, [refresh]);

  // Re-sync whenever socket establishes/recovers connection
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (incoming: Notification) => {
      notificationsAPI.invalidateCache();

      setNotifications((prev) => {
        const exists = incoming.id && prev.some((item) => item.id === incoming.id);
        if (exists) {
          return prev.map((item) => (item.id === incoming.id ? incoming : item));
        }
        return [incoming, ...prev].slice(0, 50);
      });

      if (!incoming.is_read) {
        setUnreadCount((prev) => prev + 1);
      }

      setLastIncomingNotification(incoming);

      toast({
        title: incoming.title,
        description: incoming.message,
      });
    };

    const handleCountUpdate = (data: { count: number }) => {
      if (typeof data?.count === 'number') {
        setUnreadCount(data.count);
      }
    };

    const handleConnect = () => {
      socket.emit('notification:subscribe');
      if (hasLoadedOnceRef.current) {
        refresh(true);
      }
    };

    socket.on('new_notification', handleNewNotification);
    socket.on('notification_count_updated', handleCountUpdate);
    socket.on('connect', handleConnect);

    if (isConnected) {
      socket.emit('get_notification_count');
    }

    return () => {
      socket.off('new_notification', handleNewNotification);
      socket.off('notification_count_updated', handleCountUpdate);
      socket.off('connect', handleConnect);
    };
  }, [socket, isConnected, refresh, toast]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await notificationsAPI.markAsRead(notificationId);
    setNotifications((prev) => {
      let decremented = false;
      const updated = prev.map((n) => {
        if (n.id === notificationId && !n.is_read) {
          decremented = true;
          return { ...n, is_read: true, read_at: new Date().toISOString() };
        }
        return n;
      });
      if (decremented) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(async () => {
    await notificationsAPI.markAllAsRead();
    const now = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => (n.is_read ? n : { ...n, is_read: true, read_at: now }))
    );
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    await notificationsAPI.deleteNotification(notificationId);
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === notificationId);
      if (target && !target.is_read) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      return prev.filter((n) => n.id !== notificationId);
    });
  }, []);

  const clearRead = useCallback(async () => {
    const deletedCount = await notificationsAPI.clearReadNotifications();
    setNotifications((prev) => prev.filter((n) => !n.is_read));
    return deletedCount;
  }, []);

  const clearAll = useCallback(async () => {
    const deletedCount = await notificationsAPI.clearAllNotifications();
    setNotifications([]);
    setUnreadCount(0);
    return deletedCount;
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        lastIncomingNotification,
        refresh,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearRead,
        clearAll,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return ctx;
}

