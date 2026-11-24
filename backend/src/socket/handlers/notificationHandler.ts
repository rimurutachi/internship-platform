import { Server, Socket } from "socket.io";
import notificationService from "../../services/notificationService";

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const setupNotificationHandlers = (
  _io: Server,
  socket: AuthenticatedSocket
) => {
  const userId = socket.user?.id;
  if (!userId) return;

  // User joins their personal notification room
  socket.join(`user:${userId}`);
  console.log(`User ${userId} joined notification room`);

  const emitRealUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadNotificationsCount(userId);
      socket.emit("notification_count_updated", { count });
    } catch (err) {
      console.error(`Failed to fetch unread count for user ${userId}:`, err);
    }
  };

  // Handle explicit subscription requests from frontend
  socket.on("notification:subscribe", async () => {
    socket.join(`user:${userId}`);
    await emitRealUnreadCount();
  });

  // Request current notification count
  socket.on("get_notification_count", async () => {
    await emitRealUnreadCount();
  });
};
